import { Token, TokenWithSourceMap } from "./tokenize"

class SourceMapping {
    private readonly preprocessed: { text: string; sourcePosition: number; preprocessedCodePosition: number }[]

    constructor(private readonly sourceCodeLength: number, preprocessed: { text: string; sourcePosition: number; }[]) {
        this.preprocessed = []
        let i = 0
        for (const el of preprocessed) {
            this.preprocessed.push({ ...el, preprocessedCodePosition: i })
            i += el.text.length
        }
    }

    /** preprocess後の文字列上のoffsetからソースコード上のoffsetへ変換 */
    public map(offsetOnPreprocessedCode: number): number {
        for (let i = 0; i < this.preprocessed.length - 1; i++) {
            if (offsetOnPreprocessedCode < this.preprocessed[i + 1].preprocessedCodePosition) {
                return Math.min(
                    this.preprocessed[i].sourcePosition + (offsetOnPreprocessedCode - this.preprocessed[i].preprocessedCodePosition),
                    this.preprocessed[i + 1].sourcePosition - 1,
                )
            }
        }

        const last = this.preprocessed[this.preprocessed.length - 1]
        return Math.min(
            last.sourcePosition + (offsetOnPreprocessedCode - last.preprocessedCodePosition),
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
