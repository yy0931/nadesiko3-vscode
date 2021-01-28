import { expect } from "chai"
import NakoCompiler from "./nako3/nako3"
import { plugins } from "./plugins"

describe("run", () => {
    const compiler = new NakoCompiler()
    for (const plugin of plugins) {
        compiler.addPlugin(plugin)
    }

    it("csv", () => {
        expect(compiler.runReset(`\
「あ,い
う,え,
お,か」をCSV取得してJSONエンコードして表示
`).log).to.equal(`[["あ","い"],["う","え",""],["お","か"]]`)
    })
})
