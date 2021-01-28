import type { AceDocument } from "nadesiko3/src/wnako3_editor.mjs"
import vscode from "vscode"

/**
 * ace editor に依存せずにAceと同じ形式のRangeクラスを使う。
 */
class AceRange {
	constructor(public readonly startLine: number, public readonly startColumn: number, public readonly endLine: number, public readonly endColumn: number) { }
}

/**
 * vscode.TextDocument をAceのDocumentとして使う。
 */
export class ReadonlyDocumentAdapter implements AceDocument {
	constructor(private readonly document: vscode.TextDocument) { }
	getLine(row: number) { return this.document.lineAt(row).text }
	getAllLines() { return this.document.getText().split("\n") }
	getLength() { return this.document.lineCount }
	insertInLine(position: { row: number; column: number }, text: string) { throw new Error("readonly") }
	removeInLine(row: number, columnStart: number, columnEnd: number) { throw new Error("readonly") }
	replace(range: AceRange, text: string) { throw new Error("readonly") }
}

/**
 * vscode.TextEditor をAceのDocumentとして使う。
 */
export class DocumentAdapter extends ReadonlyDocumentAdapter implements AceDocument {
	constructor(private readonly editor: vscode.TextEditor) {
		super(editor.document)
	}
	insertInLine(position: { row: number; column: number }, text: string) {
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
