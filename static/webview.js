window.addEventListener("message", (/** @type {{ data: { type: "out" | "err", line: string } }} */{ data }) => {
    println(data.type, data.line)
})
