/** prepareとtokenizeのソースマッピング */
export class SourceMappingOfTokenization {
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

export class SourceMappingOfIndexSyntax {
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

    public map(startOffset: number | null, endOffset: number | null): { startOffset: number | null, endOffset: number | null } {
        if (startOffset === null) {
            return { startOffset, endOffset }
        }

        // 何行目かを判定
        const tokenLine = this.getLineNumber(startOffset)

        for (const insertedLine of this.linesInsertedByIndentationSyntax) {
            // インデント構文の処理後のソースコードの `insertedLine` 行目にあるトークンのソースマップ情報を削除する。
            if (tokenLine === insertedLine) {
                startOffset = null
                endOffset = null
                break
            }

            // インデント構文の処理後のソースコードの `insertedLine` 行目以降にあるトークンのoffsetから
            // `linesInsertedByIndentationSyntax[i]` 行目の文字数（\rを含む） を引く。
            if (tokenLine > insertedLine) {
                // "\n"の分1足す
                startOffset -= this.lines[insertedLine].len + 1
                if (endOffset !== null) {
                    endOffset -= this.lines[insertedLine].len + 1
                }
            }
        }
        for (const deletedLine of this.linesDeletedByIndentationSyntax) {
            if (tokenLine >= deletedLine.lineNumber) {
                // "\n"の分1足す
                if (startOffset !== null) {
                    startOffset += deletedLine.len + 1
                }
                if (endOffset !== null) {
                    endOffset += deletedLine.len + 1
                }
            }
        }

        return { startOffset, endOffset }
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
