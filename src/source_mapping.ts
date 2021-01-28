import { Token, TokenWithSourceMap } from "./tokenize"

class SourceMapping {
    private cumulativeSum: number[]
    constructor(private readonly sourceCodeLength: number, private readonly preprocessed: { text: string; sourcePosition: number; }[]) {
        // 累積和
        let sum = 0
        this.cumulativeSum = this.preprocessed.map((v) => {
            sum += v.text.length
            return sum
        })
    }

    /**
     * 一致するトークンの先頭へマップする。ただしファイルの末尾なら末尾の位置を返す。
     */
    public map(offsetOnPreprocessedCode: number): number {
        // preprocess後の文字列上のoffsetからソースコード上のoffsetへ変換
        // TODO: 高速化
        let j = offsetOnPreprocessedCode
        for (let i = 0; i < this.preprocessed.length - 1; i++) {
            if (j < this.preprocessed[i].text.length) {
                return Math.min(this.preprocessed[i].sourcePosition + j, this.preprocessed[i + 1].sourcePosition - 1)
            }
            j -= this.preprocessed[i].text.length
        }
        const last = this.preprocessed[this.preprocessed.length - 1]
        return Math.min(last.sourcePosition + j, this.sourceCodeLength)
    }
}

export default function addSourceMapToTokens(tokens: Token[], preprocessed: { text: string, sourcePosition: number }[], code: string): TokenWithSourceMap[] {
    const sourceMapping = new SourceMapping(code.length, preprocessed)
    return tokens.map((token, i) => {
        const startOffset = sourceMapping.map(token.preprocessedCodeOffset)
        let endOffset: number
        if (tokens[i + 1] === undefined) {
            // ファイルの末尾まで
            endOffset = code.length
        } else {
            // 次のトークンの先頭まで
            endOffset = sourceMapping.map(tokens[i + 1].preprocessedCodeOffset)
        }
        return {
            ...token,
            startOffset,
            endOffset,
        } as TokenWithSourceMap
    })
}
