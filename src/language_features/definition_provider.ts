import * as vscode from "vscode"
import { lex } from "../nadesiko3/nako3"
import { LexErrorWithSourceMap } from "../nadesiko3/nako3"
import { filterTokensByOffset } from "./utils"
import { DeclarationFile } from "../document"

export default class DefinitionProvider implements vscode.DefinitionProvider {
    constructor(private readonly declarationFiles: DeclarationFile[]) { }

    provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.Location[] {
        const parserOutput = lex(document.getText())
        if (parserOutput instanceof LexErrorWithSourceMap) {
            return []
        }
        const offset = document.offsetAt(position)

        // TODO: 変数については、最初にnako_genを走らせてvarslistに変更があるたびに記録して判断するべきだと思う。
        const result: vscode.Location[] = []

        for (const token of filterTokensByOffset(parserOutput.tokens, offset)) {
            if (token.type !== "func") {
                continue
            }

            // 定義元を取得
            const fn = parserOutput.funclist[token.value as string]
            if (fn.type !== "func") {
                throw new Error("fn.type !== 'func'")
            }
            for (const declaration of fn.declaration) {
                switch (declaration.type) {
                    case "inFile":
                        if (declaration.token.startOffset === null || declaration.token.endOffset === null) {
                            break
                        }
                        result.push(new vscode.Location(document.uri, new vscode.Range(
                            document.positionAt(declaration.token.startOffset),
                            document.positionAt(declaration.token.endOffset),
                        )))
                        break
                    case "plugin": {
                        // プラグインの宣言ファイルが存在するかのように見せかける
                        const locations = new Array<number>()
                        const file = this.declarationFiles.find((file) => file.name === declaration.name + ".nako3")
                        if (file === undefined) {
                            console.error(`プラグインの宣言ファイル ${declaration.name}.nako3 が見つかりません。`)
                            break
                        }
                        const lineNumber = file.nameToLineNumber.get(token.value as string)
                        if (lineNumber !== undefined) {
                            const uri = vscode.Uri.parse(`nadesiko3-plugin-declaration:${file.name}`)
                            result.push(new vscode.Location(uri, new vscode.Range(new vscode.Position(lineNumber, 0), new vscode.Position(lineNumber, file.lines[lineNumber].length))))
                            locations.push(lineNumber)
                        }
                        break
                    } default:
                        const _: never = declaration
                        throw new Error()
                }
            }
        }

        return result
    }
}
