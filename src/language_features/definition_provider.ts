import * as vscode from "vscode"
import { lex } from "../parse"
import { LexErrorWithSourceMap } from "../tokenize"
import { filterTokensByOffset } from "./utils"

const definitionProvider: vscode.DefinitionProvider = {
    provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Definition | vscode.DefinitionLink[]> {
        const parserOutput = lex(document.getText())
        if (parserOutput instanceof LexErrorWithSourceMap) {
            return
        }
        const offset = document.offsetAt(position)

        return filterTokensByOffset(parserOutput.tokens, offset).flatMap((token) => {
            if (token.type !== "func") {
                return []
            }

            // 定義元を取得
            const fn = parserOutput.funclist[token.value as string]
            if (fn.type !== "func") {
                throw new Error("fn.type !== 'func'")
            }
            return fn.declaration.flatMap((declaration) => {
                switch (declaration.type) {
                    case "builtin": return []
                    case "inFile":
                        if (declaration.token.startOffset === null || declaration.token.endOffset === null) {
                            return []
                        }
                        return [
                            new vscode.Location(document.uri, new vscode.Range(
                                document.positionAt(declaration.token.startOffset),
                                document.positionAt(declaration.token.endOffset),
                            )),
                        ]
                    case "plugin": return [] // TODO
                    default:
                        const _: never = declaration
                        throw new Error()
                }
            })
        })
    }
}

export default definitionProvider
