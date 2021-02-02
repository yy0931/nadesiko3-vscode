import { LexError, tokenize } from "./nadesiko3/nako_lexer"
import { rawTokenize } from "./nadesiko3/nako3"
import { expect } from "chai"
import * as nakoPrepare from "./nadesiko3/nako_prepare"
import { lex, parse, readDeclarations } from "./nadesiko3/nako3"

describe("rawTokenize", () => {
    const mustRawTokenize = (code: string) => {
        const result = rawTokenize(code)
        if (result instanceof LexError) {
            throw result
        }
        return result
    }

    it("prepare", () => {
        expect(nakoPrepare.convert("リンゴの値段は30")).to.deep.equal([
            { text: '_', sourcePosition: 0 },
            { text: '_', sourcePosition: 0 },
            { text: 'リ', sourcePosition: 0 },
            { text: 'ン', sourcePosition: 0 },
            { text: 'ゴ', sourcePosition: 0 },
            { text: '_', sourcePosition: 0 },
            { text: '的', sourcePosition: 0 },
            { text: '_', sourcePosition: 0 },
            { text: '値', sourcePosition: 0 },
            { text: '段', sourcePosition: 0 },
            { text: '_', sourcePosition: 0 },
            { text: '_', sourcePosition: 5 },
            { text: 'は', sourcePosition: 6 },
            { text: '3', sourcePosition: 7 },
            { text: '0', sourcePosition: 8 }
        ])
    })
    it("tokenize", () => {
        const tokens = tokenize("「こんにちは」を表示", 0, "")
        if (tokens instanceof LexError) {
            throw new Error("error")
        }
        expect(tokens[0].preprocessedCodeOffset).to.equal(0) // 0-7: 「こんにちは」と
        expect(tokens[1].preprocessedCodeOffset).to.equal(8) // 8-9: 表示
    })
    it("スペース扱いの文字", () => {
        const result = mustRawTokenize("ならば、A")
        expect(result[0]).to.deep.include({ value: "ならば", startOffset: 0, endOffset: 3 })
        expect(result[1]).to.deep.include({ value: "A", startOffset: 4, endOffset: 5 })
    })
    it("句点無し", () => {
        const result = mustRawTokenize(`「こんにちは」を表示する`)
        expect(result[0]).to.deep.include({ value: 'こんにちは', startOffset: 0, endOffset: 8 })
        expect(result[1]).to.deep.include({ value: '表示', startOffset: 8, endOffset: 12 })
    })
    it("句点あり", () => {
        const result = mustRawTokenize(`「こんにちは」を表示する。`)
        expect(result[0]).to.deep.include({ value: 'こんにちは', startOffset: 0, endOffset: 8 })
        expect(result[1]).to.deep.include({ value: '表示', startOffset: 8, endOffset: 12 })
        expect(result[2]).to.deep.include({ value: ';', startOffset: 12, endOffset: 13 })
    })
    it("複数行", () => {
        const result = mustRawTokenize(`「こんにちは」を表示する。「こんにちは」を表示する。`)
        expect(result[0]).to.deep.include({ value: 'こんにちは', startOffset: 0, endOffset: 8 })
        expect(result[1]).to.deep.include({ value: '表示', startOffset: 8, endOffset: 12 })
        expect(result[2]).to.deep.include({ value: ';', startOffset: 12, endOffset: 13 })
        expect(result[3]).to.deep.include({ value: 'こんにちは', startOffset: 13, endOffset: 21 })
        expect(result[4]).to.deep.include({ value: '表示', startOffset: 21, endOffset: 25 })
        expect(result[5]).to.deep.include({ value: ';', startOffset: 25, endOffset: 26 })
    })
    it("行コメント (1)", () => {
        const result = mustRawTokenize(`# コメント`)
        expect(result[0]).to.deep.include({ value: '# コメント', startOffset: 0, endOffset: 6 })
        expect(result[1]).to.deep.include({ value: 0, startOffset: 6, endOffset: 6 })
    })
    it("行コメント (2)", () => {
        const result = mustRawTokenize(`# コメント\na`)
        expect(result[0]).to.deep.include({ value: '# コメント', startOffset: 0, endOffset: 6 })
        expect(result[1]).to.deep.include({ value: 0, startOffset: 6, endOffset: 7 })
        expect(result[2]).to.deep.include({ value: 'a', startOffset: 7, endOffset: 8 })
    })
    it("複数行のコメント (1)", () => {
        const result = mustRawTokenize(`/*\nここは全部コメント\nここは全部コメント\n*/`)
        expect(result[0]).to.deep.include({ value: 'ここは全部コメント\nここは全部コメント\n', startOffset: 0, endOffset: 25 })
    })
    it("複数行のコメント (2)", () => {
        const result = mustRawTokenize(`/*\nここは全部コメント\nここは全部コメント\n*/a`)
        expect(result[0]).to.deep.include({ value: 'ここは全部コメント\nここは全部コメント\n', startOffset: 0, endOffset: 25 })
        expect(result[1]).to.deep.include({ value: 'a', startOffset: 25, endOffset: 26 })
    })
    it("'_' + 改行", () => {
        expect(mustRawTokenize(`[_\n]\nりんごの値段は30`)[5]).to.deep.include({ value: '値段', startOffset: 9, endOffset: 12 })
    })
    it("large file", () => {
        mustRawTokenize(`A=20\n`.repeat(1000))
    })
    it("インデント構文", () => {
        const result = mustRawTokenize(`！インデント構文\n2回\n    「1」を表示\n\n「2」を表示`)

        // 1つ目のブロック
        expect(result[0]).to.deep.include({ value: '!インデント構文', startOffset: 0, endOffset: 8 })
        expect(result[2]).to.deep.include({ value: 2, startOffset: 9, endOffset: 10 })
        expect(result[3]).to.deep.include({ value: '回', startOffset: 10, endOffset: 11 })
        expect(result[5]).to.deep.include({ value: '1', startOffset: 16, endOffset: 20 })
        expect(result[6]).to.deep.include({ value: '表示', startOffset: 20, endOffset: 22 })
        expect(result[8]).to.deep.include({ value: 'ここまで', startOffset: null, endOffset: null })

        // 自動挿入された「ここまで」の後
        expect(result[10]).to.deep.include({ value: '2', startOffset: 24, endOffset: 28 })
        expect(result[11]).to.deep.include({ value: '表示', startOffset: 28, endOffset: 30 })
    })
})

