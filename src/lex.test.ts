import { LexError, tokenize } from "./tokenize"
import { expect } from "chai"
import prepare from "./prepare"
import addSourceMapToTokens from "./source_mapping"
import { lex } from "./parse"

describe("lex", () => {
    it("prepare", () => {
        expect(prepare("リンゴの値段は30")).to.deep.equal([
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
        const tokens = tokenize("「こんにちは」と表示", 0, "")
        if (tokens instanceof LexError) {
            throw new Error("error")
        }
        expect(tokens[0].preprocessedCodeOffset).to.equal(0) // 0-7: 「こんにちは」と
        expect(tokens[1].preprocessedCodeOffset).to.equal(8) // 8-9: 表示
    })
    it("もし〜ならば", () => {
        const result = lex(`もし、Aが５ならば`) as any
        expect(result.tokens[2]).to.deep.include({ value: 5, startOffset: 5, endOffset: 6 })
        expect(result.tokens[3]).to.deep.include({ value: 'ならば', startOffset: 6, endOffset: 9 })
    })
    it("複数回呼び出し", () => {
        // キャッシュでバグったためテスト
        const a = lex("# ああ")
        const b = lex("# ああ")
        if (a instanceof LexError || b instanceof LexError) {
            throw new Error("error")
        }
        expect(a.tokens).to.deep.equal(a.tokens)
        expect(a.commentTokens).to.deep.equal(a.commentTokens)
    })
})

describe("source mapping", () => {
    const sourceMap = (code: string) => {
        const preprocessed = prepare(code)
        const tokens = tokenize(preprocessed.map((v) => v.text).join(""), 0, "")
        if (tokens instanceof LexError) {
            throw new Error("error")
        }
        return addSourceMapToTokens(tokens, preprocessed, code)
            .map((v) => ({ value: v.value, start: v.startOffset, end: v.endOffset }))
    }

    it("句点無し", () => {
        expect(sourceMap(`「こんにちは」と表示する`)).to.deep.equal([
            { value: 'こんにちは', start: 0, end: 8 },
            { value: '表示', start: 8, end: 12 },
        ])
    })
    it("句点あり", () => {
        expect(sourceMap(`「こんにちは」と表示する。`)).to.deep.equal([
            { value: 'こんにちは', start: 0, end: 8 },
            { value: '表示', start: 8, end: 12 },
            { value: ';', start: 12, end: 13 }
        ])
    })
    it("複数行", () => {
        expect(sourceMap(`「こんにちは」と表示する。「こんにちは」と表示する。`)).to.deep.equal([
            { value: 'こんにちは', start: 0, end: 8 },
            { value: '表示', start: 8, end: 12 },
            { value: ';', start: 12, end: 13 },
            { value: 'こんにちは', start: 13, end: 21 },
            { value: '表示', start: 21, end: 25 },
            { value: ';', start: 25, end: 26 }
        ])
    })
    it("行コメント (1)", () => {
        expect(sourceMap(`# コメント`)).to.deep.equal([
            { value: '# コメント', start: 0, end: 6 },
            { value: 0, start: 6, end: 6 }
        ])
    })
    it("行コメント (2)", () => {
        expect(sourceMap(`# コメント\na`)).to.deep.equal([
            { value: '# コメント', start: 0, end: 6 },
            { value: 0, start: 6, end: 7 },
            { value: 'a', start: 7, end: 8 },
        ])
    })
    it("複数行のコメント (1)", () => {
        expect(sourceMap(`/*\nここは全部コメント\nここは全部コメント\n*/`)).to.deep.equal([
            { value: 'ここは全部コメント\nここは全部コメント\n', start: 0, end: 25 },
        ])
    })
    it("複数行のコメント (2)", () => {
        expect(sourceMap(`/*\nここは全部コメント\nここは全部コメント\n*/a`)).to.deep.equal([
            { value: 'ここは全部コメント\nここは全部コメント\n', start: 0, end: 25 },
            { value: 'a', start: 25, end: 26 }
        ])
    })
    it("'_' + 改行", () => {
        expect(sourceMap(`[_\n]\nりんごの値段は30`)[5]).to.deep.equal({ value: '値段', start: 9, end: 12 })
    })
    it("large file", () => {
        const code = `A=20\n`.repeat(1000)
        const preprocessed = prepare(code)

        // TODO: インデント構文

        // トークン分割
        const tokens = tokenize(preprocessed.map((v) => v.text).join(""), 0, "")
        if (tokens instanceof LexError) {
            return tokens
        }

        // ソースマップを計算
        const result = addSourceMapToTokens(tokens, preprocessed, code)
    })
})
