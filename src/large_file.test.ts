import { lex, convertToken } from "./parse"
import prepare from "./prepare"
import addSourceMapToTokens from "./source_mapping"
import { LexError, tokenize, rawTokenize, TokenWithSourceMap } from "./tokenize"

const code = `A=20\n`.repeat(1000)

describe("large file", () => {
    it("test", () => {
        const preprocessed = prepare(code)

        // // TODO: インデント構文

        // トークン分割
        const tokens = tokenize(preprocessed.map((v) => v.text).join(""), 0, "")
        if (tokens instanceof LexError) {
            return tokens
        }

        // ソースマップを計算
        const result = addSourceMapToTokens(tokens, preprocessed, code)
    })
})