describe("readDeclarations", () => {
    it("関数の宣言", () => {
        expect(readDeclarations("#!「（nを）階乗」を宣言")["階乗"]).to.deep.include({ type: "func", josi: [["を"]], varnames: ["n"] })
    })
})

describe("lex", () => {
    const mustLex = (code: string) => {
        const result = lex(code)
        if (result instanceof LexError) {
            throw result
        }
        return result
    }

    it("複数回呼び出し", () => {
        const a = mustLex("# ああ")
        const b = mustLex("# ああ")
        expect(a.tokens).to.deep.equal(b.tokens)
        expect(a.commentTokens).to.deep.equal(b.commentTokens)
    })
    it("独立した助詞「ならば」", () => {
        const result = mustLex(`もし、5が5ならば`).tokens
        expect(result[2]).to.deep.include({ value: 5, startOffset: 5, endOffset: 6 })
        expect(result[3]).to.deep.include({ value: 'ならば', startOffset: 6, endOffset: 9 })
    })
    it("string_exへの埋め込み", () => {
        const a = mustLex(`あは20\n"{あ}"`).tokens
        expect(a[4]).to.include({ type: "string", startOffset: 5, endOffset: 7 })
        expect(a[5]).to.include({ type: "&", startOffset: 7, endOffset: 7 })
        expect(a[6]).to.include({ value: "あ", startOffset: 7, endOffset: 8 })
        expect(a[7]).to.include({ type: "&", startOffset: 8, endOffset: 8 })
        expect(a[8]).to.include({ type: "string", startOffset: 8, endOffset: 10 })
    })
})

describe("parse", () => {
    const mustParse = (code: string) => {
        const result = parse(code)
        if ("err" in result) {
            throw result
        }
        return result.ok
    }

    const mustNotParse = (code: string) => {
        const result = parse(code)
        if ("ok" in result) {
            throw new Error()
        }
        if (result.err instanceof LexError) {
            throw result.err
        }
        return result.err
    }

    it("should parse", () => {
        mustParse("「こんにちは」を表示")
    })
    it("should not parse", () => {
        expect(mustNotParse("「こんにちは」」を表示").token.value).to.equal("」")
    })
    it("エラー位置の取得 （行の中間の場合）", () => {
        const err = mustNotParse("「こんにちは」」と表示する")
        expect(err.startOffset).equal(7)
        expect(err.endOffset).equal(8)
    })
    it("エラー位置の取得 （行末の場合）", () => {
        const err = mustNotParse("「こんにちは」に表示する")
        expect(err.startOffset).equal(11)
        expect(err.endOffset).equal(12)
    })
})
