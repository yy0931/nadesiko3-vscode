import * as vscode from 'vscode'
import jsBeutify = require("js-beautify")

import * as fs from "fs"
import * as path from "path"
import * as util from 'util'

import NakoCompiler = require('nadesiko3/src/nako3')
import pluginNode = require("nadesiko3/src/plugin_node")
import pluginCSV = require("nadesiko3/src/plugin_csv")
import { lex, parse } from './nadesiko3/nako3'
import { LexError } from './nadesiko3/nako_lexer'
import { mockPlugins } from "./nako3_plugins"

import WebNakoServer from './web_nako_server'
import documentHighlightProvider from './language_features/document_highlight_provider'
import codeLendsProvider from './language_features/code_lens'
import DefinitionProvider from './language_features/definition_provider'
import { createDeclarationFile } from './document'
import * as abs from "./language_features/abstract_vscode"
import updateDiagnostics from "./language_features/diagnostics"
import LanguageFeatures from './language_features'

export function activate(context: vscode.ExtensionContext) {
	const webNakoServer = new WebNakoServer(context.extensionPath)
	const selector: vscode.DocumentSelector = { language: "nadesiko3", scheme: undefined }
	const diagnosticCollection = vscode.languages.createDiagnosticCollection("nadesiko3")
	let panel: vscode.WebviewPanel | null = null

	// シンタックスエラーの表示が速すぎるとコードを打っている最中に全体に赤線が引かれてしまうため、
	// ドキュメントに変更があったら、その後0.5秒間変更が無い場合に限り、シンタックスエラーを表示する。
	let diagnosticsCount = 0
	const setDiagnosticsTimeout = () => {
		diagnosticsCount++
		const count = diagnosticsCount
		setTimeout(() => {
			if (count === diagnosticsCount) {
				updateDiagnostics(diagnosticCollection)
			}
		}, 500);
	}

	const virtualDocuments = new Map<string, string>()

	// overwrite = false の場合、呼ぶたびにメモリを消費していくことに注意
	const showVirtualDocument = async (content: string, name: string, extension: string, overwrite: boolean, show: boolean): Promise<vscode.Uri> => {
		let documentPath = `${name}${extension}`
		if (!overwrite) {
			let i = 2
			while (virtualDocuments.has(documentPath)) {
				documentPath = `${name}-${i}${extension}`
				i++
			}
		}
		virtualDocuments.set(documentPath, content)
		const url = vscode.Uri.parse(`nadesiko3:${documentPath}`)
		if (show) {
			const document = await vscode.workspace.openTextDocument(url)
			vscode.window.showTextDocument(document, { viewColumn: vscode.ViewColumn.Beside })
		}
		return url
	}

	const VSCodeRange = vscode.Range as unknown as abs.TypeofVSCodeRange

	// 各プラグインの宣言ファイルを作る
	const declarationFiles = Object.entries(mockPlugins).map(([name, plugin]) => createDeclarationFile(name, plugin))

	const tokenDecorationType = vscode.window.createTextEditorDecorationType({
		after: {
			contentText: '|',
			color: 'transparent',
			width: '1px',
		},
		dark: {
			after: {
				backgroundColor: '#737373',
			}
		},
		light: {
			after: {
				backgroundColor: '#bbbbbb',
			}
		}
	})

	const josiDecorationType = vscode.window.createTextEditorDecorationType({
		textDecoration: "underline",
	})

	const languageFeatures = new LanguageFeatures(vscode.SemanticTokensBuilder, vscode.SemanticTokensLegend, declarationFiles, vscode.MarkdownString, vscode.Uri, true, VSCodeRange, vscode.Position)

	const updateDecorations = async () => {
		const editor = vscode.window.activeTextEditor
		if (editor === undefined) {
			return
		}
		if (editor.document.languageId !== "nadesiko3") {
			editor.setDecorations(tokenDecorationType, [])
			editor.setDecorations(josiDecorationType, [])
			return
		}
		const decorations = await languageFeatures.getDecorations(editor.document)
		editor.setDecorations(tokenDecorationType, decorations.tokenDecorations as vscode.DecorationOptions[])
		editor.setDecorations(josiDecorationType, decorations.josiDecorations as vscode.DecorationOptions[])
	}

	updateDecorations().catch((err) => { console.error(err) })
	setDiagnosticsTimeout()

	context.subscriptions.push(
		{ dispose() { virtualDocuments.clear() } },
		webNakoServer,
		diagnosticCollection,
		vscode.workspace.registerTextDocumentContentProvider("nadesiko3-plugin-declaration", {
			provideTextDocumentContent(uri: vscode.Uri): string {
				const file = declarationFiles.find((file) => file.name === uri.path)
				if (file === undefined) {
					console.log(`プラグインの宣言ファイル ${uri.path} が見つかりません。`)
					return ""
				}
				return file.content
			}
		}),
		vscode.workspace.registerTextDocumentContentProvider("nadesiko3", {
			provideTextDocumentContent(uri: vscode.Uri): string {
				return virtualDocuments.get(uri.path) || ""
			}
		}),
		vscode.languages.registerCodeLensProvider(selector, codeLendsProvider),
		vscode.languages.registerDocumentSemanticTokensProvider(selector, languageFeatures, languageFeatures.legend),
		vscode.languages.registerDefinitionProvider(selector, new DefinitionProvider(declarationFiles)),
		vscode.languages.registerDocumentHighlightProvider(selector, documentHighlightProvider),
		vscode.window.onDidChangeActiveTextEditor((editor) => {
			updateDecorations().catch((err) => { console.error(err) })
			setDiagnosticsTimeout()
		}),
		vscode.workspace.onDidChangeTextDocument((event) => {
			updateDecorations().catch((err) => { console.error(err) })
			setDiagnosticsTimeout()
		}),
		vscode.workspace.onDidOpenTextDocument((document) => {
			updateDecorations().catch((err) => { console.error(err) })
			setDiagnosticsTimeout()
		}),
		vscode.workspace.onDidCloseTextDocument((doc) => {
			diagnosticCollection.delete(doc.uri)
		}),
		vscode.commands.registerCommand("nadesiko3.runActiveFileOnVSCode", () => {
			const editor = vscode.window.activeTextEditor
			if (editor === undefined) {
				vscode.window.showErrorMessage("ファイルが開かれていません")
				return
			}
			if (panel === null) {
				panel = vscode.window.createWebviewPanel(
					"nadesiko3Output",
					"なでしこv3: プログラムの出力",
					vscode.ViewColumn.Beside,
					{
						enableScripts: true,
						localResourceRoots: [
							vscode.Uri.file(path.join(context.extensionPath, "static"))
						]
					}
				)
			} else {
				panel.reveal(vscode.ViewColumn.Beside)
			}

			{
				const staticDir = path.join(context.extensionPath, "static")
				panel.webview.html = fs.readFileSync(path.join(staticDir, "webview.html")).toString()
					.replace("{index.css}", panel.webview.asWebviewUri(vscode.Uri.file(path.join(staticDir, 'index.css'))).toString())
					.replace("{webview.js}", panel.webview.asWebviewUri(vscode.Uri.file(path.join(staticDir, 'webview.js'))).toString())
					.replace("{index.js}", panel.webview.asWebviewUri(vscode.Uri.file(path.join(staticDir, 'index.js'))).toString())
			}

			panel.onDidDispose(() => {
				panel = null
			}, null, context.subscriptions)

			const compiler = new NakoCompiler()
			for (const plugin of [pluginNode, pluginCSV]) {
				compiler.addPlugin(plugin)
			}
			// 「表示」の動作を上書き
			compiler.setFunc('表示', [['と', 'を', 'の']], (s: any, sys: any) => {
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
			try {
				// NOTE: 「N秒後」とかを使っていると関数を抜けた後も実行され続ける
				compiler.runReset(editor.document.getText(), "")
			} catch (e) {
				panel.webview.postMessage({ type: "err", line: e.message })
			}
		}),
		vscode.commands.registerCommand("nadesiko3.showJs", async () => {
			const editor = vscode.window.activeTextEditor
			if (editor === undefined) {
				vscode.window.showErrorMessage("ファイルが開かれていません")
				return
			}
			const compiler = new NakoCompiler()
			for (const plugin of Object.values(mockPlugins)) {
				compiler.addPlugin(plugin)
			}
			let content: string | null = null
			try {
				content = compiler.compile(editor.document.getText(), editor.document.fileName, false)
			} catch (e) {
				vscode.window.showErrorMessage(e.message)
			}
			if (content !== null) {
				showVirtualDocument(content, "out", ".js", false, true)
			}
		}),
		vscode.commands.registerCommand("nadesiko3.showBeautifiedJs", async () => {
			const editor = vscode.window.activeTextEditor
			if (editor === undefined) {
				vscode.window.showErrorMessage("ファイルが開かれていません")
				return
			}
			const compiler = new NakoCompiler()
			for (const plugin of Object.values(mockPlugins)) {
				compiler.addPlugin(plugin)
			}
			let content: string | null = null
			try {
				content = compiler.compile(editor.document.getText(), editor.document.fileName, false)
			} catch (e) {
				vscode.window.showErrorMessage(e.message)
			}
			if (content !== null) {
				let code = jsBeutify.js(content, { end_with_newline: true })
				code = code.replace(/;;+$/gm, ";") // 2重のセミコロンを適当に消す
				showVirtualDocument(code, "out", ".js", false, true)
			}
		}),
		vscode.commands.registerCommand('nadesiko3.showTokens', () => {
			const editor = vscode.window.activeTextEditor
			if (editor === undefined) {
				vscode.window.showErrorMessage("ファイルが開かれていません")
				return
			}
			const result = lex(editor.document.getText())
			if (result instanceof LexError) {
				vscode.window.showErrorMessage("コンパイルエラー")
			} else {
				showVirtualDocument(util.inspect(result.tokens, { depth: null }), "ast", ".js", false, true)
			}
		}),
		vscode.commands.registerCommand('nadesiko3.showSimplifiedTokens', () => {
			const editor = vscode.window.activeTextEditor
			if (editor === undefined) {
				vscode.window.showErrorMessage("ファイルが開かれていません")
				return
			}
			const result = lex(editor.document.getText())
			if (result instanceof LexError) {
				vscode.window.showErrorMessage("コンパイルエラー")
			} else {
				for (const token of result.tokens) {
					const obj = token as any
					delete obj["file"]
					delete obj["line"]
					delete obj["column"]
					delete obj["preprocessedCodeOffset"]
					delete obj["preprocessedCodeLength"]
					delete obj["startOffset"]
					delete obj["endOffset"]
					delete obj["rawJosi"]
					if (typeof obj.meta === "object" && obj.meta !== null) {
						delete obj.meta["declaration"]
					}
				}
				showVirtualDocument(util.inspect(result.tokens, { depth: null }), "ast", ".js", false, true)
			}
		}),
		vscode.commands.registerCommand('nadesiko3.showAst', () => {
			const editor = vscode.window.activeTextEditor
			if (editor === undefined) {
				vscode.window.showErrorMessage("ファイルが開かれていません")
				return
			}
			const result = parse(editor.document.getText())
			if ("ok" in result) {
				showVirtualDocument(util.inspect(result.ok, { depth: null }), "ast", ".js", false, true)
			} else {
				vscode.window.showErrorMessage("コンパイルエラー")
			}
		}),
		vscode.commands.registerCommand('nadesiko3.showSimplifiedAst', () => {
			const editor = vscode.window.activeTextEditor
			if (editor === undefined) {
				vscode.window.showErrorMessage("ファイルが開かれていません")
				return
			}
			const result = parse(editor.document.getText())
			if ("ok" in result) {
				const simplifyAst = (ast: any): void => {
					if (ast.type === "eol" || ast.type === "eof") {
						delete ast["value"]
						delete ast["josi"]
					}
					for (const key of ["line", "declaration", "column", "file", "preprocessedCodeOffset", "preprocessedCodeLength", "startOffset", "endOffset", "rawJosi"]) {
						delete ast[key]
					}
					for (const key of Object.keys(ast)) {
						if (typeof ast[key] === 'object' && ast[key] !== null && typeof ast[key].type === "string") {
							simplifyAst(ast[key])
						} else if (Array.isArray(ast[key])) {
							for (const child of ast[key]) {
								if (typeof child === "object" && child !== null && typeof child.type === "string") {
									simplifyAst(child)
								}
							}
						}
					}
				}
				simplifyAst(result.ok)
				showVirtualDocument(util.inspect(result.ok, { depth: null }), "ast", ".js", false, true)
			} else {
				vscode.window.showErrorMessage("コンパイルエラー")
			}
		}),
		vscode.commands.registerCommand("nadesiko3.runActiveFileOnBrowser", () => {
			const editor = vscode.window.activeTextEditor
			if (editor === undefined) {
				vscode.window.showErrorMessage("ファイルが開かれていません")
				return
			}
			webNakoServer.runCode(editor.document.fileName, editor.document.getText())
		}),
	)
}

export function deactivate() { }
