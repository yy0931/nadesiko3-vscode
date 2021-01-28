import plugin_browser_ajax from "./nako3/plugins/plugin_browser_ajax.js"
import plugin_browser_audio from "./nako3/plugins/plugin_browser_audio.js"
import plugin_browser_canvas from "./nako3/plugins/plugin_browser_canvas.js"
import plugin_browser_chart from "./nako3/plugins/plugin_browser_chart.js"
import plugin_browser_color from "./nako3/plugins/plugin_browser_color.js"
import plugin_browser_dialog from "./nako3/plugins/plugin_browser_dialog.js"
import plugin_browser_dom_basic from "./nako3/plugins/plugin_browser_dom_basic.js"
import plugin_browser_dom_event from "./nako3/plugins/plugin_browser_dom_event.js"
import plugin_browser_dom_parts from "./nako3/plugins/plugin_browser_dom_parts.js"
import plugin_browser_geolocation from "./nako3/plugins/plugin_browser_geolocation.js"
import plugin_browser_hotkey from "./nako3/plugins/plugin_browser_hotkey.js"
import plugin_browser_html from "./nako3/plugins/plugin_browser_html.js"
import plugin_browser_location from "./nako3/plugins/plugin_browser_location.js"
import plugin_browser_speech from "./nako3/plugins/plugin_browser_speech.js"
import plugin_browser_storage from "./nako3/plugins/plugin_browser_storage.js"
import plugin_browser_system from "./nako3/plugins/plugin_browser_system.js"
import plugin_browser_websocket from "./nako3/plugins/plugin_browser_websocket.js"
import plugin_worker from "./nako3/plugins/plugin_worker.js"
import plugin_weykturtle3d from "./nako3/plugins/plugin_weykturtle3d.js"
import plugin_webworker from "./nako3/plugins/plugin_webworker.js"
import plugin_turtle from "./nako3/plugins/plugin_turtle.js"
import plugin_test from "./nako3/plugins/plugin_test.js"
import plugin_system from "./nako3/plugins/plugin_system.js"
import plugin_node from "./nako3/plugins/plugin_node.js"
import plugin_math from "./nako3/plugins/plugin_math.js"
import plugin_markup from "./nako3/plugins/plugin_markup.js"
import plugin_keigo from "./nako3/plugins/plugin_keigo.js"
import plugin_kansuji from "./nako3/plugins/plugin_kansuji.js"
import plugin_express from "./nako3/plugins/plugin_express.js"
import plugin_datetime from "./nako3/plugins/plugin_datetime.js"
import plugin_csv from "./nako3/plugins/plugin_csv.js"
import plugin_caniuse from "./nako3/plugins/plugin_caniuse.js"

export const plugins = ([
    plugin_browser_ajax,
    plugin_browser_audio,
    plugin_browser_canvas,
    plugin_browser_chart,
    plugin_browser_color,
    plugin_browser_dialog,
    plugin_browser_dom_basic,
    plugin_browser_dom_event,
    plugin_browser_dom_parts,
    plugin_browser_geolocation,
    plugin_browser_hotkey,
    plugin_browser_html,
    plugin_browser_location,
    plugin_browser_speech,
    plugin_browser_storage,
    plugin_browser_system,
    plugin_browser_websocket,
    plugin_worker,
    plugin_weykturtle3d,
    plugin_webworker,
    plugin_turtle,
    plugin_test,
    plugin_system,
    plugin_node,
    plugin_math,
    plugin_markup,
    plugin_keigo,
    plugin_kansuji,
    plugin_express,
    plugin_datetime,
    plugin_csv,
    plugin_caniuse,
] as any as Record<string, Record<string, unknown>>[])

// NakoCompiler.addPlugin
export function getBuiltinFuncList() {
    const funclist: Record<string, unknown> = {}
    for (const plugin of plugins) {
        for (const [k, v] of Object.entries(plugin)) {
            // 初期化コードはスキップ
            if (k === '初期化') {
                continue
            }
            // 念の為呼び出せないようにしておく
            funclist[k] = { ...v, fn: (...args: unknown[]) => { } }
        }
    }
    return funclist
}
