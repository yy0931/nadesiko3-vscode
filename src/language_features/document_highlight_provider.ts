import * as vscode from "vscode"
import { lex } from "../nadesiko3/nako3"
import { LexError } from "../nadesiko3/nako_lexer"
import { filterTokensByOffset, filterVisibleTokens } from "./utils"

const documentHighlightProvider: vscode.DocumentHighlightProvider = {
    provideDocumentHighlights(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.DocumentHighlight[]> {
        const code = document.getText()
        const tokens = lex(code)
        if (tokens instanceof LexError) {
            return []
        }

        const selectedTokens = filterTokensByOffset(tokens.tokens, document.offsetAt(position))
            .filter((token) => token.type === "func" || token.type === "word")
        if (selectedTokens.length < 1) {
            return []
        }
        const selectedToken = selectedTokens[0]

        const result = new Array<vscode.DocumentHighlight>()
        for (const token of filterVisibleTokens(tokens.tokens)) {
            if (!(token.type === selectedToken.type && token.value === selectedToken.value)) {
                continue
            }
            const start = document.positionAt(token.startOffset)
            const end = document.positionAt(token.endOffset)
            switch (token.type) {
                case "func":
                    if (token.isDefinition) {
                        result.push(new vscode.DocumentHighlight(new vscode.Range(start, end), vscode.DocumentHighlightKind.Write))
                    } else {
                        result.push(new vscode.DocumentHighlight(new vscode.Range(start, end), vscode.DocumentHighlightKind.Read))
                    }
                    break
                case "word":
                    result.push(new vscode.DocumentHighlight(new vscode.Range(start, end), vscode.DocumentHighlightKind.Read))
                    break
            }
        }

        return result
    }
}

export default documentHighlightProvider
