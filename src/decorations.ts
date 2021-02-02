import * as vscode from 'vscode'
import { lex } from './parse'
import { LexError } from './tokenize'

const tokenDecorationType = vscode.window.createTextEditorDecorationType({
    after: {
        contentText: '|',
        color: 'transparent',
        width: '1px',
        textDecoration: "underline",
    },
    dark: {
        after: {
            backgroundColor: '#737373',
        }
    },
    light: {
        after: {
            backgroundColor: '#bbbbbb',
        }
    }
})

const josiDecorationType = vscode.window.createTextEditorDecorationType({
    textDecoration: "underline",
})

export default function updateDecorations() {
    const editor = vscode.window.activeTextEditor
    if (editor === undefined) {
        return
    }
    if (editor.document.languageId !== "nadesiko3") {
        editor.setDecorations(tokenDecorationType, [])
        editor.setDecorations(josiDecorationType, [])
        return
    }

    const code = editor.document.getText()
    const tokens = lex(code)
    if (tokens instanceof LexError) {
        editor.setDecorations(tokenDecorationType, [])
        editor.setDecorations(josiDecorationType, [])
        return
    }

    // トークンの区切れ目を表示する
    if (vscode.workspace.getConfiguration("nadesiko3").get("showTokenDecorations")) {
        const tokenDecorations = new Array<vscode.DecorationOptions>()
        let prevDecorationPos = new vscode.Position(0, 0)
        for (const token of [...tokens.commentTokens, ...tokens.tokens]) {
            // ソースコード上に存在しないトークンなら無視
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

            // hoverMessage を作る
            let hoverMessage = new vscode.MarkdownString("")
            if (token.type === "func" && (token.value as string) in tokens.funclist && tokens.funclist[token.value as string].type === "func") {
                const phrase = (tokens.funclist[token.value as string].josi as string[][])
                    .map((clause) => clause.length === 1 ? `〜${clause[0]} ` : `〜[${clause.join("|")}] `)
                    .join("") + token.value
                hoverMessage = hoverMessage.appendText(`${text}: ${token.type}\n${phrase}`)
            } else {
                hoverMessage = hoverMessage.appendText(`${text}` + (text !== token.type ? `: ${token.type}` : ``) + (text !== token.value ? `\n${token.value}` : ``))
            }

            // border-left
            if (!prevDecorationPos.isEqual(start)) {
                tokenDecorations.push({
                    range: new vscode.Range(start, start),
                })
            }

            // border-right
            tokenDecorations.push({
                range: new vscode.Range(start, end),
                hoverMessage
            })
            prevDecorationPos = end
        }
        editor.setDecorations(tokenDecorationType, tokenDecorations)
    } else {
        editor.setDecorations(tokenDecorationType, [])
    }

    // 助詞を強調する
    if (vscode.workspace.getConfiguration("nadesiko3").get("showJosiDecorations")) {
        const josiDecorations = new Array<vscode.DecorationOptions>()
        for (const token of tokens.tokens) {
            if (token.endOffset === null || token.rawJosi === "" || token.josi === "") {
                continue
            }
            const start = editor.document.positionAt(token.endOffset - token.rawJosi.length)
            const end = editor.document.positionAt(token.endOffset)
            const text = code.slice(token.endOffset - token.rawJosi.length, token.endOffset)

            // NOTE: 助詞「は~」の場合は「~」の部分が「〜」などにマッチするが、それらは全て1文字なため、
            //       特別な処理は不要なはず
            if (text !== token.rawJosi && token.rawJosi !== "は~") {
                console.log(`error: ${text} !== ${token.rawJosi}`)
                continue
            }

            josiDecorations.push({
                range: new vscode.Range(start, end),
            })
        }

        editor.setDecorations(josiDecorationType, josiDecorations)
    } else {
        editor.setDecorations(josiDecorationType, [])
    }
}
