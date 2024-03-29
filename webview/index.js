/** @type {<T>(x: T | null | undefined) => T} */
const notNullish = (x) => /** @type {any} */(x)

const output = notNullish(document.querySelector('#output'))
const clear = notNullish(document.querySelector('#clear'))

const vscode = acquireVsCodeApi()

clear.addEventListener('click', () => {
    output.innerHTML = ''
})
window.addEventListener("message", (/** @type {{ data: { type: 'output' | 'getHTML', html: string } }} */{ data }) => {
    if (data.type === 'output') {
        output.insertAdjacentHTML("beforeend", data.html)
    } else { // getHTML
        vscode.postMessage(output.innerHTML)
    }
})
