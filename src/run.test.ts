import { expect } from "chai"
import NakoCompiler = require("nadesiko3/src/nako3")
import pluginNode = require("nadesiko3/src/plugin_node")
import pluginCSV = require("nadesiko3/src/plugin_csv")

describe("run", () => {
    const compiler = new NakoCompiler()

    for (const plugin of [pluginNode, pluginCSV]) {
        compiler.addPlugin(plugin)
    }

    it("csv", () => {
        expect(compiler.runReset(`\
「あ,い
う,え,
お,か」をCSV取得してJSONエンコードして表示
`, "").log).to.equal(`[["あ","い"],["う","え",""],["お","か"]]`)
    })
})
