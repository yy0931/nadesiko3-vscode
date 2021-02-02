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
import * as json5 from "json5"
import documentHighlightProvider from './language_features/document_highlight_provider'
import definitionProvider from './language_features/definition_provider'
import codeLendsProvider from './language_features/code_lens'
import updateDiagnostics from './language_features/diagnostics'

export function activate(context: vscode.ExtensionContext) {
	const webNakoServer = new WebNakoServer()
	const selector = { language: "nadesiko3" }
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

	updateDecorations()
	setDiagnosticsTimeout()

	context.subscriptions.push(
		webNakoServer,
		diagnosticCollection,
		vscode.languages.registerCodeLensProvider(selector, codeLendsProvider),
		vscode.languages.registerDocumentSemanticTokensProvider(selector, semanticTokensProvider, legend),
		vscode.languages.registerDefinitionProvider(selector, definitionProvider),
		vscode.languages.registerDocumentHighlightProvider(selector, documentHighlightProvider),
		vscode.window.onDidChangeActiveTextEditor((editor) => {
			updateDecorations()
			setDiagnosticsTimeout()
		}),
		vscode.workspace.onDidChangeTextDocument((event) => {
			updateDecorations()
			setDiagnosticsTimeout()
		}),
		vscode.workspace.onDidOpenTextDocument((document) => {
			updateDecorations()
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
					}
				)
			} else {
				panel.reveal(vscode.ViewColumn.Beside)
			}

			panel.webview.html = fs.readFileSync(path.join(__dirname, "../static/webview.html")).toString()

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
					panel.webview.postMessage({ type: "output", line: s })
				} else {
					try {
						panel.webview.postMessage({ type: "output", line: json5.stringify(s) })
					} catch (e) {
						panel.webview.postMessage({ type: "output", line: `${s}` })
					}
				}
			})
			try {
				// NOTE: 「N秒後」とかを使っていると関数を抜けた後も実行され続ける
				compiler.runReset(editor.document.getText(), "")
			} catch (e) {
				panel.webview.postMessage({ type: "error", line: e.message })
			}
		}),
		vscode.commands.registerCommand("nadesiko3.compileActiveFile", () => {
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
				vscode.workspace.openTextDocument({ content, language: "javascript" })
					.then((document) => {
						vscode.window.showTextDocument(document)
					})
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
