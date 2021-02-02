import * as vscode from 'vscode'
import NakoCompiler = require('nadesiko3/src/nako3')
import { semanticTokensProvider, legend } from './semantic_tokens_provider'
import updateDecorations from './decorations'
import WebNakoServer from './web_nako_server'
import { mockPlugins } from "./nako3_plugins"

import pluginNode = require("nadesiko3/src/plugin_node")
import pluginCSV = require("nadesiko3/src/plugin_csv")
import { lex, parse } from './parse'
import { LexErrorWithSourceMap } from './tokenize'
import * as fs from "fs"
import * as path from "path"
import * as json5 from "json5"

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


const updateDiagnostics = (diagnosticCollection: vscode.DiagnosticCollection) => {
	const editor = vscode.window.activeTextEditor
	if (editor === undefined) {
		return
	}
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

const definitionProvider: vscode.DefinitionProvider = {
	provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Definition | vscode.DefinitionLink[]> {
		const parserOutput = lex(document.getText())
		if (parserOutput instanceof LexErrorWithSourceMap) {
			return
		}
		const offset = document.offsetAt(position)
		return parserOutput.tokens.flatMap((token) => {
			if (token.type !== "func") {
				return []
			}

			// カーソル下のトークンを見つける
			if (!(token.startOffset !== null && token.endOffset !== null &&
				token.startOffset <= offset && offset < token.endOffset)) {
				return []
			}

			// 定義元を取得
			const fn = parserOutput.funclist[token.value as string]
			if (fn.type !== "func") {
				throw new Error("fn.type !== 'func'")
			}
			return fn.declaration.flatMap((declaration) => {
				switch (declaration.type) {
					case "builtin": return []
					case "inFile":
						if (declaration.token.startOffset === null || declaration.token.endOffset === null) {
							return []
						}
						return [
							new vscode.Location(document.uri, new vscode.Range(
								document.positionAt(declaration.token.startOffset),
								document.positionAt(declaration.token.endOffset),
							)),
						]
					case "plugin": return [] // TODO
					default:
						const _: never = declaration
						throw new Error()
				}
			})
		})
	}
}

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
