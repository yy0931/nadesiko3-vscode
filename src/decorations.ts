import * as vscode from 'vscode'
import { lex } from './parse'
import { LexError } from './tokenize'

const tokenDecorationType = vscode.window.createTextEditorDecorationType({
    after: {
        backgroundColor: 'gray',
        contentText: '|',
        color: 'transparent',
        width: '1px',
    },
})

export default function updateDecorations(editor: vscode.TextEditor) {
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
