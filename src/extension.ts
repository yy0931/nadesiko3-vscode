import * as vscode from "vscode"
import { LanguageFeatures, BackgroundTokenizer, AceDocument, TokenType, EditorMarkers } from "nadesiko3/src/wnako3_editor"
import * as NakoCompiler from "nadesiko3/src/nako3"
const CNako3 = require("nadesiko3/src/cnako3")
import * as path from "path"
import * as fs from "fs"
import * as util from "util"
import * as PluginNode from "nadesiko3/src/plugin_node"
import { NakoImportError } from "nadesiko3/src/nako_errors"
import * as nodeHTMLParser from "node-html-parser"

class AceRange {
	constructor(
		public readonly startLine: number,
		public readonly startColumn: number,
		public readonly endLine: number,
		public readonly endColumn: number,
	) { }
}

/**
 * VSCodeのDocumentをAceのDocumentとして使う。
 */
class DocumentAdapter implements AceDocument {
	constructor(private readonly editor: vscode.TextEditor) { }
	getLine(row: number) { return this.editor.document.lineAt(row).text }
	getAllLines() { return this.editor.document.getText().split("\n") }
	getLength() { return this.editor.document.lineCount }
	insertInLine(position: { row: number, column: number }, text: string) {
		this.editor.edit((builder) => { builder.insert(new vscode.Position(position.row, position.column), text) })
			.then(undefined, (err) => { console.error(err) })
	}
	removeInLine(row: number, columnStart: number, columnEnd: number) {
		this.editor.edit((builder) => { builder.delete(new vscode.Range(row, columnStart, row, columnEnd)) })
			.then(undefined, (err) => { console.error(err) })
	}
	replace(range: AceRange, text: string) {
		this.editor.edit((builder) => { builder.replace(new vscode.Range(range.startLine, range.startColumn, range.endLine, range.endColumn), text) })
			.then(undefined, (err) => { console.error(err) })
	}
}

type VSCodeTokenType = "namespace" | "class" | "enum" | "interface" | "struct" | "typeParameter" | "type" | "parameter" | "variable" | "property" | "enumMember" | "event" | "function" | "method" | "macro" | "label" | "comment" | "string" | "keyword" | "number" | "regexp" | "operator"

const legend = new vscode.SemanticTokensLegend(
	["namespace", "class", "enum", "interface", "struct", "typeParameter", "type", "parameter", "variable", "property", "enumMember", "event", "function", "method", "macro", "label", "comment", "string", "keyword", "number", "regexp", "operator"] as VSCodeTokenType[],
	["declaration", "definition", "readonly", "static", "deprecated", "abstract", "async", "modification", "documentation", "defaultLibrary"])

/**
 * Aceのtoken typeをVSCodeのtoken typeにマップする。
 */
const mapTokenType = (type: TokenType): [VSCodeTokenType, string[]] | null => {
	switch (type) {
		case "comment.block": return ["comment", []]
		case "comment.line": return ["comment", []]
		case "constant.numeric": return ["number", []]
		case "entity.name.function": return ["function", []]
		case "keyword.control": return ["keyword", []]
		case "keyword.operator": return ["operator", []]
		case "markup.other": return null
		case "string.other": return ["string", []]
		case "support.constant": return ["variable", ["readonly"]]
		case "variable.language": return ["macro", []]
		case "variable.other": return ["variable", []]
		case "composition_placeholder": return null
		default:
			const _: never = type
			return null
	}
}

