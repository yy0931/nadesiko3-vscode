import * as vscode from 'vscode'
import NakoCompiler from './nako3/nako3'
import { plugins } from './plugins'
import { semanticTokensProvider, legend } from './semantic_tokens_provider'
import updateDecorations from './decorations'
import WebNakoServer from './web_nako_server'

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
					title: "[ ブラウザで実行 ]",
					command: "nadesiko3.runActiveFileOnBrowser",
				},
			),
			new vscode.CodeLens(
				new vscode.Range(0, 0, 0, 0),
				{
					title: "[ VSCode上で実行 ]",
					command: "nadesiko3.runActiveFileOnVSCode",
				},
			),
		];
	}
}

export function activate(context: vscode.ExtensionContext) {
	let activeTextEditor = vscode.window.activeTextEditor
	if (activeTextEditor !== undefined) {
		updateDecorations(activeTextEditor)
	}
	const webNakoServer = new WebNakoServer()
	const selector = { language: "nadesiko3" }
	context.subscriptions.push(
		webNakoServer,
		vscode.languages.registerCodeLensProvider(selector, codeLendsProvider),
		vscode.languages.registerDocumentSemanticTokensProvider(selector, semanticTokensProvider, legend),
		vscode.window.onDidChangeActiveTextEditor((editor) => {
			if (editor === undefined) {
				return
			}
			activeTextEditor = editor
			updateDecorations(editor)
		}),
		vscode.workspace.onDidChangeTextDocument((event) => {
			activeTextEditor = vscode.window.activeTextEditor
			if (activeTextEditor === undefined) {
				return
			}
			updateDecorations(activeTextEditor)
		}),
		vscode.workspace.onDidOpenTextDocument((document) => {
			activeTextEditor = vscode.window.activeTextEditor
			if (activeTextEditor === undefined) {
				return
			}
			updateDecorations(activeTextEditor)
		}),
		vscode.workspace.onDidCloseTextDocument((doc) => {
			activeTextEditor = undefined
		}),
		vscode.commands.registerCommand("nadesiko3.runActiveFileOnVSCode", () => {
			activeTextEditor = vscode.window.activeTextEditor
			if (activeTextEditor === undefined) {
				vscode.window.showErrorMessage("ファイルが開かれていません")
				return
			}
			const compiler = new NakoCompiler()
			for (const plugin of plugins) {
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
				compiler.runReset(activeTextEditor.document.getText())
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
			for (const plugin of plugins) {
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
