const vscode = require("vscode")
const { LanguageFeatures, BackgroundTokenizer, EditorMarkers } = require("nadesiko3/src/wnako3_editor")
const { getIndent } = require("nadesiko3/src/nako_indent")
const path = require('path')
const fs = require('fs')
const nodeHTMLParser = require("node-html-parser")
const ExtensionNako3Compiler = require("./compiler")
const { ReadonlyDocumentAdapter, DocumentAdapter } = require("./document_adapter")
const prepare = require("./prepare")

/**
 * semantic highlight に使うtypeとmodifierのリスト。
 * 使える名前は https://code.visualstudio.com/api/language-extensions/semantic-highlight-guide#semantic-token-classification に書いてある。
 * そこに書いていない名前を使うと大抵の場合色が付かないが、package.jsonの contributes.semanticTokenScopes でtmlanguageのよくあるscope名に変換すれば色が付く。
 */
const legend = new vscode.SemanticTokensLegend(
	["variable", "function", "macro", "comment", "string", "keyword", "number", "operator"], // tokenTypes
	["readonly", "underline"])  // tokenModifiers。underlineはpackage.jsonでtmlanguageのmarkup.underlineに変換して下線を引いている。
exports.legend = legend

/**
 * Aceのtoken typeをVSCodeのtoken typeにマップする。[type, modifiers] を返す。返す値はlegendで定義されている必要がある。
 * @returns {[string, string[]] | null}
 */
const mapTokenType = (/** @type {string} */type) => {
	const modifiers = /** @type {Array<string>} */([])
	if (type.endsWith(".markup.underline")) {
		type = type.replace(".markup.underline", "")
		modifiers.push("underline")
	}
	switch (type) {
		case "comment.block": return ["comment", modifiers]
		case "comment.line": return ["comment", modifiers]
		case "constant.numeric": return ["number", modifiers]
		case "entity.name.function": return ["function", modifiers]
		case "keyword.control": return ["keyword", modifiers]
		case "keyword.operator": return ["operator", modifiers]
		case "markup.other": return null
		case "string.other": return ["string", modifiers]
		case "support.constant": return ["variable", [...modifiers, "readonly"]]
		case "variable.language": return ["macro", modifiers]
		case "variable.other": return ["variable", modifiers]
		case "composition_placeholder": return null
		default:
			return null
	}
}

// `position` の位置にあるトークンを取得する。
const getTokenAt = (/** @type {BackgroundTokenizer} */backgroundTokenizer, /** @type {vscode.Position} */position) => {
	const tokens = backgroundTokenizer.getTokens(position.line)
	let left = 0
	for (let i = 0; i < tokens.length; i++) {
		if (position.character < left + tokens[i].value.length) {
			return { left, token: tokens[i] }
		}
		left += tokens[i].value.length
	}
	return null
}
exports.getTokenAt = getTokenAt

const sleep = (/** @type {number} */ms) => /** @type {Promise<void>} */new Promise((resolve) => setTimeout(resolve, ms))
exports.sleep = sleep

// 5秒間試してだめだったらエラーを投げる。
/** @type {<T>(f: () => Promise<T>) => Promise<T>} */
const retry = async (f) => {
	const startTime = Date.now()
	while (true) {
		try {
			return await f()
		} catch (err) {
			if (Date.now() - startTime < 5000) {
				await sleep(100)
				continue
			}
			throw err
		}
	}
}
exports.retry = retry


const safeReaddirSync = (/** @type {string} */filepath) => {
	try {
		return fs.readdirSync(filepath)
	} catch (e) {
		console.log(e)
		return []
	}
}

const toSnakeCase = (/** @type {string} */s) => s.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase()).replace(/^_+/, "")

// 現在フォーカスされているエディタの状態を持つ変数
/** @type {{
	readonly backgroundTokenizer: BackgroundTokenizer
	readonly editor: vscode.TextEditor
	readonly listeners: (() => void)[]
	waitTokenUpdate(): Promise<void>
	code: string | null
	needValidation: boolean
	dispose(): void
	readonly nako3: ExtensionNako3Compiler
} | null} */
let state = null
/** @type {vscode.WebviewPanel | null} */
let panel = null

