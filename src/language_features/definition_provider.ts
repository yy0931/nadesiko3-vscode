import * as vscode from "vscode"
import { mockPlugins } from "../nako3_plugins"
import { lex } from "../parse"
import { LexErrorWithSourceMap } from "../tokenize"
import { filterTokensByOffset } from "./utils"

const createParameterName = (i: number): string => {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")
    return i.toString(26).split("").map((v) => alphabet[parseInt(v, 26)]).join("")
}

export default class DefinitionProvider implements vscode.DefinitionProvider {
    constructor(private readonly showVirtualDocument: (content: string, name: string, extension: string, overwrite: boolean, show: boolean) => Promise<vscode.Uri>) { }

    async provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.Definition | vscode.DefinitionLink[]> {
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
                        const lines = [`// ${declaration.name.startsWith("builtin_") ? "" : "プラグイン "}${declaration.name} が定義する関数の宣言`, ``]
                        if (declaration.name.startsWith("builtin_")) {
                            lines.push(`// 「（Aと|Aを|Aの）表示」の定義が実行時に追加される場合が多いため、特別に宣言しています。`, ``)
                        }
                        for (const [k, v] of Object.entries(mockPlugins[declaration.name])) {
                            if (v.type === "func") {
                                if (k === token.value as string) {
                                    locations.push(lines.length)
                                }
                                let args = v.josi.map((union, i) => union.map((v) => `${createParameterName(i)}${v}`).join("|")).join("、")
                                if (args !== "") {
                                    args = `（${args}）`
                                }
                                lines.push(`#!「${args}${k}」を宣言`)
                            }
                        }
                        const uri = await this.showVirtualDocument(lines.join("\n") + "\n", declaration.name, ".nako3", true, false)
                        for (const i of locations) {
                            result.push(new vscode.Location(uri, new vscode.Range(new vscode.Position(i, 0), new vscode.Position(i, lines[i].length))))
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
