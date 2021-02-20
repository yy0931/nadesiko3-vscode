import * as vscode from "vscode"
import { LanguageFeatures, BackgroundTokenizer, AceDocument, TokenType, EditorMarkers } from "nadesiko3/src/wnako3_editor"
import * as NakoCompiler from "nadesiko3/src/nako3"
import * as path from "path"
import * as fs from "fs"
import * as util from "util"
import * as PluginNode from "nadesiko3/src/plugin_node"

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
		default:
			const _: never = type
			return null
	}
}

let backgroundTokenizer: { v: BackgroundTokenizer, editor: vscode.TextEditor, listeners: (() => void)[], waitTokenUpdate: () => Promise<void> } | null = null
let panel: vscode.WebviewPanel | null = null

export function activate(context: vscode.ExtensionContext) {
	const selector: vscode.DocumentSelector = { language: "nadesiko3", scheme: undefined }
	const nako3 = new NakoCompiler()
	nako3.addPluginObject('PluginNode', PluginNode)

	// 「表示」の動作を上書き
	nako3.setFunc("表示", [["と", "を", "の"]], (s: any, sys: any) => {
		if (panel === null) {
			return
		}
		// 文字列の場合はutil.inspectに掛けると''で囲まれてしまうため、そのまま送信
		if (typeof s === "string") {
			panel.webview.postMessage({ type: "out", line: s })
			return
		}
		panel.webview.postMessage({ type: "out", line: util.inspect(s, { depth: null }) })
	})

	const diagnosticCollection = vscode.languages.createDiagnosticCollection("nadesiko3")

	const onChange = () => {
		const editor = vscode.window.activeTextEditor

		// エディタの値に変更があったときの処理
		if (backgroundTokenizer !== null) {
			backgroundTokenizer.v.dirty = true
		}

		// 以下、エディタが変更された時の処理
		if (editor === undefined || editor === backgroundTokenizer?.editor) {
			return
		}
		if (backgroundTokenizer !== null) {
			backgroundTokenizer.v.dispose()
			backgroundTokenizer.listeners.forEach((f) => f())
			backgroundTokenizer.listeners = []
		}
		if (editor.document.languageId !== "nadesiko3") {
			diagnosticCollection.delete(editor.document.uri)
			return
		}
		let listeners = new Array<() => void>()
		backgroundTokenizer = {
			v: new BackgroundTokenizer(
				new DocumentAdapter(editor),
				nako3,
				(firstRow, lastRow, ms) => {
					diagnosticCollection.delete(editor.document.uri)
					listeners.forEach((f) => f())
					listeners = []
				},
				(code, err) => {
					const range = new vscode.Range(...EditorMarkers.fromError(code, err, (row) => editor.document.lineAt(row).text))
					diagnosticCollection.set(editor.document.uri, [new vscode.Diagnostic(range, err.message, vscode.DiagnosticSeverity.Error)])
					listeners.forEach((f) => f())
					listeners = []
				},
			),
			editor,
			listeners,
			waitTokenUpdate: () => new Promise<void>((resolve) => { listeners.push(() => { resolve() }) })
		}
	}

	const languageFeatures = new LanguageFeatures(AceRange, nako3)

	context.subscriptions.push(
		diagnosticCollection,
		vscode.window.onDidChangeActiveTextEditor(() => { onChange() }),
		vscode.window.onDidChangeTextEditorOptions(() => { onChange() }),
		vscode.workspace.onDidCloseTextDocument((doc) => { diagnosticCollection.delete(doc.uri) }),
		vscode.workspace.onDidChangeConfiguration(() => { onChange() }),
		vscode.workspace.onDidChangeTextDocument((e) => { onChange() }),
		vscode.languages.registerCompletionItemProvider(selector, {
			provideCompletionItems(document, position, token, context) {
				return LanguageFeatures.getSnippets(document.getText()).map((item) => {
					const snippet = new vscode.CompletionItem(item.caption, vscode.CompletionItemKind.Snippet)
					snippet.detail = item.meta
					snippet.insertText = new vscode.SnippetString(item.snippet)
					return snippet
				})
			}
		}),
		vscode.languages.registerDocumentSemanticTokensProvider(selector, {
			provideDocumentSemanticTokens: async (document) => {
				const tokensBuilder = new vscode.SemanticTokensBuilder(legend)
				if (document !== backgroundTokenizer?.editor.document) {
					return
				}
				if (backgroundTokenizer.v.dirty) {
					await backgroundTokenizer.waitTokenUpdate()
				}
				for (let line = 0; line < document.lineCount; line++) {
					let character = 0
					const tokens = backgroundTokenizer.v.getTokens(line) || []
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
				await nako3.loadDependencies(code, fileName, "", {
					resolvePath: (name) => {
						if (path.isAbsolute(name)) {
							name = path.resolve(name)
						} else {
							name = path.resolve(path.join(context.extensionPath, name))
						}
						if (/\.js(\.txt)?$/.test(name) || /^[^\.]*$/.test(name)) {
							return { filePath: name, type: 'js' }
						}
						if (/\.nako3?(\.txt)?$/.test(name)) {
							return { filePath: name, type: 'nako3' }
						}
						return { filePath: name, type: 'invalid' }
					},
					readNako3: (name) => ({ sync: true, value: fs.readFileSync(name).toString() }),
					readJs: (name) => ({ sync: true, value: require(name) }),
				})
				nako3.runReset(code, fileName)
			} catch (e) {
				panel.webview.postMessage({ type: "err", line: e.message })
			}
		}),
	)
}

export function deactivate() {
	backgroundTokenizer?.v.dispose()
	panel?.dispose()
}
