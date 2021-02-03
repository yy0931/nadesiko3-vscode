import * as vscode from 'vscode'
import { createParameterDeclaration } from '../document'
import { LexErrorWithSourceMap } from '../nadesiko3/nako3'
import { lex } from '../nadesiko3/nako3'
import { filterVisibleTokens } from './utils'

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
    if (tokens instanceof LexErrorWithSourceMap) {
        editor.setDecorations(tokenDecorationType, [])
        editor.setDecorations(josiDecorationType, [])
        return
    }

    // トークンの区切れ目を表示する
    if (vscode.workspace.getConfiguration("nadesiko3").get("showTokenDecorations")) {
        const tokenDecorations = new Array<vscode.DecorationOptions>()
        let prevDecorationPos = new vscode.Position(0, 0)
        for (const token of filterVisibleTokens([...tokens.commentTokens, ...tokens.tokens])) {
            const start = editor.document.positionAt(token.startOffset)
            const end = editor.document.positionAt(token.endOffset)
            const text = code.slice(token.startOffset, token.endOffset)
            if (text.trim() === "") {
                continue
            }

            // hoverMessage を作る
            let hoverMessage = new vscode.MarkdownString("")
            if (token.type === "func" && (token.value as string) in tokens.funclist && tokens.funclist[token.value as string].type === "func") {
                const fn = tokens.funclist[token.value as string]
                if (fn.type !== "func") {
                    throw new Error("fn.type !== 'func'")
                }
                hoverMessage = hoverMessage.appendText(`${text}: ${token.type}\n${createParameterDeclaration(fn.josi)}${token.value}`)
                const declarationText = fn.declaration.flatMap((d): string[] => {
                    switch (d.type) {
                        case "inFile": return [`${d.token.startOffset} ~ ${d.token.endOffset} 文字目`]
                        case "plugin": {
                            if (d.name.startsWith("builtin_")) {
                                return [d.name]
                            } else {
                                return [`プラグイン ${d.name}`]
                            }
                        }
                        default: const _: never = d; throw new Error()
                    }
                }).join(", ")
                if (declarationText !== "") {
                    hoverMessage = hoverMessage.appendText(`\n定義場所: ${declarationText}`)
                }
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
