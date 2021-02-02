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
type PluginFuncList = Record<string, { declaration: { type: "plugin", name: string }[] } & (PluginFunction | PluginVariable)>
export const asFuncList = (plugins: Record<string, Plugin>): PluginFuncList => {
    const funclist: PluginFuncList = {}
    for (const [name, plugin] of Object.entries(plugins)) {
        for (const [k, v] of Object.entries(plugin)) {
            // 同じ名前の関数の宣言が複数ある場合、助詞と宣言場所のリストを結合する
            if (funclist[k] !== undefined) {
                const old = funclist[k]
                if (v.type !== old.type) {
                    throw new Error(`名前 ${k} の宣言のマージに失敗`)
                }
                if (old.type === "func" && v.type === "func") {
                    for (let i = 0; i < Math.max(old.josi.length, v.josi.length); i++) {
                        old.josi[i] = [...new Set([...(old.josi[i] || []), ...(v.josi[i] || [])])]
                    }
                }
                old.declaration.push({ type: "plugin", name })
            } else {
                funclist[k] = { ...v, declaration: [{ type: "plugin", name }] }
            }
        }
    }
    return funclist
}
