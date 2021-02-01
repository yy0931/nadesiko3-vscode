/**
 * インデント構文指定があればコードを変換する
 */
export function convert(code: string): { code: string, insertedLines: number[], deletedLines: { lineNumber: number, len: number }[] } {
    // プログラム冒頭に「!インデント構文」があれば変換
    const keywords = ['!インデント構文', '!ここまでだるい']
    // 最初の30行をチェック
    const lines = code.split('\n', 30)
    let bConv = false
    lines.forEach((line) => {
        const s9 = line.substr(0, 8).replace('！', '!')
        if (keywords.indexOf(s9) >= 0) {
            bConv = true
            return true
        }
    })
    if (bConv) {
        return convertGo(code)
    }
    return { code, insertedLines: [], deletedLines: [] }
}

// ありえない改行マークを定義
const SpecialRetMark = '🌟🌟改行🌟🌟s4j#WjcSb😀/FcX3🌟🌟'

function convertGo(code: string): { code: string, insertedLines: number[], deletedLines: { lineNumber: number, len: number }[] } {
    const insertedLines: number[] = []
    const deletedLines: { lineNumber: number, len: number }[] = []

    const END = 'ここまで‰'
    const code2 = replaceRetMark(code) // 文字列の中などの改行を置換
    const lines = code2.split('\n')
    const lines2 = []
    const indentStack: number[] = []
    let lastIndent = 0
    lines.forEach((line) => {
        // trim line
        const lineTrimed = line.replace(/^\s+/, '').replace(/\s+$/, '')
        if (lineTrimed === '') {
            deletedLines.push({ lineNumber: lines2.length, len: line.length })
            return
        }

        // check indent
        const indent = countIndent(line)
        if (lastIndent == indent) {
            lines2.push(line)
            return
        }

        // indent
        if (lastIndent < indent) {
            indentStack.push(lastIndent)
            lastIndent = indent
            lines2.push(line)
            return
        }

        // unindent
        if (lastIndent > indent) {
            // 5回
            //   3回
            //     1を表示
            //   |
            // |
            lastIndent = indent
            while (indentStack.length > 0) {
                const n = indentStack.pop()!
                if (n == indent) {
                    if (lineTrimed != '違えば') {
                        insertedLines.push(lines2.length)
                        lines2.push(makeIndent(n) + END)
                    }
                    lines2.push(line)
                    return
                }
                if (indent < n) {
                    insertedLines.push(lines2.length)
                    lines2.push(makeIndent(n) + END)
                    continue
                }
            }
        }
    })
    // 残りのインデントを処理
    while (indentStack.length > 0) {
        const n = indentStack.pop()!
        insertedLines.push(lines2.length)
        lines2.push(makeIndent(n) + END)
    }
    // 特別マーカーを改行に置換
    const lines3: string[] = []
    for (let i = 0; i < lines2.length; i++) {
        if (lines2[i].includes(SpecialRetMark)) {
            const lines4 = lines2[i].split(SpecialRetMark)

            // 置換されたマーカーの数だけ、それ以降の行数をずらす。
            // unindentによって挿入された行がSpecialRetMarkを含むことはない。
            for (let j = 0; j < insertedLines.length; j++) {
                if (lines3.length < insertedLines[j]) {
                    insertedLines[j] += lines4.length - 1
                    deletedLines[j].lineNumber += lines4.length - 1
                }
            }

            lines3.push(...lines4)
        } else {
            lines3.push(lines2[i])
        }
    }

    return { code: lines3.join("\n"), insertedLines, deletedLines }
}

function makeIndent(count: number) {
    let s = ''
    for (let i = 0; i < count; i++) {
        s += ' '
    }
    return s
}

/**
 * インデントの個数を数える
 */
function countIndent(line: string) {
    let cnt = 0
    for (let i = 0; i < line.length; i++) {
        const ch = line.charAt(i)
        if (ch == ' ') {
            cnt++
            continue
        }
        if (ch == '　') {
            cnt += 2
            continue
        }
        if (ch == '・') {
            cnt += 2
            continue
        }
        if (ch == '\t') {
            cnt += 4
            continue
        }
        break
    }
    return cnt
}


function replaceRetMark(src: string) {
    const len = src.length
    let result = ''
    let eos = ''
    let i = 0
    while (i < len) {
        const c = src.charAt(i)
        // eosか?
        if (eos != '') {
            if (c == eos) {
                eos = ''
            }
            if (c == '\n') {
                result += SpecialRetMark
            } else {
                result += c
            }
            i++
            continue
        }
        // 文字列の改行も無視する
        switch (c) {
            case '"':
            case '\'':
                eos = c
                result += c
                i++
                continue
            case '「':
                eos = '」'
                result += c
                i++
                continue
            case '『':
                eos = '』'
                result += c
                i++
                continue
            case '“':
                eos = '”'
                result += c
                i++
                continue
            case '{':
                eos = '}'
                result += c
                i++
                continue
            case '｛':
                eos = '｝'
                result += c
                i++
                continue
            case '[':
                eos = ']'
                result += c
                i++
                continue
            case '🌴':
                eos = '🌴'
                result += c
                i++
                continue
            case '🌿':
                eos = '🌿'
                result += c
                i++
                continue
            case '【':
                eos = '】'
                result += c
                i++
                continue
        }
        result += c
        i++
    }
    return result
}
