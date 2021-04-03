const NakoCompiler = require("nadesiko3/src/nako3")
const PluginNode = require('nadesiko3/src/plugin_node')
const { NakoImportError } = require("nadesiko3/src/nako_errors")
const CNako3 = require("nadesiko3/src/cnako3")
const path = require("path")
const fs = require("fs")

module.exports = class ExtensionNako3Compiler extends NakoCompiler {
    constructor() {
        super()
        this.addPluginObject('PluginNode', PluginNode)
    }

    // 依存ファイルを取り込む。コメントを書いた部分以外はCNako3のコードと同じ
    // NOTE: ウェブから依存するファイルをダウンロードできるように変更する場合は、diagnosticsで使うとき、loadDependenciesを呼ばないか、手動で実行されたときに存在した依存ファイルだけをホワイトリストで許可するべき。
    __loadDependencies(/** @type {string} */code, /** @type {string} */fileName, /** @type {string} */extensionPath, /** @type {boolean} */isUntitled) {
        const srcDir = path.join(extensionPath, "node_modules/nadesiko3/src")
        const log = /** @type {Array<string>} */([])
        return this.loadDependencies(code, fileName, "", {
            resolvePath: (name, token) => {
                if (/\.js(\.txt)?$/.test(name) || /^[^.]*$/.test(name)) {
                    return { filePath: path.resolve(CNako3.findPluginFile(name, fileName, srcDir, log)), type: 'js' }
                }
                if (/\.nako3?(\.txt)?$/.test(name)) {
                    if (path.isAbsolute(name)) {
                        return { filePath: path.resolve(name), type: 'nako3' }
                    } else {
                        if (isUntitled) {
                            throw new NakoImportError("相対パスによる取り込み文を使うには、ファイルを保存してください。", token.line, token.file) // 追加: Untitledなファイルではファイルパスを取得できない
                        }
                        return { filePath: path.join(path.dirname(token.file), name), type: 'nako3' }
                    }
                }
                return { filePath: name, type: 'invalid' }
            },
            readNako3: (name, token) => {
                if (!fs.existsSync(name)) {
                    throw new NakoImportError(`ファイル ${name} が存在しません。`, token.line, token.file)
                }
                return { sync: true, value: fs.readFileSync(name).toString() }
            },
            readJs: (name, token) => {
                try {
                    return { sync: true, value: () => require(name) }
                } catch (/** @type {unknown} */err) {
                    throw new NakoImportError(`プラグイン ${name} の取り込みに失敗: ${err instanceof Error ? err.message : err + ''}\n検索したパス: ${log.join(', ')}`, token.line, token.file)
                }
            },
        })
    }
}