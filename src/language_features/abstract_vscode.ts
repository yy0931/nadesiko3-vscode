/** monacoとVSCodeで共通のコードを使うために、VSCodeへの依存を無くす。 */

/** vscode.Position */
export type TypeofPosition = new (line: number, character: number) => Position
export interface Position {
    readonly line: number
    readonly character: number
    isEqual(other: Position): boolean
}

/** vscode.Range (ブラウザのRangeと名前が被る) */
export type TypeofVSCodeRange = new (start: Position, end: Position) => VSCodeRange
export interface VSCodeRange {
    readonly start: Position
    readonly end: Position
}

export type TypeofSemanticTokensLegend = new (tokenTypes: string[], tokenModifiers: string[]) => SemanticTokensLegend
export interface SemanticTokensLegend {
    readonly tokenTypes: string[]
    readonly tokenModifiers: string[]
}


/** vscode.SemanticTokensBuilder */
export type TypeofSemanticTokensBuilder = new (legend: SemanticTokensLegend) => SemanticTokensBuilder
export interface SemanticTokensBuilder {
    push(range: VSCodeRange, tokenType: string, tokenModifiers?: string[]): void
    build(): SemanticTokens
}

export interface TextLine {
    readonly lineNumber: number;
    readonly text: string;
    readonly range: VSCodeRange;
}

export interface TextDocument {
    lineAt(line: number): TextLine
    getText(range?: VSCodeRange): string
    positionAt(offset: number): Position
}

export type ProviderResult<T> = T | Promise<T>

export interface SemanticTokens {
    readonly resultId?: string
    readonly data: Uint32Array
}

export interface DocumentSemanticTokensProvider {
    provideDocumentSemanticTokens(document: TextDocument): ProviderResult<SemanticTokens>
}

export type TypeofMarkdownString = new (text?: string) => MarkdownString
export interface MarkdownString {
    appendCodeblock(code: string, language: string): MarkdownString
    appendMarkdown(text: string): MarkdownString
}

export interface DecorationOptions {
    range: VSCodeRange,
    hoverMessage?: MarkdownString,
}

export interface TypeofUri {
    parse(text: string): Uri
}
export interface Uri {
    toString(): string
}
