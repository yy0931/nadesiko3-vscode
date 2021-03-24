const vscode = require("vscode")
const { LanguageFeatures, BackgroundTokenizer, AceDocument, EditorMarkers } = require("nadesiko3/src/wnako3_editor")
const NakoCompiler = require("nadesiko3/src/nako3")
const CNako3 = require("nadesiko3/src/cnako3")
const path = require('path')
const fs = require('fs')
const util = require('util')
const PluginNode = require('nadesiko3/src/plugin_node')
const { NakoImportError } = require("nadesiko3/src/nako_errors")
const nodeHTMLParser = require("node-html-parser")

/**
 * ace editor に依存せずにAceと同じ形式のRangeクラスを使う。
 */
class AceRange {
	constructor(/** @type {number} */startLine, /** @type {number} */startColumn, /** @type {number} */endLine, /** @type {number} */endColumn) {
		/** @public @readonly */this.startLine = startLine
		/** @public @readonly */this.startColumn = startColumn
		/** @public @readonly */this.endLine = endLine
		/** @public @readonly */this.endColumn = endColumn
	}
}

/**
 * vscode.TextDocument をAceのDocumentとして使う。
 * @implements {AceDocument}
 */
class ReadonlyDocumentAdapter {
	constructor(/** @type {vscode.TextDocument} */document) {
		/** @private @readonly */ this.document = document
	}
	getLine(/** @type {number} */row) { return this.document.lineAt(row).text }
	getAllLines() { return this.document.getText().split("\n") }
	getLength() { return this.document.lineCount }
	insertInLine(/** @type {{ row: number, column: number }} */position, /** @type {string} */text) { throw new Error("not implemented") }
	removeInLine(/** @type {number} */row, /** @type {number} */columnStart, /** @type {number} */columnEnd) { throw new Error("not implemented") }
	replace(/** @type {AceRange} */range, /** @type {string} */text) { throw new Error("not implemented") }
}

/**
 * vscode.TextEditor をAceのDocumentとして使う。
 * @implements {AceDocument}
 */
class DocumentAdapter {
	constructor(/** @type {vscode.TextEditor} */editor) {
		/** @private @readonly */ this.editor = editor
	}
	getLine(/** @type {number} */row) { return this.editor.document.lineAt(row).text }
	getAllLines() { return this.editor.document.getText().split("\n") }
	getLength() { return this.editor.document.lineCount }
	insertInLine(/** @type {{ row: number, column: number }} */position, /** @type {string} */text) {
		this.editor.edit((builder) => { builder.insert(new vscode.Position(position.row, position.column), text) })
			.then(undefined, (err) => { console.error(err) })
	}
	removeInLine(/** @type {number} */row, /** @type {number} */columnStart, /** @type {number} */columnEnd) {
		this.editor.edit((builder) => { builder.delete(new vscode.Range(row, columnStart, row, columnEnd)) })
			.then(undefined, (err) => { console.error(err) })
	}
	replace(/** @type {AceRange} */range, /** @type {string} */text) {
		this.editor.edit((builder) => { builder.replace(new vscode.Range(range.startLine, range.startColumn, range.endLine, range.endColumn), text) })
			.then(undefined, (err) => { console.error(err) })
	}
}

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

// 依存ファイルを取り込む。コメントを書いた部分以外はCNako3のコードと同じ
// NOTE: ウェブから依存するファイルをダウンロードできるように変更する場合は、diagnosticsで使うとき、loadDependenciesを呼ばないか、手動で実行されたときに存在した依存ファイルだけをホワイトリストで許可するべき。
const loadDependencies = (/** @type {NakoCompiler} */nako3, /** @type {string} */code, /** @type {string} */fileName, /** @type {string} */extensionPath, /** @type {boolean} */isUntitled) => {
	const srcDir = path.join(extensionPath, "node_modules/nadesiko3/src")
	const log = /** @type {Array<string>} */([])
	return nako3.loadDependencies(code, fileName, "", {
		resolvePath: (name, token) => {
			if (/\.js(\.txt)?$/.test(name) || /^[^.]*$/.test(name)) {
				return { filePath: path.resolve(CNako3.findPluginFile(name, fileName, srcDir, log)), type: 'js' } // 変更: __dirnameがたとえ node: { __dirname: true } を指定したとしても正しい値にならない
			}
			if (/\.nako3?(\.txt)?$/.test(name)) {
				if (path.isAbsolute(name)) {
					return { filePath: path.resolve(name), type: 'nako3' }
				} else {
					if (isUntitled) {
						throw new NakoImportError("相対パスによる取り込み文を使うには、ファイルを保存してください。", token.line, token.file) // 追加: Untitledなファイルではファイルパスを取得できない
					}
					return { filePath: path.join(path.dirname(token.file), name), type: 'nako3' }
				}
			}
			return { filePath: name, type: 'invalid' }
		},
		readNako3: (name, token) => {
			if (!fs.existsSync(name)) {
				throw new NakoImportError(`ファイル ${name} が存在しません。`, token.line, token.file)
			}
			return { sync: true, value: fs.readFileSync(name).toString() }
		},
		readJs: (name, token) => {
			try {
				return { sync: true, value: () => require(name) }
			} catch (/** @type {unknown} */err) {
				throw new NakoImportError(`プラグイン ${name} の取り込みに失敗: ${err instanceof Error ? err.message : err + ''}\n検索したパス: ${log.join(', ')}`, token.line, token.file)
			}
		},
	})
}

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

