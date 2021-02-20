import * as vscode from 'vscode'
import { LanguageFeatures, BackgroundTokenizer, AceDocument, TokenType } from 'nadesiko3/src/wnako3_editor'
import * as NakoCompiler from 'nadesiko3/src/nako3'

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
	getAllLines() { return this.editor.document.getText().split('\n') }
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

let backgroundTokenizer: { v: BackgroundTokenizer, editor: vscode.TextEditor, waitTokenUpdate: () => Promise<void> } | null = null

export function activate(context: vscode.ExtensionContext) {
	const selector: vscode.DocumentSelector = { language: "nadesiko3", scheme: undefined }
	const nako3 = new NakoCompiler()

	const onChange = () => {
		const editor = vscode.window.activeTextEditor
		if (editor === undefined || editor === backgroundTokenizer?.editor) {
			return
		}
		if (backgroundTokenizer !== null) {
			backgroundTokenizer.v.dispose()
		}
		if (editor.document.languageId !== 'nadesiko3') {
			return
		}
		let listeners = new Array<() => void>()
		backgroundTokenizer = {
			v: new BackgroundTokenizer(
				new DocumentAdapter(editor),
				nako3,
				(firstRow, lastRow, ms) => {
					listeners.forEach((f) => f())
					listeners = []
				},
				(code, err) => { },
			),
			editor,
			waitTokenUpdate: () => new Promise<void>((resolve) => { listeners.push(() => { resolve() }) })
		}
	}

	const languageFeatures = new LanguageFeatures(AceRange, nako3)

	context.subscriptions.push(
		vscode.window.onDidChangeActiveTextEditor(() => { onChange() }),
		vscode.window.onDidChangeTextEditorOptions(() => { onChange() }),
		vscode.workspace.onDidChangeConfiguration(() => { onChange() }),
		vscode.workspace.onDidChangeTextDocument((e) => {
			onChange()
			if (backgroundTokenizer !== null) {
				backgroundTokenizer.v.dirty = true
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
					for (const token of backgroundTokenizer.v.getTokens(line)) {
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
	)
}

export function deactivate() {
	backgroundTokenizer?.v.dispose()
}
