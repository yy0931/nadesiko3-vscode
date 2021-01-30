const messageElement = /** @type {HTMLElement} */(document.querySelector("#message"))
const outputElement = /** @type {HTMLElement} */(document.querySelector("#output"))
const messageContainer = /** @type {HTMLElement} */(document.querySelector(".message_container"))
const outputContainer = /** @type {HTMLElement} */(document.querySelector(".output_container"))

/** @type {import("../src/nako3/nako3").default} */
// @ts-ignore
const nako3 = navigator.nako3;
nako3.setFunc("言", [["を", "と"]], (/** @type {unknown} */ msg) => window.alert(msg))
nako3.setFunc("表示", [["と", "を", "の"]], (/** @type {unknown} */ s) => {
    outputElement.innerText += `${s}\n`
    outputContainer.scrollTo(0, outputContainer.scrollHeight)
})

const header = `\
カメ描画先は『#nako3_canvas_1』。カメ全消去。
『#nako3_canvas_1』へ描画開始。
『#nako3_div_1』へDOM親要素設定。
`

const printError = (/** @type {string} */ text) => {
    messageElement.innerText = text + "\n"
    messageContainer.scrollTo(0, messageContainer.scrollHeight)
}

const ws = new WebSocket(`ws://${location.host}`)
ws.addEventListener("message", (ev) => {
    /** @type {import("../src/web_nako_server").Data} */
    const data = JSON.parse(ev.data)
    document.title = `なでしこv3: ${data.fileName}`
    nako3.runAsync(header + data.code, data.fileName)
        .catch((err) => {
            printError(err.message)
        })
})
ws.addEventListener("close", () => {
    printError("VSCodeとの接続が切れました。VSCode上でプログラムを再実行してください。")
})

// @ts-ignore
$("#left").resizable({
    containment: "parent",
    handles: "e",
    create: (/** @type {any} */ event, /** @type {any} */ ui) => {
        // @ts-ignore
        $(".ui-resizable-w").css("cursor", "ew-resize")
    }
})
