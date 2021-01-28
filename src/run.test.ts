import NakoCompiler from "./nako3/nako3"

describe("run", () => {
    it("test", () => {
        console.log(new NakoCompiler().runReset("3秒後に「こんにちは」を表示").log)
    })
})
