const { AceDocument } = require("nadesiko3/src/wnako3_editor")
const vscode = require("vscode")

/**
 * ace editor に依存せずにAceと同じ形式のRangeクラスを使う。
 */
class AceRange {
	constructor(/** @type {number} */startLine, /** @type {number} */startColumn, /** @type {number} */endLine, /** @type {number} */endColumn) {
		/** @public @readonly */this.startLine = startLine
		/** @public @readonly */this.startColumn = startColumn
		/** @public @readonly */this.endLine = endLine
		/** @public @readonly */this.endColumn = endColumn
	}
}

/**
 * vscode.TextDocument をAceのDocumentとして使う。
 * @implements {AceDocument}
 */
class ReadonlyDocumentAdapter {
	constructor(/** @type {vscode.TextDocument} */document) {
		/** @private @readonly */ this.document = document
	}
	getLine(/** @type {number} */row) { return this.document.lineAt(row).text }
	getAllLines() { return this.document.getText().split("\n") }
	getLength() { return this.document.lineCount }
	insertInLine(/** @type {{ row: number, column: number }} */position, /** @type {string} */text) { throw new Error("readonly") }
	removeInLine(/** @type {number} */row, /** @type {number} */columnStart, /** @type {number} */columnEnd) { throw new Error("readonly") }
	replace(/** @type {AceRange} */range, /** @type {string} */text) { throw new Error("readonly") }
}
exports.ReadonlyDocumentAdapter = ReadonlyDocumentAdapter

/**
 * vscode.TextEditor をAceのDocumentとして使う。
 * @implements {AceDocument}
 */
class DocumentAdapter extends ReadonlyDocumentAdapter {
	constructor(/** @type {vscode.TextEditor} */editor) {
		super(editor.document)
		/** @private @readonly */ this.editor = editor
	}
	insertInLine(/** @type {{ row: number, column: number }} */position, /** @type {string} */text) {
		this.editor.edit((builder) => { builder.insert(new vscode.Position(position.row, position.column), text) })
			.then(undefined, (err) => { console.error(err) })
	}
	removeInLine(/** @type {number} */row, /** @type {number} */columnStart, /** @type {number} */columnEnd) {
		this.editor.edit((builder) => { builder.delete(new vscode.Range(row, columnStart, row, columnEnd)) })
			.then(undefined, (err) => { console.error(err) })
	}
	replace(/** @type {AceRange} */range, /** @type {string} */text) {
		this.editor.edit((builder) => { builder.replace(new vscode.Range(range.startLine, range.startColumn, range.endLine, range.endColumn), text) })
			.then(undefined, (err) => { console.error(err) })
	}
}
exports.DocumentAdapter = DocumentAdapter
