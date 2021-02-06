import getDecorations from "./decorations"
import * as abs from "./abstract_vscode"
import { lex } from "../nadesiko3/nako3"
import provideDocumentSemanticTokens from "./semantic_tokens_provider"
import { DeclarationFile } from "../document"

export class LanguageFeatures implements abs.DocumentSemanticTokensProvider {
    private requests = new Map<string, { code: string, callbacks: (() => void)[] }[]>()
    private result = new Map<string, { code: string, tokens: ReturnType<typeof lex>, semanticTokens: ReturnType<typeof provideDocumentSemanticTokens>, decorations: ReturnType<typeof getDecorations> }>()

    public readonly legend: abs.SemanticTokensLegend

    constructor(
        private readonly SemanticTokensBuilder: abs.TypeofSemanticTokensBuilder,
        SemanticTokensLegend: abs.TypeofSemanticTokensLegend,
        private readonly declarationFiles: DeclarationFile[],
        private readonly MarkdownString: abs.TypeofMarkdownString,
        private readonly Uri: abs.TypeofUri,
        private readonly showLink: boolean,
        private readonly VSCodeRange: abs.TypeofVSCodeRange,
        private readonly Position: abs.TypeofPosition,
    ) {
        this.legend = new SemanticTokensLegend(
            ["namespace", "class", "enum", "interface", "struct", "typeParameter", "type", "parameter", "variable", "property", "enumMember", "event", "function", "method", "macro", "label", "comment", "string", "keyword", "number", "regexp", "operator"],
            ["declaration", "definition", "readonly", "static", "deprecated", "abstract", "async", "modification", "documentation", "defaultLibrary"],
        )
    }
    private async onDidChange(document: abs.TextDocument): Promise<void> {
        const uri = document.uri.toString()
        if (!this.requests.has(uri)) {
            this.requests.set(uri, [])
        }
        const code = document.getText()
        const requests = this.requests.get(uri)!
        return new Promise<void>((resolve) => {
            // 前回のリクエストと同じなら、それの終了を待つ
            if (requests.length > 0 && requests[requests.length - 1].code === code) {
                requests[requests.length - 1].callbacks.push(() => { resolve() })
                return
            }

            // 少し待ってから処理を始める。その間に他のリクエストがきたら、そちらを処理する。
            // 待機後、すでに他のリクエストによって処理されていたら、何もしない。
            let canceled = false
            requests.push({
                code,
                callbacks: [() => { canceled = true }]
            })
            setTimeout(() => {
                if (canceled || requests.length === 0) {
                    resolve()
                    return
                }

                // 最新のリクエストを処理する
                const task = requests[requests.length - 1]
                const code = task.code
                const tokens = lex(code)
                const semanticTokens = provideDocumentSemanticTokens(tokens, document, this.legend, this.SemanticTokensBuilder, this.VSCodeRange, this.Position)
                const decorations = getDecorations(tokens, document, this.declarationFiles, this.VSCodeRange, this.Position, this.MarkdownString, this.Uri, this.showLink)
                this.result.set(uri, { code, tokens, semanticTokens, decorations })

                // 全てのリクエストを終了させる
                for (const task of requests) {
                    for (const callback of task.callbacks) {
                        callback()
                    }
                }
                requests.length = 0

                resolve()
            }, 35)
        })
    }
    async getDecorations(document: abs.TextDocument) {
        await this.onDidChange(document)
        return this.result.get(document.uri.toString())!.decorations
    }
    async provideDocumentSemanticTokens(document: abs.TextDocument): Promise<abs.SemanticTokens> {
        await this.onDidChange(document)
        return this.result.get(document.uri.toString())!.semanticTokens
    }
}
