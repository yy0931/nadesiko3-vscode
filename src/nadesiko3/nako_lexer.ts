/**
 * nako_lexer.js を、ソースコード位置を正確に出力するように変更したコード
 */

import lexRules = require('nadesiko3/src/nako_lex_rules')
import * as josi from 'nadesiko3/src/nako_josi_list'
const josiRE = josi.josiRE

export interface Token {
    type: string
    value: unknown
    line: number   // 使っていない
    column: number // 使っていない
    file: string
    josi: string
    preprocessedCodeOffset: number  // プリプロセスされたコード上の位置
    preprocessedCodeLength: number
    meta?: any
}

export class LexError extends Error {
    constructor(
        public readonly reason: string,
        public readonly preprocessedCodeStartOffset: number,
        public readonly preprocessedCodeEndOffset: number,
    ) {
        super(`LexError: ${reason}`)
    }
}

// NakoLexer.setInput
export const tokenize = (src: string, line: number, filename: string): Token[] | LexError => {
    const srcLength = src.length

    const result: Token[] = []
    // ↓何を表している変数なのか不明。lineCurrentは出力したコードの行数を表している？
    let columnCurrent
    let lineCurrent
    let column = 1
    let isDefTest = false
    while (src !== '') {
        let ok = false
        // 各ルールについて
        for (const rule of lexRules.rules) {
            // 正規表現でマッチ
            const m = rule.pattern.exec(src)
            if (!m) { continue }
            ok = true

            // 空白ならスキップ
            if (rule.name === 'space') {
                column += m[0].length
                src = src.substr(m[0].length)
                continue
            }

            // マッチしたルールがコールバックを持つなら
            if (rule.cbParser) {
                // コールバックを呼ぶ
                let rp: {
                    src: string,    // 残りのコード
                    res: string,    // 生成するコード
                    josi: string,   // 直後の助詞
                    numEOL: number, // res内の\nの数
                }
                if (isDefTest && rule.name === 'word') {
                    rp = rule.cbParser(src, false)
                } else {
                    rp = rule.cbParser(src)
                }

                // テンプレート文字列 aaa{x}bbb{x}cccc の場合は
                if (rule.name === 'string_ex') {
                    // rp.res の中括弧部分を置換したコードを生成する
                    const list = rp.res.split(/[{}｛｝]/)
                    if (list.length >= 1 && list.length % 2 === 0) {
                        return new LexError(
                            '字句解析エラー(' + (line + 1) + '): 展開あり文字列で値の埋め込み{...}が対応していません。',
                            srcLength - src.length,
                            srcLength - rp.src.length,
                        )
                    }

                    let offset = 0
                    for (let i = 0; i < list.length; i++) {
                        const josi = (i === list.length - 1) ? rp.josi : ''
                        if (i % 2 === 0) {
                            result.push({ type: 'string', value: list[i], file: filename, josi, line, column, preprocessedCodeOffset: srcLength - src.length + offset, preprocessedCodeLength: list[i].length + 2 + josi.length })
                            // 先頭なら'"...{'、それ以外なら'}...{'、最後は何でも良い
                            offset += list[i].length + 2
                        } else {
                            // list[i] = `{}`
                            list[i] = lexRules.trimOkurigana(list[i])
                            result.push({ type: '&', value: '&', josi: '', file: filename, line, column, preprocessedCodeOffset: srcLength - src.length + offset, preprocessedCodeLength: 0 })
                            result.push({ type: 'code', value: list[i], josi: '', file: filename, line, column, preprocessedCodeOffset: srcLength - src.length + offset, preprocessedCodeLength: list[i].length })
                            result.push({ type: '&', value: '&', josi: '', file: filename, line, column, preprocessedCodeOffset: srcLength - src.length + offset + list[i].length, preprocessedCodeLength: 0 })
                            offset += list[i].length
                        }
                    }

                    line += rp.numEOL
                    column += src.length - rp.src.length
                    src = rp.src
                    if (rp.numEOL > 0) {
                        column = 1
                    }
                    break
                }

                columnCurrent = column
                column += src.length - rp.src.length
                result.push({ type: rule.name, value: rp.res, josi: rp.josi, line: line, column: columnCurrent, file: filename, preprocessedCodeOffset: srcLength - src.length, preprocessedCodeLength: src.length - rp.src.length })
                src = rp.src
                line += rp.numEOL
                if (rp.numEOL > 0) {
                    column = 1
                }
                break
            }

            // ソースを進める前に位置を計算
            const srcOffset = srcLength - src.length

            // 値を変換する必要があるか？
            let value: unknown = m[0]
            if (rule.cb) { value = rule.cb(value) }
            // ソースを進める
            columnCurrent = column
            lineCurrent = line
            column += m[0].length
            src = src.substr(m[0].length)
            if (rule.name === 'eol' && value === '\n') {
                value = line++
                column = 1
            }

            let josi = ''
            if (rule.readJosi) {
                const j = josiRE.exec(src)
                if (j) {
                    josi = j[0]
                    column += j[0].length
                    src = src.substr(j[0].length)
                }
            }

            switch (rule.name) {
                case 'def_test': {
                    isDefTest = true
                    break
                }
                case 'eol': {
                    isDefTest = false
                    break
                }
                default: {
                    break
                }
            }
            // ここまで‰(#682) を処理
            if (rule.name == 'dec_lineno') {
                line--
                continue
            }

            result.push({
                type: rule.name,
                value: value,
                line: lineCurrent,
                column: columnCurrent,
                file: filename,
                josi: josi,
                preprocessedCodeOffset: srcOffset,
                preprocessedCodeLength: (srcLength - src.length) - srcOffset,
            })
            break
        }
        if (!ok) {
            return new LexError('字句解析で未知の語句(' + (line + 1) + '): ' + src.substr(0, 3) + '...',
                srcLength - src.length,
                srcLength - srcLength + 3,
            )
        }
    }
    return result
}