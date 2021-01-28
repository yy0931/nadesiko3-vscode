import * as vscode from 'vscode'
import { LexError } from "./tokenize"
import { lex } from "./parse"
import NakoCompiler from './nako3/nako3'
import { plugins } from './plugins'


export function activate(context: vscode.ExtensionContext) {
	const tokenDecorationType = vscode.window.createTextEditorDecorationType({
		after: {
			backgroundColor: 'gray',
			contentText: '|',
			color: 'transparent',
			width: '1px',
		},
	})

	const updateDecorations = (editor: vscode.TextEditor) => {
		if (editor.document.languageId !== "nadesiko3") {
			editor.setDecorations(tokenDecorationType, [])
			return
		}

		const code = editor.document.getText()
		const tokens = lex(code)
		if (tokens instanceof LexError) {
			editor.setDecorations(tokenDecorationType, [])
			return
		}

		// 全角半角の統一処理
		const decorations = new Array<vscode.DecorationOptions>()
		for (const token of [...tokens.commentTokens, ...tokens.tokens]) {
			if (token.startOffset === null || token.endOffset === null) {
				continue
			}
			const start = editor.document.positionAt(token.startOffset)
			const end = editor.document.positionAt(token.endOffset)
			const text = code.slice(token.startOffset, token.endOffset)

			// 0文字なら無視
			if (start.isEqual(end) || text.trim() === "" || ['eol', 'eof'].includes(token.type)) {
				continue
			}

			let hoverMessage = new vscode.MarkdownString("")
			if (token.type === "func" && (token.value as string) in tokens.funclist && tokens.funclist[token.value as string].type === "func") {
				const phrase = (tokens.funclist[token.value as string].josi as string[][])
					.map((clause) => clause.length === 1 ? `〜${clause[0]} ` : `〜[${clause.join("|")}] `)
					.join("") + token.value
				hoverMessage = hoverMessage.appendText(`${text}: ${token.type}\n${phrase}`)
			} else {
				hoverMessage = hoverMessage.appendText(`${text}` + (text !== token.type ? `: ${token.type}` : ``) + (text !== token.value ? `\n${token.value}` : ``))
			}
			decorations.push({
				range: new vscode.Range(start, end),
				hoverMessage
			})
		}

		editor.setDecorations(tokenDecorationType, decorations)
	}

	const legend = new vscode.SemanticTokensLegend(
		["namespace", "class", "enum", "interface", "struct", "typeParameter", "type", "parameter", "variable", "property", "enumMember", "event", "function", "method", "macro", "label", "comment", "string", "keyword", "number", "regexp", "operator"],
		["declaration", "definition", "readonly", "static", "deprecated", "abstract", "async", "modification", "documentation", "defaultLibrary"],
	)
	const semanticTokensProvider: vscode.DocumentSemanticTokensProvider = {
		provideDocumentSemanticTokens(
			document: vscode.TextDocument
		): vscode.ProviderResult<vscode.SemanticTokens> {
			const tokensBuilder = new vscode.SemanticTokensBuilder(legend)

			const addSemanticToken = (start: vscode.Position, end: vscode.Position, tokenType: string, tokenModifiers?: string[] | undefined) => {
				// 各行へ分割
				const ranges = new Array<vscode.Range>()
				if (start.line === end.line) {
					ranges.push(new vscode.Range(start, end))
				} else {
					for (let y = start.line; y <= end.line; y++) {
						if (y === start.line) {
							ranges.push(new vscode.Range(start, new vscode.Position(y, document.lineAt(y).text.length)))
						} else if (y === end.line) {
							ranges.push(new vscode.Range(new vscode.Position(y, 0), end))
						} else {
							ranges.push(document.lineAt(y).range)
						}
					}
				}

				// トークンを追加
				for (const range of ranges) {
					tokensBuilder.push(range, tokenType, tokenModifiers)
				}
			}

			const code = document.getText()
			const tokens = lex(code)
			if (tokens instanceof LexError) {
				return tokensBuilder.build()
			}

			for (const token of [...tokens.commentTokens, ...tokens.tokens]) {
				if (token.startOffset === null || token.endOffset === null) {
					continue
				}
				const start = document.positionAt(token.startOffset)
				const end = document.positionAt(token.endOffset)
				if (start.isEqual(end)) {
					continue
				}

				switch (token.type) {
					case "line_comment":
					case "range_comment":
						addSemanticToken(start, end, "comment", [])
						break
					case "def_test":
					case "def_func":
						addSemanticToken(start, end, "keyword", ["declaration"])
						break
					case "func":
						// 関数に「には」がついていれば、その部分を色付けする
						if (token.josi === "には" || token.josi === "は~") {
							const word = document.getText(new vscode.Range(start, end))
							let josiPos: number
							if (token.josi === "には") {
								josiPos = word.lastIndexOf("には")
							} else {
								josiPos = word.lastIndexOf("は~")
								if (josiPos === -1) {
									josiPos = word.lastIndexOf("は〜")
								}
							}
							if (josiPos !== -1) {
								addSemanticToken(start, document.positionAt(token.startOffset + josiPos), "function", [])
								addSemanticToken(document.positionAt(token.startOffset + josiPos), end, "keyword", [])
								break
							}
						}
						addSemanticToken(start, end, "function", [])
						break
					case "number":
						addSemanticToken(start, end, "number", [])
						break
					// 独立した助詞
					case "とは":
						addSemanticToken(start, end, "macro", ["declaration"])
						break
					case "ならば":
					case "でなければ":
						addSemanticToken(start, end, "keyword", ["declaration"])
						break
					// 制御構文
					case "ここから":
					case "ここまで":
					case "もし":
					case "違えば":
						addSemanticToken(start, end, "keyword", [])
						break
					// 予約語
					case "回":
					case "間":
					case "繰り返す":
					case "反復":
					case "抜ける":
					case "続ける":
					case "戻る":
					case "先に":
					case "次に":
					case "代入":
					case "逐次実行":
					case "条件分岐":
					case "取込":
					case "エラー監視":
					case "エラー":
						addSemanticToken(start, end, "keyword", [])
						break
					case "変数":
						addSemanticToken(start, end, "variable", ["definition"])
						break
					case "定数":
						addSemanticToken(start, end, "variable", ["readonly", "definition"])
						break
					// 演算子
					case "shift_r0":
					case "shift_r":
					case "shift_l":
					case "gteq":
					case "lteq":
					case "noteq":
					case "eq":
					case "not":
					case "gt":
					case "lt":
					case "and":
					case "or":
					case "@":
					case "+":
					case "-":
					case "*":
					case "/":
					case "%":
					case "^":
					case "&":
						addSemanticToken(start, end, "operator", [])
						break
					case "string":
					case "string_ex":
						addSemanticToken(start, end, "string", [])
						break
					case "word":
						if (token.value === "関数") {
							addSemanticToken(start, end, "macro", [])
						} else if (["それ", "そう"].includes(token.value as string)) {
							addSemanticToken(start, end, "macro", [])
						} else {
							addSemanticToken(start, end, "variable", [])
						}
						break
				}
			}
			return tokensBuilder.build()
		}
	}

	let activeTextEditor = vscode.window.activeTextEditor
	if (activeTextEditor !== undefined) {
		updateDecorations(activeTextEditor)
	}
	context.subscriptions.push(
		vscode.languages.registerDocumentSemanticTokensProvider({ language: "nadesiko3" }, semanticTokensProvider, legend),
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
		vscode.commands.registerCommand("nadesiko3.runFile", () => {
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
			compiler.addPlugin({
				'表示': {
					type: 'func',
					josi: [['を', 'と']],
					fn: function (s: any, sys: any) {
						const format = (obj: unknown): string => {
							if (typeof obj === "string") {
								return obj
							}
							try {
								return JSON.stringify(obj)
							} catch (e) {
								return `${obj}`
							}
						}
						vscode.window.showInformationMessage(format(s))
						if (!sys.silent) { console.log(s) }
						sys.__varslist[0]['表示ログ'] += (s + '\n')
					},
					return_none: true
				},
			})
			try {
				// NOTE: 「N秒後」とかを使っていると関数を抜けた後も実行され続ける
				compiler.runReset(activeTextEditor.document.getText())
			} catch (e) {
				vscode.window.showErrorMessage(e.message)
			}
		}),
		vscode.commands.registerCommand("nadesiko3.compileFile", () => {
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
	)
}

export function deactivate() { }
