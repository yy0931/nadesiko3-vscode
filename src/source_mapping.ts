import { Token, TokenWithSourceMap } from "./tokenize"

class SourceMapping {
    private readonly preprocessed: { text: string; sourcePosition: number; preprocessedCodePosition: number }[]
    private lastIndex = 0
    private lastPreprocessedCodePosition = 0

    constructor(private readonly sourceCodeLength: number, preprocessed: { text: string; sourcePosition: number; }[]) {
        this.preprocessed = []
        let i = 0
        for (const el of preprocessed) {
            this.preprocessed.push({ ...el, preprocessedCodePosition: i })
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
            if (preprocessedCodePosition < this.preprocessed[i + 1].preprocessedCodePosition) {
                this.lastIndex = i
                return Math.min(
                    this.preprocessed[i].sourcePosition + (preprocessedCodePosition - this.preprocessed[i].preprocessedCodePosition),
                    this.preprocessed[i + 1].sourcePosition - 1,
                )
            }
        }

        this.lastIndex = this.preprocessed.length - 1
        const last = this.preprocessed[this.preprocessed.length - 1]
        return Math.min(
            last.sourcePosition + (preprocessedCodePosition - last.preprocessedCodePosition),
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
