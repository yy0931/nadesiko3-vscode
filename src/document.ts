/**
 * なでしこ言語及びそのシグネチャの生成
 */

import { Plugin } from "./nako3_plugins"

/**
 * A, B, C, ... Z, AA, AB, ... を返す。
 */
export const createParameterName = (i: number): string => {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")
    return i.toString(26).split("").map((v) => alphabet[parseInt(v, 26)]).join("")
}

/** "（Aと|Aの、Bを）"の形式の、パラメータの定義を表す文字列を生成する。パラメータが無い場合、空文字列を返す。 */
export const createParameterDeclaration = (josi: string[][]): string => {
    const args = josi.map((union, i) => union.map((v) => `${createParameterName(i)}${v}`).join("|")).join("、")
    if (args !== "") {
        return `（${args}）`
    } else {
        return ``
    }
}

/**
 * プラグインの宣言ファイルを生成
 */
export const createDeclarationFile = (pluginName: string, plugin: Plugin) => {
    // buildin_ で始まる場合は特別扱いする
    const lines = [`// ${pluginName.startsWith("builtin_") ? "" : "プラグイン "}${pluginName} が定義する関数の宣言`, ``]
    if (pluginName.startsWith("builtin_")) {
        lines.push(`// 「（Aと|Aを|Aの）表示」の定義が実行時に追加される場合が多いため、特別に宣言しています。`, ``)
    }

    const nameToLineNumber = new Map<string, number>()
    for (const [k, v] of Object.entries(plugin)) {
        if (v.type === "func") {
            nameToLineNumber.set(k, lines.length)
            lines.push(`#!「${createParameterDeclaration(v.josi)}${k}」を宣言`)
        }
    }

    return { nameToLineNumber, lines, content: lines.join("\n") + "\n", name: pluginName + ".nako3" }
}

export type DeclarationFile = ReturnType<typeof createDeclarationFile>
