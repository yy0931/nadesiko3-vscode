//@ts-ignore
import * as monacoAny from "monaco-editor/esm/vs/editor/editor.main.js"
import type monacoType from "monaco-editor"
const monaco: typeof monacoType = monacoAny

import * as abs from "../../src/language_features/abstract_vscode"

export class SemanticTokensLegend implements abs.SemanticTokensLegend {
    constructor(public readonly tokenTypes: string[], public readonly tokenModifiers: string[]) { }
}

export class SemanticTokensBuilder implements abs.SemanticTokensBuilder {
    private readonly data = new Array<{ range: abs.VSCodeRange, tokenType: number, tokenModifiers: number }>()

    constructor(private readonly legend: abs.SemanticTokensLegend) { }

    public push(range: abs.VSCodeRange, tokenType: string, tokenModifiers?: string[]) {
        // [tokenModifiers[0], tokenModifiers[1]] -> 0b00000011
        let tokenModifiersInt = 0
        for (const modifier of tokenModifiers || []) {
            tokenModifiersInt |= 1 << this.legend.tokenModifiers.indexOf(modifier)
        }

        this.data.push({
            range,
            tokenType: this.legend.tokenTypes.indexOf(tokenType),
            tokenModifiers: tokenModifiersInt,
        })
    }

    public build() {
        // ソート
        this.data.sort((tokenA, tokenB) => {
            const a = tokenA.range.start
            const b = tokenB.range.start
            if (a.line === b.line && a.character === b.character) {
                return 0
            }
            if (a.line < b.line) {
                return -1
            }
            if (a.line > b.line) {
                return 1
            }
            if (a.character < b.character) {
                return -1
            }
            return 1
        })

        // エンコード
        const data = new Array<number>()
        let lastLine = 0
        let lastStartChar = 0
        for (let token of this.data) {
            if (lastLine !== token.range.start.line) {
                lastStartChar = 0
            }
            data.push(
                token.range.start.line - lastLine,  // deltaLine
                token.range.start.character - lastStartChar,  // deltaStart
                token.range.end.character - token.range.start.character,  // length
                token.tokenType,
                token.tokenModifiers,
            )
            lastLine = token.range.start.line
            lastStartChar = token.range.start.character
        }

        return { data: Uint32Array.from(data) }
    }
}

export class VSCodeRange implements abs.VSCodeRange {
    static toMonaco(range: abs.VSCodeRange): monacoType.Range {
        return new monaco.Range(range.start.line + 1, range.start.character + 1, range.end.line + 1, range.end.character + 1)
    }
    constructor(public readonly start: abs.Position, public readonly end: abs.Position) { }
}

export class Position implements abs.Position {
    static toMonaco(position: abs.Position): monacoType.Position {
        return new monaco.Position(position.line + 1, position.character + 1)
    }
    static fromMonaco(position: monacoType.IPosition): Position {
        return new Position(position.lineNumber - 1, position.column - 1)
    }
    constructor(public readonly line: number, public readonly character: number) { }
    isEqual(other: abs.Position): boolean {
        return this.line === other.line && this.character === other.character
    }
}

export class TextDocument implements abs.TextDocument {
    uri: abs.Uri
    constructor(private readonly inner: monacoType.editor.ITextModel) {
        this.uri = inner.uri
    }
    public lineAt(line: number): abs.TextLine {
        const text = this.inner.getLineContent(line)
        return {
            lineNumber: line,
            range: new VSCodeRange(
                Position.fromMonaco(this.inner.getPositionAt(this.inner.getOffsetAt({ lineNumber: line + 1, column: 1 }))),
                Position.fromMonaco(this.inner.getPositionAt(this.inner.getOffsetAt({ lineNumber: line + 1, column: text.length + 1 }))),
            ),
            text,
        }
    }
    public getText(range?: abs.VSCodeRange): string {
        if (range === undefined) {
            return this.inner.getValue()
        }
        return this.inner.getValueInRange(VSCodeRange.toMonaco(range))
    }
    public positionAt(offset: number): abs.Position {
        return Position.fromMonaco(this.inner.getPositionAt(offset))
    }
}

export class MarkdownString implements abs.MarkdownString {
    constructor(public readonly text: string = "") { }
    public appendCodeblock(code: string, language: string): MarkdownString {
        return new MarkdownString(this.text + `
\`\`\`${language}
${code}
\`\`\`
`)
    }
    public appendMarkdown(text: string): MarkdownString {
        return new MarkdownString(this.text + "\n" + text)
    }
    public toString(): string {
        return this.text
    }
}
