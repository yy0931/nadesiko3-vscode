import { Token, TokenWithSourceMap } from "./tokenize"

class SourceMapping {
    // 高速化のための変数
    private readonly cumulativeSum: number[]
    private lastIndex = 0
    private lastPreprocessedCodePosition = 0

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
        // 連続アクセスに対する高速化
        if (preprocessedCodePosition < this.lastPreprocessedCodePosition) {
            this.lastIndex = 0
        }
        this.lastPreprocessedCodePosition = preprocessedCodePosition

        for (let i = this.lastIndex; i < this.preprocessed.length - 1; i++) {
            if (preprocessedCodePosition < this.cumulativeSum[i + 1]) {
                this.lastIndex = i
                return Math.min(
                    this.preprocessed[i].sourcePosition + (preprocessedCodePosition - this.cumulativeSum[i]),
                    this.preprocessed[i + 1].sourcePosition - 1,
                )
            }
        }

        this.lastIndex = this.preprocessed.length - 1
        return Math.min(
            this.preprocessed[this.preprocessed.length - 1].sourcePosition + (preprocessedCodePosition - this.cumulativeSum[this.preprocessed.length - 1]),
            this.sourceCodeLength,
        )
    }
}

export default function addSourceMapToTokens(tokens: Token[], preprocessed: { text: string, sourcePosition: number }[], code: string): TokenWithSourceMap[] {
    const sourceMapping = new SourceMapping(code.length, preprocessed)
    return tokens.map((token, i) => {
        const startOffset = sourceMapping.map(token.preprocessedCodeOffset)
        const endOffset = sourceMapping.map(token.preprocessedCodeOffset + token.preprocessedCodeLength)
        return {
            ...token,
            startOffset,
            endOffset,
            rawJosi: token.josi,
        } as TokenWithSourceMap
    })
}