// 拡張機能が有効化されるとこの関数が呼ばれる。有効化されるタイミングは package.json のactivationEventsで定義される。
exports.activate = function activate(/** @type {vscode.ExtensionContext} */context) {
	const docs = prepare()

	/** @type {vscode.DocumentSelector} */
	const selector = { language: "nadesiko3", scheme: undefined }

	const diagnosticCollection = vscode.languages.createDiagnosticCollection("nadesiko3")

	// VSCodeの状態に変更があるたびに呼び出す関数。
	const update = () => {
		// 別の言語のファイルならファイルが開かれていないとする。
		const editor = vscode.window.activeTextEditor?.document.languageId === "nadesiko3" ? vscode.window.activeTextEditor : undefined

		// エディタが閉じられたとき
		if (state !== null && state.editor !== editor) {
			state.dispose()
			state = null
		}

		// 新しくフォーカスされたエディタが無いとき
		if (editor === undefined) {
			return
		}

		// 別のエディタをフォーカスしたとき
		if (state?.editor !== editor) {
			const listeners = /** @type {Array<() => void>} */([])
			const nako3 = new ExtensionNako3Compiler()
			state = {
				backgroundTokenizer: new BackgroundTokenizer(
					new DocumentAdapter(editor),
					nako3,
					(firstRow, lastRow, ms) => { listeners.forEach((f) => f()); listeners.length = 0 },
					(code, err) => { listeners.forEach((f) => f()); listeners.length = 0 },
					true,
				),
				editor,
				listeners,
				waitTokenUpdate: () => /** @type {Promise<void>} */(new Promise((resolve) => { listeners.push(() => { resolve() }) })),
				code: null,
				needValidation: true,
				dispose() {
					this.backgroundTokenizer.dispose()
					this.listeners.forEach((f) => f())
					this.listeners.length = 0
					diagnosticCollection.delete(this.editor.document.uri)
				},
				nako3,
			}
			try {
				const code = state.editor.document.getText()
				const file = state.editor.document.fileName
				state.nako3.loadDependencies(code, file, context.extensionPath, state.editor.document.isUntitled)
			} catch (e) {
				console.log(e)
			}
		}

		// エディタの値に変更があったとき
		if (state.code !== state.editor.document.getText()) {
			state.code = state.editor.document.getText()
			state.backgroundTokenizer.dirty = true
			state.needValidation = true
		}
	}

	// 定期的に構文エラーを確認して、あれば波線を引く。
	{
		let canceled = false
		const validateSyntax = async () => {
			if (canceled) {
				return
			}
			if (state !== null && state.needValidation) {
				state.needValidation = false
				const code = state.editor.document.getText()
				const file = state.editor.document.fileName
				const diagnostics = /** @type {vscode.Diagnostic[]} */([])
				const logger = state.nako3.replaceLogger()
				logger.addListener('warn', ({ position, level, noColor }) => {
					if (position.file === file && (level === 'warn' || level === 'error')) {
						const range = new vscode.Range(...EditorMarkers.fromError(code, { ...position, message: noColor }, (row) => code.split('\n')[row] || ''))
						diagnostics.push(new vscode.Diagnostic(range, noColor, level === 'error' ? vscode.DiagnosticSeverity.Error : vscode.DiagnosticSeverity.Warning))
					}
				})
				try {
					await state.nako3.loadDependencies(code, file, context.extensionPath, state.editor.document.isUntitled)
					state.nako3.reset()
					state.nako3.compile(code, file, false)
				} catch (err) {
					state.nako3.logger.error(err)
				}
				diagnosticCollection.set(state.editor.document.uri, diagnostics)
			}
			setTimeout(() => { validateSyntax().catch(console.error) }, 500)
		}
		validateSyntax().catch(console.error)

		context.subscriptions.push({ dispose() { canceled = true } })
	}

	/** @type {readonly string[]} */
	const builtinPluginNames = safeReaddirSync(ExtensionNako3Compiler.getPluginDirectory(context.extensionPath))
		.filter((f) => f.startsWith("plugin_") && f.endsWith(".js"))

	// subscriptionsに { dispose(): any } を実装するオブジェクトをpushしておくと、拡張機能の deactivate() 時に自動的に dispose() を呼んでくれる。
	context.subscriptions.push(
		diagnosticCollection,

		// エディタの状態に変更があるたびに update() を呼ぶ。
		vscode.window.onDidChangeActiveTextEditor(() => { update() }),
		vscode.window.onDidChangeTextEditorOptions(() => { update() }),
		vscode.workspace.onDidOpenTextDocument(() => { update() }),
		vscode.workspace.onDidChangeConfiguration(() => { update() }),
		vscode.workspace.onDidChangeTextDocument((e) => { update() }),

		// エディタ（上のファイル）が閉じられたとき
		vscode.workspace.onDidCloseTextDocument((doc) => { diagnosticCollection.delete(doc.uri) }),

		// プログラムにマウスカーソルを重ねた時に表示するメッセージを生成する関数を設定する。
		vscode.languages.registerHoverProvider(selector, {
			provideHover(document, position) {
				update()
				if (state === null) {
					return
				}
				const token = getTokenAt(state.backgroundTokenizer, position)
				if (token === null || !token.token.docHTML) {
					return
				}
				// 例: `（Aを）表示する<span class="tooltip-plugin-name">PluginSystem</span>`
				const root = nodeHTMLParser.parse(token.token.docHTML)
				const signature = root.childNodes[0].innerText
				const pluginName = root.childNodes.length >= 2 ? root.childNodes[1].innerText : ""
				const name = signature.lastIndexOf('）') === -1 ? signature : signature.slice(signature.lastIndexOf('）') + 1)
				const doc = docs[toSnakeCase(pluginName)]?.[name]
				return new vscode.Hover(
					"```\n" + signature + "\n```\n\n" + pluginName + (doc ? '\n\n---\n\n' + doc : ''),
					new vscode.Range(position.line, token.left, position.line, token.left + token.token.value.length),
				)
			}
		}),

		// オートコンプリートのリストを生成する関数を設定する。
		vscode.languages.registerCompletionItemProvider(selector, {
			provideCompletionItems(document, position, token, _context) {
				update()
				if (state === null) {
					return []
				}

				const left = document.lineAt(position.line).text.slice(0, position.character)
				// 行が"！「"で始まってカーソルより左に"」"が無いなら、ファイル名を補完する。
				const indent = getIndent(left)
				if ((left.slice(indent.length).startsWith("!「") || left.slice(indent.length).startsWith("！「")) && !left.includes("」")) {
					const prefix = left.slice(indent.length + 2)
					// ./ か ../ で始まるならローカルのファイル名を補完する。そうでなければ組み込みのプラグイン名を補完する。
					if ((/^\.\.?(\/|\\)/.test(prefix)) && !state.editor.document.isUntitled) {
						const items = /** @type {vscode.CompletionItem[]} */([])

						// prefix="./" のとき basename="", range=[2, 2], dirname="./"
						// prefix="./foo/bar" のとき basename="bar", range=[6, 9], dirname="./foo"
						// prefix="./foo/" のとき basename="", range=[6, 6], dirname="./foo"
						const basename = (prefix.endsWith("/") || prefix.endsWith("\\")) ? "" : path.basename(prefix)
						const range = new vscode.Range(position.line, position.character - basename.length, position.line, position.character)
						const dirname = path.join(path.dirname(state.editor.document.fileName), (prefix.endsWith("/") || prefix.endsWith("\\")) ? prefix : path.dirname(prefix))

						for (const basename of safeReaddirSync(dirname)) {
							if (fs.statSync(path.join(dirname, basename)).isDirectory()) {
								const item = new vscode.CompletionItem(basename, vscode.CompletionItemKind.Folder)
								item.range = range
								items.push(item)
							} else {
								const item = new vscode.CompletionItem(basename, vscode.CompletionItemKind.File)
								item.range = range
								items.push(item)
							}
						}
						return items
					} else {
						return builtinPluginNames.map((v) => {
							const item = new vscode.CompletionItem(v.replace(/\.js$/, ''), vscode.CompletionItemKind.Module)
							item.range = new vscode.Range(position.line, position.character - prefix.length, position.line, position.character)
							return item
						})
					}
				} else {
					const prefix = LanguageFeatures.getCompletionPrefix(left, state.nako3)
					return [
						// スニペット
						...LanguageFeatures.getSnippets(document.getText()).map((item) => {
							const snippet = new vscode.CompletionItem(item.caption, vscode.CompletionItemKind.Snippet)
							snippet.detail = item.meta
							snippet.insertText = new vscode.SnippetString(item.snippet)
							return snippet
						}),
						// 変数名、関数名
						...LanguageFeatures.getCompletionItems(position.line, prefix, state.nako3, state.backgroundTokenizer).map((item) => {
							const completion = new vscode.CompletionItem(item.caption, item.meta === '変数' ? vscode.CompletionItemKind.Variable : vscode.CompletionItemKind.Function)
							completion.insertText = item.value
							const doc = docs[toSnakeCase(item.meta)]?.[item.value]
							if (doc) {
								completion.documentation = new vscode.MarkdownString(doc)
							}
							completion.detail = item.meta
							completion.filterText = item.value
							completion.range = new vscode.Range(position.line, position.character - prefix.length, position.line, position.character)
							return completion
						})
					]
				}
			}
		}),

		// 動的にシンタックスハイライトするための関数を設定する。
		vscode.languages.registerDocumentSemanticTokensProvider(selector, {
			provideDocumentSemanticTokens: async (document) => {
				const tokensBuilder = new vscode.SemanticTokensBuilder(legend)
				update()
				if (document !== state?.editor.document) { return }
				if (state.backgroundTokenizer.dirty) { await state.waitTokenUpdate() }
				if (document !== state?.editor.document) { return } // await中に別のエディタに切り替わった場合
				for (let line = 0; line < document.lineCount; line++) {
					let character = 0
					const tokens = state.backgroundTokenizer.getTokens(line) || []
					for (const token of tokens) {
						const type = mapTokenType(token.type)
						if (type !== null) {
							tokensBuilder.push(new vscode.Range(line, character, line, character + token.value.length), ...type)
						}
						character += token.value.length
					}
				}
				return tokensBuilder.build()
			}
		}, legend),

		// プログラム上にボタンを表示させる。
		vscode.languages.registerCodeLensProvider(selector, {
			/** @returns {vscode.ProviderResult<vscode.CodeLens[]>} */
			provideCodeLenses: (/** @type {vscode.TextDocument} */document, /** @type {vscode.CancellationToken} */token) => {
				const lens = /** @type {vscode.CodeLens[]} */([])
				for (const v of LanguageFeatures.getCodeLens(new ReadonlyDocumentAdapter(document))) {
					lens.push(new vscode.CodeLens(
						new vscode.Range(v.start.row, 0, v.start.row, 0),
						{
							title: v.command.title,
							command: "nadesiko3.runActiveFile",
							arguments: [v.command.arguments[0]],
						},
					))
				}
				if (document.getText().length >= 3) {
					lens.push(new vscode.CodeLens(
						new vscode.Range(0, 0, 0, 0),
						{
							title: "$(play) ファイルを実行",
							command: "nadesiko3.runActiveFile",
						},
					))
				}
				return lens
			}
		}),

		vscode.commands.registerCommand("nadesiko3.testActiveFile", async () => {
			await vscode.commands.executeCommand("nadesiko3.runActiveFile", true)
		}),

		// なでしこ言語のコンパイラのバージョンの変更
		vscode.commands.registerCommand("nadesiko3.selectCompiler", async () => {
			try {
				const fetch = require("node-fetch").default

				const res = await vscode.window.showWarningMessage("注意:\n1. この拡張機能はすべてのコンパイラのバージョンには対応していません。インストールするコンパイラのバージョンによってはなでしこ言語のVSCode拡張機能が起動しなくなる可能性があります。その場合、拡張機能を再インストールすることで初期化できます。\n2. コンパイラのバージョンは拡張機能のバージョンを更新するとリセットされます。この問題は将来修正される可能性があります。", { modal: true }, "確認")
				if (res !== "確認") {
					return
				}

				// コンパイラのバージョンのリストを取得する
				/** @type {{ name: string, zipball_url: string, tarball_url: string, commit: { sha: string, url: string }, node_id: string }[]} */
				const tags = await fetch(`https://api.github.com/repos/kujirahand/nadesiko3/tags`).then((res) => res.json())

				// バージョン番号の選択
				const picked = await vscode.window.showQuickPick(tags.map((tag) => /** @type {vscode.QuickPickItem} */({ label: tag.name, description: `commit:${tag.commit.sha.slice(0, 6)}` })), { canPickMany: false, placeHolder: "インストールするバージョンを選択...", matchOnDescription: true })
				if (picked === undefined) {
					return
				}
				const tag = picked.label

				await vscode.window.withProgress({ title: "コンパイラをダウンロードしています...", location: vscode.ProgressLocation.Notification, cancellable: true }, async (progress, token) => {
					// GitHubからコンパイラのソースコードをダウンロードする
					const ac = new (require("abort-controller").default)()
					token.onCancellationRequested(() => { ac.abort() })
					const buf = await fetch(`https://github.com/kujirahand/nadesiko3/archive/${tag}.zip`, { signal: ac.signal }).then((res) => res.buffer())

					// Zipファイルとして解凍して node_modules/nadesiko3 に配置
					new (require("adm-zip"))(buf).extractEntryTo(`nadesiko3-${tag}/`, context.extensionPath)
					const dst = path.join(context.extensionPath, "node_modules/nadesiko3")
					fs.rmSync(dst, { recursive: true })
					fs.renameSync(path.join(context.extensionPath, `nadesiko3-${tag}`), dst)
				})

				vscode.window.showInformationMessage(`${tag} に更新しました。VSCodeを再起動してください。`) // NOTE: メッセージが短くないと後ろのほうが隠れてしまう
			} catch (err) {
				vscode.window.showErrorMessage(`なでしこ言語の更新に失敗: ${err}`)
				console.error(err)
			}
		}),

		// [ファイルを実行] ボタンを押したときの動作を設定する。
		vscode.commands.registerCommand("nadesiko3.runActiveFile", async (/** @type {string | boolean | vscode.ExtensionContext} */test = false, /** @type {boolean} */vscodeTest = false) => {
			// menusのボタンから実行すると第一引数にExtensionContextが渡される。
			if (typeof test === "object") {
				test = false
			}
			// ファイルが開かれていないならエラーメッセージを表示して終了。
			const editor = vscode.window.activeTextEditor
			if (editor === undefined) {
				vscode.window.showErrorMessage("ファイルが開かれていません")
				if (vscodeTest) { throw new Error('ファイルが開かれていません') }
				return
			}

			// 結果を表示するためのWebviewPanelを生成する。すでに存在すれば前面に出す。
			if (panel === null) {
				panel = vscode.window.createWebviewPanel("nadesiko3Output", "なでしこv3: プログラムの出力", vscode.ViewColumn.Beside, {
					enableScripts: true,
					localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, "webview"))]
				})
				const webviewDir = path.join(context.extensionPath, "webview")
				panel.webview.html = fs.readFileSync(path.join(webviewDir, "webview.html")).toString()
					.replace("{index.css}", panel.webview.asWebviewUri(vscode.Uri.file(path.join(webviewDir, "index.css"))).toString())
					.replace("{webview.js}", panel.webview.asWebviewUri(vscode.Uri.file(path.join(webviewDir, "webview.js"))).toString())
					.replace("{index.js}", panel.webview.asWebviewUri(vscode.Uri.file(path.join(webviewDir, "index.js"))).toString())
				panel.onDidDispose(() => { panel = null }, null, context.subscriptions)
			} else {
				panel.reveal(vscode.ViewColumn.Beside)
			}

			// プログラムを実行
			const nako3 = new ExtensionNako3Compiler()
			const logger = nako3.replaceLogger()
			logger.addListener('warn', ({ html }) => {
				panel?.webview.postMessage({ type: 'output', html })
			})
			const code = editor.document.getText()
			const fileName = editor.document.fileName
			if (/^[！!][「『]plugin_browser[」』]を取り込む/.test(code)) {
				logger.warn("plugin_browserを取り込んでいますが、この拡張機能はブラウザでの実行には対応していません。")
			}
			try {
				try {
					await nako3.loadDependencies(code, fileName, context.extensionPath, editor.document.isUntitled)
				} catch (err) {
					logger.error(err)
					throw err
				}
				let nakoGlobal
				if (typeof test === "string") {
					nakoGlobal = nako3.test(code, fileName, "", test)
				} else if (test) {
					nakoGlobal = nako3.test(code, fileName)
				} else {
					nakoGlobal = nako3.run(code, fileName)
				}
				if (vscodeTest) {
					/** @type {unknown} */
					let returnValue
					const d = panel.webview.onDidReceiveMessage((/** @type {unknown} */data) => { returnValue = data }, undefined, context.subscriptions)
					try {
						await panel.webview.postMessage('getHTML')
						// プログラムの実行結果とwebviewに表示されているHTMLを返す。
						return {
							log: nakoGlobal.log + '',
							html: await retry(async () => {
								if (returnValue === undefined) { throw new Error('returnValue is undefined') }
								return returnValue
							}),
						}
					} finally {
						d.dispose()
					}
				}
			} catch (err) { // エラーはloggerから取る。
				if (vscodeTest) { throw err }
			}
		}),
	)
}

exports.deactivate = function deactivate() {
	state?.dispose()
	panel?.dispose()
}
