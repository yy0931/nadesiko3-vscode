import * as vscode from 'vscode'
import NakoCompiler = require('nadesiko3/src/nako3')
import { semanticTokensProvider, legend } from './language_features/semantic_tokens_provider'
import updateDecorations from './language_features/decorations'
import WebNakoServer from './web_nako_server'
import { mockPlugins } from "./nako3_plugins"

import pluginNode = require("nadesiko3/src/plugin_node")
import pluginCSV = require("nadesiko3/src/plugin_csv")
import * as fs from "fs"
import * as path from "path"
import documentHighlightProvider from './language_features/document_highlight_provider'
import codeLendsProvider from './language_features/code_lens'
import updateDiagnostics from './language_features/diagnostics'
import DefinitionProvider from './language_features/definition_provider'
import { createDeclarationFile } from './document'
import * as util from 'util'

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

	// 各プラグインの宣言ファイルを作る
	const declarationFiles = Object.entries(mockPlugins).map(([name, plugin]) => createDeclarationFile(name, plugin))

	updateDecorations(declarationFiles)
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
		vscode.languages.registerDocumentSemanticTokensProvider(selector, semanticTokensProvider, legend),
		vscode.languages.registerDefinitionProvider(selector, new DefinitionProvider(declarationFiles)),
		vscode.languages.registerDocumentHighlightProvider(selector, documentHighlightProvider),
		vscode.window.onDidChangeActiveTextEditor((editor) => {
			updateDecorations(declarationFiles)
			setDiagnosticsTimeout()
		}),
		vscode.workspace.onDidChangeTextDocument((event) => {
			updateDecorations(declarationFiles)
			setDiagnosticsTimeout()
		}),
		vscode.workspace.onDidOpenTextDocument((document) => {
			updateDecorations(declarationFiles)
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
				if (typeof s === "string") {
					panel.webview.postMessage({ type: "out", line: s })
				} else {
					try {
						panel.webview.postMessage({ type: "out", line: util.inspect(s) })
					} catch (e) {
						panel.webview.postMessage({ type: "out", line: `${s}` })
					}
				}
			})
			try {
				// NOTE: 「N秒後」とかを使っていると関数を抜けた後も実行され続ける
				compiler.runReset(editor.document.getText(), "")
			} catch (e) {
				panel.webview.postMessage({ type: "err", line: e.message })
			}
		}),
		vscode.commands.registerCommand("nadesiko3.compileActiveFile", async () => {
			// FIXME: `「{表示ログクリア}」を表示する` のコンパイル結果が一致しない。return_none === true になっていないとか？
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
