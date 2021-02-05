import * as vscode from 'vscode'
import { createDeclarationFile, createParameterDeclaration, DeclarationFile } from '../document'
import { LexErrorWithSourceMap } from '../nadesiko3/nako3'
import { lex } from '../nadesiko3/nako3'
import { mockPlugins } from '../nako3_plugins'
import { filterVisibleTokens } from './utils'

const tokenDecorationType = vscode.window.createTextEditorDecorationType({
    after: {
        contentText: '|',
        color: 'transparent',
        width: '1px',
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

export default function updateDecorations(declarationFiles: DeclarationFile[]) {
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
                hoverMessage = hoverMessage.appendCodeblock(`${createParameterDeclaration(fn.josi)}${token.value}`, "nadesiko3")
                hoverMessage = hoverMessage.appendCodeblock(`${text}: ${token.type}`, "plaintext")
                const declarationMarkdownLines: string[] = []
                for (const d of fn.declaration) {
                    switch (d.type) {
                        case "inFile": {
                            if (d.token.startOffset === null) {
                                declarationMarkdownLines.push(`${d.token.startOffset} ~ ${d.token.endOffset} 文字目`)
                            } else {
                                const lineNumber = editor.document.lineAt(editor.document.positionAt(d.token.startOffset)).lineNumber
                                declarationMarkdownLines.push(`${lineNumber + 1}行目`)
                            }
                            break
                        } case "plugin": {
                            const file = declarationFiles.find((file) => file.name === d.name + ".nako3")
                            if (file === undefined) {
                                console.error(`プラグインの宣言ファイル ${d.name}.nako3 が見つかりません。`)
                                break
                            }
                            const lineNumber = file.nameToLineNumber.get(token.value as string)
                            if (lineNumber !== undefined) {
                                const uri = vscode.Uri.parse(`nadesiko3-plugin-declaration:${file.name}`)
                                const label = d.name.replace(/([\[\]\<\>])/g, "\\$1")
                                declarationMarkdownLines.push(`[${label}](${uri.toString()}#L${lineNumber + 1})`)
                            }
                            break
                        }
                        default: const _: never = d; throw new Error()
                    }
                }
                if (declarationMarkdownLines.length > 0) {
                    hoverMessage = hoverMessage.appendMarkdown(`\n定義場所: ${declarationMarkdownLines.join("、")}`)
                }
            } else {
                hoverMessage = hoverMessage.appendCodeblock(`${token.value}`, "javascript")
                hoverMessage = hoverMessage.appendCodeblock(`${text}` + (text !== token.type ? `: ${token.type}` : ``), "plaintext")
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
