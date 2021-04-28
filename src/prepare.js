//@ts-check
const fs = require('fs-extra')
const path = require('path')
const glob = require('glob')

/**
 * ホバーで表示するドキュメントを生成する。
 */
const generateDocuments = () => {
    const dataDir = path.join(__dirname, '../node_modules/nadesiko3doc/data')

    /** @type {Record<string, Record<string, string>>} */
    const result = {}

    for (const filePath of glob.sync(path.join(dataDir, 'plugin_*/*.txt'))) {
        const relative = path.relative(dataDir, filePath)
        const pluginName = path.dirname(relative)
        const name = path.basename(relative).replace(/\.txt$/, '')
        if (!result[pluginName]) {
            result[pluginName] = {}
        }

        const textKonawiki3 = fs.readFileSync(filePath).toString()
        if (textKonawiki3.includes(`{{{\n# 準備中\n}}}`)) {
            continue
        }

        const textMarkdown = textKonawiki3
            // コードブロック
            .replace(/^\{\{\{.*$/gm, '``````')
            .replace(/\}\}\}/g, '``````')
            // 最初の見出し
            .replace(/^●『\[\[[^\]]+\]\]』の詳しい解説/m, '')
            // 見出し
            .replace(/^▲/gm, '### ')
            // リンク
            .replace(/\[\[([^:]+):([^/]+)\/([^\]]+)\]\]/g, (_, linkText, pluginName, name) => {
                return `[${linkText}](https://nadesi.com/v3/doc/index.php?${encodeURIComponent(pluginName + '/' + name)})`
            })
            .replace(/\[\[([^/]+)\/([^\]]+)\]\]/g, (_, pluginName, name) => {
                return `[${pluginName}/${name}](https://nadesi.com/v3/doc/index.php?${encodeURIComponent(pluginName + '/' + name)})`
            })

        result[pluginName][name] = textMarkdown
    }

    fs.writeFileSync("src/docs.js", `\
/** @type {Record<string, Record<string, string>>} */
module.exports = ` + JSON.stringify(result))
}

/**
 * plugin_browserを取り込んでもエラーが飛ばないように、moduleを追加する。
 */
const copyStubModules = () => {
    const dirname = path.join(__dirname, "../stub_modules")
    for (const basename of fs.readdirSync(dirname)) {
        fs.copySync(path.join(dirname, basename), path.join(__dirname, "../node_modules", basename))
    }
}

module.exports = () => {
    generateDocuments()
    copyStubModules()
}
