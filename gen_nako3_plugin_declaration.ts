import * as fs from "fs"
import * as path from "path"
import * as json5 from "json5"

let result = `\
// ${path.basename(__filename)} によって自動生成されたコード

const plugins: Record<string, Record<string, Omit<PluginFunction, "fn"> | PluginVariable>> = {
`

const srcDir = path.join(__dirname, "node_modules/nadesiko3/src")
for (const file of fs.readdirSync(srcDir)) {
    if (!/^plugin_[^\.]+\.js$/.test(file)) {
        continue
    }
    const content = fs.readFileSync(path.join(srcDir, file)).toString()

    const declarations: Record<string, { type?: string, josi?: string[][] }> = {}
    let current: { name?: string, type?: string, josi?: string[][] } = {}

    for (let line of content.split("\n")) {
        let matches: RegExpMatchArray | null

        // 関数名
        if (matches = /^\s*['"]([^'"]+)['"]:\s*{/.exec(line)) {
            if (current.name !== undefined) {
                declarations[current.name] = { type: current.type, josi: current.josi }
                current = {}
            }
            current.name = matches[1]
            line = line.slice(matches[0].length)
        }

        // type
        if (current.type === undefined && (matches = /^\s*type:\s*['"]([^'"]+)['"],/.exec(line))) {
            const type = matches[1]
            current.type = type
            line = line.slice(matches[0].length)
        }

        // josi
        if (current.josi === undefined && (matches = /^\s*josi:\s*(\[.*\]),[^,]*$/.exec(line))) {
            try {
                const josi = json5.parse(matches[1])
                current.josi = josi
            } catch (e) {
                console.log(`parse error: ${json5.stringify(matches[1])}`)
            }
            line = line.slice(matches[0].length)
        }
    }
    if (current.name !== undefined) {
        declarations[current.name] = { type: current.type, josi: current.josi }
    }

    result += `    ${JSON.stringify(file)}: ${json5.stringify(declarations)},\n`
}

fs.writeFileSync("src/nako3_plugins.ts", `${result}}

export interface PluginFunction {
    type: "func"
    josi: string[][]
    fn: (...args: any[]) => any
}
export interface PluginVariable {
    type: "const" | "var"
}
export type Plugin = Record<string, PluginFunction | PluginVariable>

// 空のfnを加える
export const mockPlugins: Record<string, Plugin> = {}
for (const [pluginName, plugin] of Object.entries(plugins)) {
    mockPlugins[pluginName] = {}
    for (const [name, f] of Object.entries(plugin)) {
        if (name === "初期化") {
            continue
        }
        mockPlugins[pluginName][name] = f.type === "func" ? { ...f, fn: (...args: any[]) => { } } : { ...f }
    }
}

/** pluginsをcloneして、1つのプラグインへまとめる。 */
export function asFuncList(plugins: Record<string, Plugin>): Plugin {
    const funclist: Plugin = {}
    for (const plugin of Object.values(plugins)) {
        for (const [k, v] of Object.entries(plugin)) {
            funclist[k] = { ...v }
        }
    }
    return funclist
}
`)
