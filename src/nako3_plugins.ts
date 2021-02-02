import pluginData from "./nako3_plugins_data"

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
for (const [pluginName, plugin] of Object.entries(pluginData)) {
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
            if (v.type !== funclist[k].type) {
                throw new Error(`名前 ${k} の宣言のマージに失敗`)
            }
            if (v.type === "func") {
                v.josi = v.josi.map((union, i) => [...new Set(union), ...(funclist[k] as PluginFunction).josi[i]])
            }
        }
    }
    return funclist
}
