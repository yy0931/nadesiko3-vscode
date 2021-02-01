import * as nakoParserConst from "nadesiko3/src/nako_parser_const"
import { rawTokenize, tokenize, Token, LexError, TokenWithSourceMap } from "./tokenize"
import reservedWords = require("nadesiko3/src/nako_reserved_words")
import { tarareba } from "nadesiko3/src/nako_josi_list"
import { mockPlugins, asFuncList, Plugin } from "./nako3_plugins"

type FuncList = Record<string, any>

// NakoCompiler.parse の前半
export const lex = (code: string): { commentTokens: TokenWithSourceMap[], tokens: TokenWithSourceMap[], funclist: FuncList } | LexError => {
    let tokens = rawTokenize(code)
    if (tokens instanceof LexError) {
        return tokens
    }

    // convertTokenで消されるコメントのトークンを残す
    const commentTokens: TokenWithSourceMap[] = tokens.filter((t) => t.type === "line_comment" || t.type === "range_comment")
        .map((v) => ({ ...v }))  // clone

    const funclist = asFuncList(mockPlugins)
    convertToken(tokens, funclist, true)

    for (let i = 0; i < tokens.length; i++) {
        if (tokens[i].type === 'code') {
            // NakoCompiler.tokenize
            const children = rawTokenize(tokens[i].value as string)
            if (children instanceof LexError) {
                return children
            }

            // 文字列内位置からファイル内位置へ変換
            const start = tokens[i].startOffset
            if (start === null) {
                for (const token of children) {
                    token.startOffset = null
                    token.endOffset = null
                }
            } else {
                for (const token of children) {
                    if (token.startOffset !== null) {
                        token.startOffset += start
                    }
                    if (token.endOffset !== null) {
                        token.endOffset += start
                    }
                }
            }

            commentTokens.push(...children.filter((t) => t.type === "line_comment" || t.type === "range_comment"))

            convertToken(children, funclist, false)

            tokens.splice(i, 1, ...children)
            i--
        }
    }

    return { commentTokens, tokens, funclist }
}

// // NakoCompiler.parse
// const parse = (code: string) => {
//     const lexerOutput = lex(code)
//     if (lexerOutput instanceof LexError) {
//         return lexerOutput
//     }

//     // 構文木を作成
//     const ast = parser.parse(lexerOutput.tokens)
//     this.usedFuncs = this.getUsedFuncs(ast)
//     return ast
// }

// NakoCompiler.convertToken
export const convertToken = (tokens: TokenWithSourceMap[], funclist: FuncList, isFirst = true): void => {
    // 関数の定義があれば funclist を更新
    preDefineFunc(tokens, funclist)

    replaceWord(tokens, funclist)

    if (isFirst) {
        const eofLine = (tokens.length > 0) ? tokens[tokens.length - 1].line : 0
        const filename = (tokens.length > 0) ? tokens[tokens.length - 1].file : ''
        tokens.push({ type: 'eol', line: eofLine, column: 0, file: filename, josi: '', value: '---', endOffset: null, startOffset: null, rawJosi: "" }) // 改行
        tokens.push({ type: 'eof', line: eofLine, column: 0, file: filename, josi: '', value: '', endOffset: null, startOffset: null, rawJosi: "" }) // ファイル末尾
    }
}

