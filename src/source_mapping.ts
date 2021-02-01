import { assert } from "chai"
import { Token, TokenWithSourceMap } from "./tokenize"

/** prepareとtokenizeのソースマッピング */
class SourceMappingOfTokenization {
    private readonly cumulativeSum: number[]
    constructor(private readonly sourceCodeLength: number, private readonly preprocessed: { text: string; sourcePosition: number; }[]) {
        let i = 0
        this.cumulativeSum = []
        for (const el of preprocessed) {
            this.cumulativeSum.push(i)
            i += el.text.length
        }
    }

    /** preprocess後の文字列上のoffsetからソースコード上のoffsetへ変換 */
    public map(preprocessedCodePosition: number): number {
        const i = this.findIndex(preprocessedCodePosition)
        return Math.min(
            this.preprocessed[i].sourcePosition + (preprocessedCodePosition - this.cumulativeSum[i]),
            i === this.preprocessed.length - 1 ? this.sourceCodeLength : this.preprocessed[i + 1].sourcePosition - 1,
        )
    }

    private lastIndex = 0
    private lastPreprocessedCodePosition = 0
    private findIndex(preprocessedCodePosition: number): number {
        // 連続アクセスに対する高速化
        if (preprocessedCodePosition < this.lastPreprocessedCodePosition) {
            this.lastIndex = 0
        }
        this.lastPreprocessedCodePosition = preprocessedCodePosition

        for (let i = this.lastIndex; i < this.preprocessed.length - 1; i++) {
            if (preprocessedCodePosition < this.cumulativeSum[i + 1]) {
                this.lastIndex = i
                return i
            }
        }

        this.lastIndex = this.preprocessed.length - 1
        return this.preprocessed.length - 1
    }
}

class SourceMappingOfIndexSyntax {
    private lines: { offset: number, len: number }[] = []

    constructor(
        codeAfterProcessingIndentationSyntax: string,
        private readonly linesInsertedByIndentationSyntax: readonly number[],
        private readonly linesDeletedByIndentationSyntax: readonly { lineNumber: number, len: number }[],
    ) {
        let offset = 0
        for (const line of codeAfterProcessingIndentationSyntax.split("\n")) {
            this.lines.push({ offset, len: line.length })
            offset += line.length + 1
        }
    }

    public apply(token: TokenWithSourceMap) {
        if (token.startOffset === null) {
            return token
        }

        // 何行目かを判定
        const tokenLine = this.getLineNumber(token.startOffset)

        for (const insertedLine of this.linesInsertedByIndentationSyntax) {
            // インデント構文の処理後のソースコードの `insertedLine` 行目にあるトークンのソースマップ情報を削除する。
            if (tokenLine === insertedLine) {
                token.startOffset = null
                token.endOffset = null
                break
            }

            // インデント構文の処理後のソースコードの `insertedLine` 行目以降にあるトークンのoffsetから
            // `linesInsertedByIndentationSyntax[i]` 行目の文字数（\rを含む） を引く。
            if (tokenLine > insertedLine) {
                // "\n"の分1足す
                token.startOffset -= this.lines[insertedLine].len + 1
                if (token.endOffset !== null) {
                    token.endOffset -= this.lines[insertedLine].len + 1
                }
            }
        }
        for (const deletedLine of this.linesDeletedByIndentationSyntax) {
            if (tokenLine >= deletedLine.lineNumber) {
                // "\n"の分1足す
                if (token.startOffset !== null) {
                    token.startOffset += deletedLine.len + 1
                }
                if (token.endOffset !== null) {
                    token.endOffset += deletedLine.len + 1
                }
            }
        }
    }

    private lastLineNumber = 0
    private lastOffset = 0
    private getLineNumber(offset: number): number {
        // 連続アクセスに対する高速化
        if (offset < this.lastOffset) {
            this.lastLineNumber = 0
        }
        this.lastOffset = offset

        for (let i = this.lastLineNumber; i < this.lines.length - 1; i++) {
            if (offset < this.lines[i + 1].offset) {
                this.lastLineNumber = i
                return i
            }
        }

        this.lastLineNumber = this.lines.length - 1
        return this.lines.length - 1
    }
}

export default function addSourceMapToTokens(
    tokens: Token[],
    preprocessed: { text: string, sourcePosition: number }[],
    codeAfterProcessingIndentationSyntax: string,
    linesInsertedByIndentationSyntax: readonly number[],
    linesDeletedByIndentationSyntax: readonly { lineNumber: number, len: number }[],
): TokenWithSourceMap[] {
    const tokenizationSourceMapping = new SourceMappingOfTokenization(codeAfterProcessingIndentationSyntax.length, preprocessed)

    // インデント構文の処理後のソースコード上の位置を求める
    const tokensWithSourceMap = tokens.map((token, i) => {
        const startOffset = tokenizationSourceMapping.map(token.preprocessedCodeOffset)
        const endOffset = tokenizationSourceMapping.map(token.preprocessedCodeOffset + token.preprocessedCodeLength)

        return {
            ...token,
            startOffset,
            endOffset,
            rawJosi: token.josi,
        } as TokenWithSourceMap
    })

    // インデント構文の処理前のソースコード上の位置へ変換する
    const indentationSyntaxSourceMapping = new SourceMappingOfIndexSyntax(codeAfterProcessingIndentationSyntax, linesInsertedByIndentationSyntax, linesDeletedByIndentationSyntax)
    for (const token of tokensWithSourceMap) {
        indentationSyntaxSourceMapping.apply(token)
    }

    return tokensWithSourceMap
}
