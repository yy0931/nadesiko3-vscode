const errElement = /** @type {HTMLElement} */(document.querySelector("#err"))
const outElement = /** @type {HTMLElement} */(document.querySelector("#out"))
const errContainer = /** @type {HTMLElement} */(document.querySelector("#err-scroll"))
const outContainer = /** @type {HTMLElement} */(document.querySelector("#out-scroll"))
const errClearButton = /** @type {HTMLElement} */(document.querySelector("#err_clear"))
const outClearButton = /** @type {HTMLElement} */(document.querySelector("#out_clear"))

// 結果の出力

/** @type {(type: "out" | "err", text: string) => void} */
const println = (type, text) => {
    if (type === "out") {
        outElement.innerText += text + "\n"
        outContainer.scrollTo(0, outContainer.scrollHeight)
    } else if (type === "err") {
        errElement.innerText += text + "\n"
        errContainer.scrollTo(0, errContainer.scrollHeight)
    } else {
        throw new Error(`Unexpected type: ${type}`)
    }
}

// 「クリア」ボタン
errClearButton.addEventListener("click", () => {
    errElement.innerText = ""
})
outClearButton.addEventListener("click", () => {
    outElement.innerText = ""
})