// NakoLexer.preDefineFunc
const preDefineFunc = (tokens: TokenWithSourceMap[], funclist: FuncList): void => {
    let i = 0
    let isFuncPointer = false
    const readArgs = (): [string[][], string[], any[]] => {
        const args: (TokenWithSourceMap & { funcPointer: boolean })[] = []
        const keys: Record<string, string[]> = {}
        if (tokens[i].type !== '(') { return [] as any }
        i++
        while (tokens[i]) {
            const t = tokens[i] as (TokenWithSourceMap & { funcPointer: boolean })
            i++
            if (t.type === ')') { break }
            else if (t.type === 'func') { isFuncPointer = true }
            else if (t.type !== '|' && t.type !== 'comma') {
                if (isFuncPointer) {
                    t.funcPointer = true
                    isFuncPointer = false
                }
                args.push(t)
                if (!keys[t.value as string]) { keys[t.value as string] = [] }

                keys[t.value as string].push(t.josi)
            }
        }
        const varnames: string[] = []
        const funcPointers: any[] = []
        const result: string[][] = []
        const already: Record<string, boolean> = {}
        for (const arg of args) {
            if (!already[arg.value as string]) {
                const josi = keys[arg.value as string]
                result.push(josi)
                varnames.push(arg.value as string)
                if (arg.funcPointer) { funcPointers.push(arg.value as any) }
                else { funcPointers.push(null) }

                already[arg.value as string] = true
            }
        }

        return [result, varnames, funcPointers]
    }
    // トークンを一つずつ確認
    while (i < tokens.length) {
        // タイプの置換
        const t = tokens[i]
        // 無名関数の定義：「xxには**」があった場合 ... 暗黙的な関数定義とする
        if ((t.type === 'word' && t.josi === 'には') || (t.type === 'word' && t.josi === 'は~')) {
            t.josi = 'には'
            tokens.splice(i + 1, 0, { type: 'def_func', value: '関数', line: t.line, column: t.column, file: t.file, josi: '', startOffset: t.endOffset, endOffset: t.endOffset, rawJosi: "" })
            i++
            continue
        }
        // N回をN|回に置換
        if (t.type === 'word' && t.josi === '' && (t.value as string).length >= 2) {
            if ((t.value as string).match(/回$/)) {
                t.value = (t.value as string).substr(0, (t.value as string).length - 1)
                tokens.splice(i + 1, 0, { type: '回', value: '回', line: t.line, column: t.column, file: t.file, josi: '', startOffset: t.endOffset! - 1, endOffset: t.endOffset, rawJosi: "" })
                t.endOffset! -= 1
                i++
            }
        }
        // 予約語の置換
        if (t.type === 'word' && reservedWords[t.value as string]) {
            t.type = reservedWords[t.value as string]
            if (t.value === 'そう') { t.value = 'それ' }
        }
        // 関数定義の確認
        if (t.type !== 'def_test' && t.type !== 'def_func') {
            i++
            continue
        }
        const defToken = t
        i++ // skip "●"
        let josi: any[] = []
        let varnames: string[] = []  // 各引数の名前
        let funcPointers: any[] = []
        let funcName = ''
        // 関数名の前に引数定義
        if (tokens[i] && tokens[i].type === '(') { [josi, varnames, funcPointers] = readArgs() }

        // 関数名
        if (tokens[i] && tokens[i].type === 'word') { funcName = tokens[i++].value as string }

        // 関数名の後で引数定義
        if (josi.length === 0 && tokens[i] && tokens[i].type === '(') { [josi, varnames, funcPointers] = readArgs() }

        // 関数定義か？
        if (funcName !== '') {
            // @ts-ignore
            funclist[funcName] = {
                type: 'func',
                josi,
                fn: null,
                varnames,
                funcPointers
            }
        }

        // 無名関数のために
        //@ts-ignore
        defToken.meta = { josi, varnames, funcPointers }
    }
}

// NakoLexer.replaceWord
const replaceWord = (tokens: TokenWithSourceMap[], funclist: FuncList) => {
    let comment = []
    let i = 0
    const getLastType = () => {
        if (i <= 0) { return 'eol' }
        return tokens[i - 1].type
    }
    while (i < tokens.length) {
        const t = tokens[i]
        if (t.type === 'word' && t.value !== 'それ') {
            // 関数を変換
            let fo = funclist[t.value as string]
            if (fo && fo.type === 'func') {
                t.type = 'func'
                t.meta = fo
                continue
            }
        }
        // 数字につくマイナス記号を判定
        // (ng) 5 - 3 || word - 3
        // (ok) (行頭)-3 || 1 * -3 || Aに -3を 足す
        if (t.type === '-' && tokens[i + 1] && tokens[i + 1].type === 'number') {
            // 一つ前の語句が、(行頭|演算子|助詞付きの語句)なら 負数である
            const ltype = getLastType()
            if (ltype === 'eol' || nakoParserConst.opPriority[ltype] || tokens[i - 1].josi !== '') {
                tokens.splice(i, 1) // remove '-'
                //@ts-ignore
                tokens[i].value *= -1
            }
        }
        // 助詞の「は」を = に展開
        if (t.josi === undefined) { t.josi = '' }
        if (t.josi === 'は') {
            tokens.splice(i + 1, 0, { type: 'eq', line: t.line, column: t.column, file: t.file, value: '', josi: '', startOffset: t.endOffset! - 'は'.length, endOffset: t.endOffset, rawJosi: "" })
            i += 2
            t.josi = ''
            t.endOffset! -= 'は'.length
            continue
        }
        // 「とは」を一つの単語にする
        if (t.josi === 'とは') {
            tokens.splice(i + 1, 0, { type: t.josi, line: t.line, column: t.column, file: t.file, value: '', josi: '', startOffset: t.endOffset! - 'とは'.length, endOffset: t.endOffset, rawJosi: "" })
            t.josi = ''
            i += 2
            t.endOffset! -= 'とは'.length
            continue
        }
        // 助詞のならばをトークンとする
        if (tarareba[t.josi]) {
            const josi = (t.josi !== 'でなければ') ? 'ならば' : 'でなければ'
            t.josi = ''
            tokens.splice(i + 1, 0, { type: 'ならば', value: josi, line: t.line, column: t.column, file: t.file, josi: '', startOffset: t.endOffset! - t.rawJosi.length, endOffset: t.endOffset, rawJosi: "" })
            t.endOffset! -= t.rawJosi.length
            i += 2
            continue
        }
        // '_' + 改行 を飛ばす (演算子直後に改行を入れたい場合に使う)
        if (t.type === '_eol') {
            tokens.splice(i, 1)
            continue
        }
        // コメントを飛ばす
        if (t.type === 'line_comment' || t.type === 'range_comment') {
            comment.push(t.value)
            tokens.splice(i, 1)
            continue
        }
        // 改行にコメントを埋め込む
        if (t.type === 'eol') {
            t.value = comment.join('/')
            comment = []
        }
        i++
    }
}