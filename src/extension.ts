import * as vscode from 'vscode'
import NakoCompiler = require('nadesiko3/src/nako3')
import { semanticTokensProvider, legend } from './semantic_tokens_provider'
import updateDecorations from './decorations'
import WebNakoServer from './web_nako_server'
import { mockPlugins } from "./nako3_plugins"

import pluginNode = require("nadesiko3/src/plugin_node")
import pluginCSV = require("nadesiko3/src/plugin_csv")
import { parse } from './parse'
import { LexErrorWithSourceMap } from './tokenize'

const codeLendsProvider: vscode.CodeLensProvider = {
	provideCodeLenses(
		document: vscode.TextDocument,
		token: vscode.CancellationToken,
	): vscode.ProviderResult<vscode.CodeLens[]> {
		if (document.getText().length <= 2) {
			return []
		}
		return [
			new vscode.CodeLens(
				new vscode.Range(0, 0, 0, 0),
				{
					title: "$(play) ブラウザで実行",
					command: "nadesiko3.runActiveFileOnBrowser",
				},
			),
			new vscode.CodeLens(
				new vscode.Range(0, 0, 0, 0),
				{
					title: "$(play) VSCode上で実行",
					command: "nadesiko3.runActiveFileOnVSCode",
				},
			),
		];
	}
}


const updateDiagnostics = (editor: vscode.TextEditor, diagnosticCollection: vscode.DiagnosticCollection) => {
	if (editor.document.languageId !== "nadesiko3") {
		diagnosticCollection.delete(editor.document.uri)
		return
	}
	const code = editor.document.getText()
	const parserOutput = parse(code)
	if ("ok" in parserOutput) {
		diagnosticCollection.delete(editor.document.uri)
		return
	}
	if (parserOutput.err instanceof LexErrorWithSourceMap) {
		diagnosticCollection.set(editor.document.uri, [new vscode.Diagnostic(
			new vscode.Range(
				editor.document.positionAt(parserOutput.err.startOffset || 0),
				editor.document.positionAt(parserOutput.err.endOffset === null ? code.length : parserOutput.err.endOffset),
			),
			parserOutput.err.message,
			vscode.DiagnosticSeverity.Error,
		)])
	} else { // ParseError
		let { startOffset, endOffset } = parserOutput.err

		// 空白文字だとdiagnosticsのホバーを表示できないため、一方を動かす。
		while (/^\s*$/.test(code.slice(startOffset, endOffset))) {
			if (startOffset > 0) {
				startOffset--
			} else if (endOffset < code.length) {
				endOffset++
			} else {
				break
			}
		}

		const start = editor.document.positionAt(startOffset)
		const end = editor.document.positionAt(endOffset)

		const message = `${parserOutput.err.token.type}: ${parserOutput.err.message}`

		const severity = vscode.DiagnosticSeverity.Error
		if (parserOutput.err.token.type === "eol") {
			diagnosticCollection.set(editor.document.uri, [new vscode.Diagnostic(editor.document.lineAt(start).range, message, severity)])
		} else if (parserOutput.err.token.type === "eof") {
			// TODO: 最終行じゃなくて、スタックの積み始めの位置を表示したい。
			diagnosticCollection.set(editor.document.uri, [new vscode.Diagnostic(editor.document.lineAt(start).range, message, severity)])
		} else {
			diagnosticCollection.set(editor.document.uri, [new vscode.Diagnostic(new vscode.Range(start, end), message, severity)])
		}
	}
}

export function activate(context: vscode.ExtensionContext) {
	let activeTextEditor = vscode.window.activeTextEditor
	if (activeTextEditor !== undefined) {
		updateDecorations(activeTextEditor)
	}
	const webNakoServer = new WebNakoServer()
	const selector = { language: "nadesiko3" }
	const diagnosticCollection = vscode.languages.createDiagnosticCollection("nadesiko3")

	context.subscriptions.push(
		webNakoServer,
		diagnosticCollection,
		vscode.languages.registerCodeLensProvider(selector, codeLendsProvider),
		vscode.languages.registerDocumentSemanticTokensProvider(selector, semanticTokensProvider, legend),
		vscode.window.onDidChangeActiveTextEditor((editor) => {
			activeTextEditor = editor
			if (activeTextEditor === undefined) {
				return
			}
			updateDecorations(activeTextEditor)
			updateDiagnostics(activeTextEditor, diagnosticCollection)
		}),
		vscode.workspace.onDidChangeTextDocument((event) => {
			activeTextEditor = vscode.window.activeTextEditor
			if (activeTextEditor === undefined) {
				return
			}
			updateDecorations(activeTextEditor)
			updateDiagnostics(activeTextEditor, diagnosticCollection)
		}),
		vscode.workspace.onDidOpenTextDocument((document) => {
			activeTextEditor = vscode.window.activeTextEditor
			if (activeTextEditor === undefined) {
				return
			}
			updateDecorations(activeTextEditor)
			updateDiagnostics(activeTextEditor, diagnosticCollection)
		}),
		vscode.workspace.onDidCloseTextDocument((doc) => {
			activeTextEditor = undefined
			diagnosticCollection.delete(doc.uri)
		}),
		vscode.commands.registerCommand("nadesiko3.runActiveFileOnVSCode", () => {
			activeTextEditor = vscode.window.activeTextEditor
			if (activeTextEditor === undefined) {
				vscode.window.showErrorMessage("ファイルが開かれていません")
				return
			}
			const compiler = new NakoCompiler()
			for (const plugin of [pluginNode, pluginCSV]) {
				compiler.addPlugin(plugin)
			}
			// 「表示」の動作を上書き
			compiler.setFunc('表示', [['を', 'と']], (s: any, sys: any) => {
				if (typeof s === "string") {
					vscode.window.showInformationMessage(s)
				} else {
					try {
						vscode.window.showInformationMessage(JSON.stringify(s))
					} catch (e) {
						vscode.window.showInformationMessage(`${s}`)
					}
				}
				sys.__varslist[0]['表示ログ'] += (s + '\n')
			})
			try {
				// NOTE: 「N秒後」とかを使っていると関数を抜けた後も実行され続ける
				compiler.runReset(activeTextEditor.document.getText(), "")
			} catch (e) {
				vscode.window.showErrorMessage(e.message)
			}
		}),
		vscode.commands.registerCommand("nadesiko3.compileActiveFile", () => {
			activeTextEditor = vscode.window.activeTextEditor
			if (activeTextEditor === undefined) {
				vscode.window.showErrorMessage("ファイルが開かれていません")
				return
			}
			const compiler = new NakoCompiler()
			for (const plugin of Object.values(mockPlugins)) {
				compiler.addPlugin(plugin)
			}
			let content: string | null = null
			try {
				content = compiler.compile(activeTextEditor.document.getText(), activeTextEditor.document.fileName, false)
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
			activeTextEditor = vscode.window.activeTextEditor
			if (activeTextEditor === undefined) {
				vscode.window.showErrorMessage("ファイルが開かれていません")
				return
			}
			webNakoServer.runCode(activeTextEditor.document.fileName, activeTextEditor.document.getText())
		}),
	)
}

export function deactivate() { }