// 現在フォーカスされているエディタの状態を持つ変数
/** @type {{
	backgroundTokenizer: BackgroundTokenizer
	editor: vscode.TextEditor
	listeners: (() => void)[]
	waitTokenUpdate: () => Promise<void>
	code: string | null
	needValidation: boolean
} | null} */
let state = null
/** @type {vscode.WebviewPanel | null} */
let panel = null

// 拡張機能が有効化されるとこの関数が呼ばれる。有効化されるタイミングは package.json のactivationEventsで定義される。
exports.activate = function activate(/** @type {vscode.ExtensionContext} */context) {
	/** @type {vscode.DocumentSelector} */
	const selector = { language: "nadesiko3", scheme: undefined }
	const nako3 = new NakoCompiler()
	nako3.addPluginObject('PluginNode', PluginNode)

	const diagnosticCollection = vscode.languages.createDiagnosticCollection("nadesiko3")

	// VSCodeの状態に変更があるたびに呼び出す関数。
	const update = () => {
		// 別の言語のファイルならファイルが開かれていないとする。
		const editor = vscode.window.activeTextEditor?.document.languageId === "nadesiko3" ? vscode.window.activeTextEditor : undefined

		// エディタが閉じられたとき
		if (state !== null && state.editor !== editor) {
			state.backgroundTokenizer.dispose()
			state.listeners.forEach((f) => f())
			state.listeners = []
			diagnosticCollection.delete(state.editor.document.uri)
			state = null
		}

		// 新しくフォーカスされたエディタが無いとき
		if (editor === undefined) {
			return
		}

		// 別のエディタをフォーカスしたとき
		if (state?.editor !== editor) {
			let listeners = /** @type {Array<() => void>} */([])
			state = {
				backgroundTokenizer: new BackgroundTokenizer(
					new DocumentAdapter(editor),
					nako3,
					(firstRow, lastRow, ms) => { listeners.forEach((f) => f()); listeners = [] },
					(code, err) => { listeners.forEach((f) => f()); listeners = [] },
					true,
				),
				editor,
				listeners,
				waitTokenUpdate: () => /** @type {Promise<void>} */(new Promise((resolve) => { listeners.push(() => { resolve() }) })),
				code: null,
				needValidation: true,
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
				const logger = nako3.replaceLogger()
				logger.addListener('warn', ({ position, level, noColor }) => {
					if (position.file === file && (level === 'warn' || level === 'error')) {
						const range = new vscode.Range(...EditorMarkers.fromError(code, { ...position, message: noColor }, (row) => code.split('\n')[row] || ''))
						diagnostics.push(new vscode.Diagnostic(range, noColor, level === 'error' ? vscode.DiagnosticSeverity.Error : vscode.DiagnosticSeverity.Warning))
					}
				})
				try {
					await loadDependencies(nako3, code, file, context.extensionPath, state.editor.document.isUntitled)
					nako3.reset()
					nako3.compile(code, file, false)
				} catch (err) {
					nako3.logger.error(err)
				}
				diagnosticCollection.set(state.editor.document.uri, diagnostics)
			}
			setTimeout(() => { validateSyntax().catch(console.error) }, 500)
		}
		validateSyntax().catch(console.error)

		context.subscriptions.push({ dispose() { canceled = true } })
	}

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
				return new vscode.Hover("```\n" + root.childNodes[0].innerText + "\n```\n\n" + (root.childNodes.length >= 2 ? root.childNodes[1].innerText : ""), new vscode.Range(position.line, token.left, position.line, token.left + token.token.value.length))
			}
		}),

		// オートコンプリートのリストを生成する関数を設定する。
		vscode.languages.registerCompletionItemProvider(selector, {
			provideCompletionItems(document, position, token, context) {
				update()
				if (state === null) {
					return []
				}
				const prefix = LanguageFeatures.getCompletionPrefix(document.lineAt(position.line).text, nako3)
				return [
					...LanguageFeatures.getSnippets(document.getText()).map((item) => {
						const snippet = new vscode.CompletionItem(item.caption, vscode.CompletionItemKind.Snippet)
						snippet.detail = item.meta
						snippet.insertText = new vscode.SnippetString(item.snippet)
						return snippet
					}),
					...LanguageFeatures.getCompletionItems(position.line, prefix, nako3, state.backgroundTokenizer).map((item) => {
						const completion = new vscode.CompletionItem(item.caption, item.meta === '変数' ? vscode.CompletionItemKind.Variable : vscode.CompletionItemKind.Function)
						completion.insertText = item.value
						completion.detail = item.meta
						completion.filterText = item.value
						completion.range = new vscode.Range(position.line, position.character - prefix.length, position.line, position.character)
						return completion
					})
				]
			}
		}),

		// 動的にシンタックスハイライトするための関数を設定する。
		vscode.languages.registerDocumentSemanticTokensProvider(selector, {
			provideDocumentSemanticTokens: async (document) => {
				const tokensBuilder = new vscode.SemanticTokensBuilder(legend)
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
			const logger = nako3.replaceLogger()
			logger.addListener('warn', ({ html }) => {
				panel?.webview.postMessage({ type: 'output', html })
			})
			const code = editor.document.getText()
			const fileName = editor.document.fileName
			try {
				try {
					await loadDependencies(nako3, code, fileName, context.extensionPath, editor.document.isUntitled)
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
	state?.backgroundTokenizer.dispose()
	panel?.dispose()
}
