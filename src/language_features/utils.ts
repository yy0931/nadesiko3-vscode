import * as vscode from "vscode"
import { TokenWithSourceMap } from "../nadesiko3/nako3"
import { Token } from "../nadesiko3/nako_lexer"

export type TokenWithSourceMapNotNull = Omit<Token, "preprocessedCodeOffset" | "preprocessedCodeLength">
    & {
        rawJosi: string
        startOffset: number
        endOffset: number
        isDefinition?: boolean
    }

// `offset`の位置にあるトークンを取得
export const filterTokensByOffset = (tokens: readonly TokenWithSourceMap[], offset: number): TokenWithSourceMapNotNull[] => {
    const result: TokenWithSourceMapNotNull[] = []

    for (const token of tokens) {
        if (token.startOffset !== null && token.endOffset !== null &&
            token.startOffset <= offset && offset < token.endOffset) {
            result.push({ ...token, startOffset: token.startOffset, endOffset: token.endOffset })
        }
    }

    // カーソルが右端にある場合は後ろにまわす
    for (const token of tokens) {
        if (token.startOffset !== null && token.endOffset !== null &&
            offset === token.endOffset) {
            result.push({ ...token, startOffset: token.startOffset, endOffset: token.endOffset })
        }
    }

    return result
}

// rangeを行ごとに分割する
export const splitRangeToLines = (document: vscode.TextDocument, start: vscode.Position, end: vscode.Position) => {
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
    return ranges
}

// 制御用のトークンなどを除く
export const filterVisibleTokens = (tokens: readonly TokenWithSourceMap[]) => {
    const result = new Array<
        Omit<Token, "preprocessedCodeOffset" | "preprocessedCodeLength">
        & {
            rawJosi: string
            startOffset: number
            endOffset: number
            isDefinition?: boolean
        }>()
    for (const token of tokens) {
        if (token.startOffset !== null && token.endOffset !== null &&
            token.type !== "eol" && token.type !== "eof" &&
            token.startOffset !== token.endOffset) {
            result.push({ ...token, startOffset: token.startOffset, endOffset: token.endOffset })
        }
    }
    return result
}