// `offset`の位置にあるトークンを取得
export const getTokenAt = (backgroundTokenizer: BackgroundTokenizer, position: vscode.Position) => {
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

let state: {
	backgroundTokenizer: BackgroundTokenizer
	editor: vscode.TextEditor
	listeners: (() => void)[]
	waitTokenUpdate: () => Promise<void>
	code: string | null
	needValidation: boolean
} | null = null
let panel: vscode.WebviewPanel | null = null

export function activate(context: vscode.ExtensionContext) {
	const selector: vscode.DocumentSelector = { language: "nadesiko3", scheme: undefined }
	const nako3 = new NakoCompiler()
	nako3.addPluginObject('PluginNode', PluginNode)

	// 「表示」の動作を上書き
	nako3.addPluginObject("nadesiko3-vscode", {
		"表示": {
			type: "func",
			josi: [["と", "を", "の"]],
			fn: (s: any, sys: any) => {
				if (panel === null) {
					return
				}
				// 文字列の場合はutil.inspectに掛けると''で囲まれてしまうため、そのまま送信
				if (typeof s === "string") {
					panel.webview.postMessage({ type: "out", line: s })
					return
				}
				panel.webview.postMessage({ type: "out", line: util.inspect(s, { depth: null }) })
			}
		},
	})

	const diagnosticCollection = vscode.languages.createDiagnosticCollection("nadesiko3")

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
			let listeners = new Array<() => void>()
			state = {
				backgroundTokenizer: new BackgroundTokenizer(
					new DocumentAdapter(editor),
					nako3,
					(firstRow, lastRow, ms) => { listeners.forEach((f) => f()); listeners = [] },
					(code, err) => { listeners.forEach((f) => f()); listeners = [] },
				),
				editor,
				listeners,
				waitTokenUpdate: () => new Promise<void>((resolve) => { listeners.push(() => { resolve() }) }),
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

	{
		let canceled = false
		const validateSyntax = () => {
			if (canceled) {
				return
			}
			if (state !== null && state.needValidation) {
				state.needValidation = false
				const code = state.editor.document.getText()
				try {
					nako3.parse(code, state.editor.document.fileName)
					diagnosticCollection.set(state.editor.document.uri, [])
				} catch (err) {
					const range = new vscode.Range(...EditorMarkers.fromError(code, err, (row) => code.split('\n')[row] || ''))
					diagnosticCollection.set(state.editor.document.uri, [new vscode.Diagnostic(range, err.message, vscode.DiagnosticSeverity.Error)])
				}
			}
			setTimeout(validateSyntax, 500)
		}
		validateSyntax()
		context.subscriptions.push({ dispose() { canceled = true } })
	}

	context.subscriptions.push(
		diagnosticCollection,
		vscode.window.onDidChangeActiveTextEditor(() => { update() }),
		vscode.window.onDidChangeTextEditorOptions(() => { update() }),
		vscode.workspace.onDidOpenTextDocument(() => { update() }),
		vscode.workspace.onDidCloseTextDocument((doc) => { diagnosticCollection.delete(doc.uri) }),
		vscode.workspace.onDidChangeConfiguration(() => { update() }),
		vscode.workspace.onDidChangeTextDocument((e) => { update() }),
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
		vscode.languages.registerDocumentSemanticTokensProvider(selector, {
			provideDocumentSemanticTokens: async (document) => {
				const tokensBuilder = new vscode.SemanticTokensBuilder(legend)
				const id = Math.floor(Math.random() * 100000)
				if (document !== state?.editor.document) {
					return
				}
				if (state.backgroundTokenizer.dirty) {
					await state.waitTokenUpdate()
				}
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
		vscode.languages.registerCodeLensProvider(selector, {
			provideCodeLenses: (
				document: vscode.TextDocument,
				token: vscode.CancellationToken,
			): vscode.ProviderResult<vscode.CodeLens[]> => {
				if (document.getText().length <= 2) {
					return []
				}
				return [
					new vscode.CodeLens(
						new vscode.Range(0, 0, 0, 0),
						{
							title: "$(play) ファイルを実行",
							command: "nadesiko3.runActiveFile",
						},
					),
				];
			}
		}),
		vscode.commands.registerCommand("nadesiko3.runActiveFile", async () => {
			const editor = vscode.window.activeTextEditor
			if (editor === undefined) {
				vscode.window.showErrorMessage("ファイルが開かれていません")
				return
			}
			if (panel === null) {
				panel = vscode.window.createWebviewPanel("nadesiko3Output", "なでしこv3: プログラムの出力", vscode.ViewColumn.Beside, {
					enableScripts: true,
					localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, "static"))]
				})
				const staticDir = path.join(context.extensionPath, "static")
				panel.webview.html = fs.readFileSync(path.join(staticDir, "webview.html")).toString()
					.replace("{index.css}", panel.webview.asWebviewUri(vscode.Uri.file(path.join(staticDir, "index.css"))).toString())
					.replace("{webview.js}", panel.webview.asWebviewUri(vscode.Uri.file(path.join(staticDir, "webview.js"))).toString())
					.replace("{index.js}", panel.webview.asWebviewUri(vscode.Uri.file(path.join(staticDir, "index.js"))).toString())

				panel.onDidDispose(() => { panel = null }, null, context.subscriptions)
			} else {
				panel.reveal(vscode.ViewColumn.Beside)
			}

			try {
				const code = editor.document.getText()
				const fileName = editor.document.fileName
				const srcDir = path.join(context.extensionPath, "node_modules/nadesiko3/src")
				const log = new Array<string>()

				// コメントを書いた部分以外はCNako3のコードと同じ
				await nako3.loadDependencies(code, fileName, "", {
					resolvePath: (name, token) => {
						if (/\.js(\.txt)?$/.test(name) || /^[^\.]*$/.test(name)) {
							return { filePath: path.resolve(CNako3.findPluginFile(name, fileName, srcDir, log)), type: 'js' } // 変更: __dirnameがたとえ node: { __dirname: true } を指定したとしても正しい値にならない
						}
						if (/\.nako3?(\.txt)?$/.test(name)) {
							if (path.isAbsolute(name)) {
								return { filePath: path.resolve(name), type: 'nako3' }
							} else {
								if (editor.document.isUntitled) {
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
							return { sync: true, value: eval(`require(${JSON.stringify(name)})`) } // 変更: こうしないとrequireがwebpackに解析されてしまう https://github.com/webpack/webpack/issues/4175#issuecomment-323023911
						} catch (err) {
							throw new NakoImportError(`プラグイン ${name} の取り込みに失敗: ${err.message}\n検索したパス: ${log.join(', ')}`, token.line, token.file)
						}
					},
				})
				nako3.runReset(code, fileName)

				// 依存ファイルの読み込みによってエラーが解消されうるため、dirtyをtrueにして再度エラーをチェックさせる。
				if (state !== null) {
					state.needValidation = true
				}
			} catch (e) {
				panel.webview.postMessage({ type: "err", line: e.message })
			}
		}),
	)
}

export function deactivate() {
	state?.backgroundTokenizer.dispose()
	panel?.dispose()
}
