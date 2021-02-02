import { parse } from "../nadesiko3/nako3"
import * as vscode from "vscode"
import { LexErrorWithSourceMap } from "../nadesiko3/nako3"

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

export default updateDiagnostics
