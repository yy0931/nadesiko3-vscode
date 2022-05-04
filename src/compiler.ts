import fs from "fs"
// @ts-ignore
import { CNako3 } from "nadesiko3/src/cnako3mod.mjs"
// @ts-ignore
import { NakoCompiler } from "nadesiko3/src/nako3.mjs"
import { NakoImportError } from "nadesiko3/src/nako_errors.mjs"
import _version from "nadesiko3/src/nako_version.mjs"
import PluginNode from 'nadesiko3/src/plugin_node.mjs'
import path from "path"

export default class ExtensionNako3Compiler extends NakoCompiler {
    static version = _version

    constructor() {
        super(undefined)
        this.addPluginObject('PluginNode', PluginNode)
    }

    static getPluginDirectory(extensionPath: string) {
        return path.join(extensionPath, "nadesiko3-plugins")
    }

    // 依存ファイルを取り込む。コメントを書いた部分以外はCNako3のコードと同じ
    // NOTE: ウェブから依存するファイルをダウンロードできるように変更する場合は、diagnosticsで使うとき、loadDependenciesを呼ばないか、手動で実行されたときに存在した依存ファイルだけをホワイトリストで許可するべき。
    loadDependencies(code: string, fileName: string, extensionPath: string, isUntitled: boolean) {
        const pluginDir = ExtensionNako3Compiler.getPluginDirectory(extensionPath)
        const log: string[] = []
        return this._loadDependencies(code, fileName, "", {
            resolvePath: (name: string, token: { line: number; file: string }) => {
                if (name.endsWith(".mjs")) {
                    name = name.slice(0, -".mjs".length) + ".js" // .mjs の拡張子でCommonJSのファイルをインポートさせる
                }
                if (/\.m?js(\.txt)?$/.test(name)) {
                    return { filePath: path.resolve(CNako3.findJSPluginFile(name, fileName, pluginDir, log)), type: 'js' } // 変更: __dirnameをpluginDirで置換
                }
                if (/\.nako3?(\.txt)?$/.test(name)) {
                    if (path.isAbsolute(name)) {
                        return { filePath: path.resolve(name), type: 'nako3' }
                    } else {
                        if (isUntitled) {
                            throw new NakoImportError("相対パスによる取り込み文を使うには、ファイルを保存してください。", token.file, token.line) // 追加: Untitledなファイルではファイルパスを取得できない
                        }
                        return { filePath: path.join(path.dirname(token.file + ""), name), type: 'nako3' }
                    }
                }
                throw new NakoImportError(`ファイル『${name}』は拡張子が(.nako3|.js|.js.txt|.mjs|.mjs.txt)以外なので取り込めません。`, token.file, token.line)
            },
            readNako3: (name: string, token: { line: number; file: string }) => {
                if (!fs.existsSync(name)) {
                    throw new NakoImportError(`ファイル ${name} が存在しません。`, token.file, token.line)
                }
                return { sync: true, value: fs.readFileSync(name).toString() }
            },
            readJs: (name: string, token: { line: number; file: string }) => {
                return {
                    sync: true,
                    value: () => {
                        try {
                            return require(name).default
                        } catch (err: unknown) {
                            let msg = `プラグイン ${name} の取り込みに失敗: ${err instanceof Error ? err.message : err + ''}`
                            if (err instanceof Error && err.message.startsWith('Cannot find module')) {
                                msg += `\n次の場所を検索しました: ${log.join(', ')}`
                            }
                            throw new NakoImportError(msg, token.file, token.line)
                        }
                    }
                }
            },
        })
    }
}