import * as abs from './abstract_vscode'
import { createParameterDeclaration, DeclarationFile } from '../document'
import { LexErrorWithSourceMap } from '../nadesiko3/nako3'
import { lex } from '../nadesiko3/nako3'
import { filterVisibleTokens } from './utils'

export default function getDecorations(tokens: ReturnType<typeof lex>, document: abs.TextDocument, declarationFiles: DeclarationFile[], VSCodeRange: abs.TypeofVSCodeRange, Position: abs.TypeofPosition, MarkdownString: abs.TypeofMarkdownString, Uri: abs.TypeofUri, showLink: boolean): { tokenDecorations: abs.DecorationOptions[], josiDecorations: abs.DecorationOptions[] } {
    const tokenDecorations = new Array<abs.DecorationOptions>()
    const josiDecorations = new Array<abs.DecorationOptions>()

    const code = document.getText()
    if (tokens instanceof LexErrorWithSourceMap) {
        return { tokenDecorations, josiDecorations }
    }

    // トークンの区切れ目を表示する
    {
        let prevDecorationPos = new Position(0, 0)
        for (const token of filterVisibleTokens([...tokens.commentTokens, ...tokens.tokens])) {
            const start = document.positionAt(token.startOffset)
            const end = document.positionAt(token.endOffset)
            const text = code.slice(token.startOffset, token.endOffset)
            if (text.trim() === "") {
                continue
            }

            // hoverMessage を作る
            let hoverMessage = new MarkdownString()
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
                                const lineNumber = document.lineAt(document.positionAt(d.token.startOffset).line).lineNumber
                                declarationMarkdownLines.push(`${lineNumber + 1}行目`)
                            }
                            break
                        } case "plugin": {
                            if (showLink) {
                                const file = declarationFiles.find((file) => file.name === d.name + ".nako3")
                                if (file === undefined) {
                                    console.error(`プラグインの宣言ファイル ${d.name}.nako3 が見つかりません。`)
                                    break
                                }
                                const lineNumber = file.nameToLineNumber.get(token.value as string)
                                if (lineNumber !== undefined) {
                                    const uri = Uri.parse(`nadesiko3-plugin-declaration:${file.name}`)
                                    const label = d.name.replace(/([\[\]\<\>])/g, "\\$1")
                                    declarationMarkdownLines.push(`[${label}](${uri.toString()}#L${lineNumber + 1})`)
                                }
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
                    range: new VSCodeRange(start, start),
                })
            }

            // border-right
            tokenDecorations.push({
                range: new VSCodeRange(start, end),
                hoverMessage
            })
            prevDecorationPos = end
        }
    }

    // 助詞を強調する
    {
        for (const token of tokens.tokens) {
            if (token.endOffset === null || token.rawJosi === "" || token.josi === "") {
                continue
            }
            const start = document.positionAt(token.endOffset - token.rawJosi.length)
            const end = document.positionAt(token.endOffset)
            const text = code.slice(token.endOffset - token.rawJosi.length, token.endOffset)

            // NOTE: 助詞「は~」の場合は「~」の部分が「〜」などにマッチするが、それらは全て1文字なため、
            //       特別な処理は不要なはず
            if (text !== token.rawJosi && token.rawJosi !== "は~") {
                console.log(`error: ${text} !== ${token.rawJosi}`)
                continue
            }

            josiDecorations.push({
                range: new VSCodeRange(start, end),
            })
        }
    }

    return { tokenDecorations, josiDecorations }
}
