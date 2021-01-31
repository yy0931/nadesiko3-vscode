// 置換を巻き戻せる文字列
// TODO: 遅いかも
class Replace {
    private history = new Array<{ from: string, to: string, index: number }>()

    constructor(private code: string) { }

    public getText() {
        return this.code
    }
    public replaceAll(from: string, to: string) {
        while (true) {
            const index = this.getText().indexOf(from)
            if (index === -1) {
                break
            }
            this.history.push({ index, from, to })
            this.code = this.code.replace(from, to)
        }
    }
    public getSourcePosition(i: number): number {
        let code = this.code
        for (const item of [...this.history].reverse()) {
            if (item.from.length !== item.to.length) { // 文字数が変わらないなら何もしない
                if (item.index <= i && i < item.index + item.to.length) { // 置換範囲
                    // 置換文字列が2文字以上のとき、最後の文字は最後の文字へマップする。それ以外は最初の文字へマップする。
                    if (item.to.length >= 2 && i === item.index + item.to.length - 1) {
                        i = item.index + item.from.length - 1
                    } else {
                        i = item.index
                    }
                } else if (i >= item.index + item.to.length) { // 置換範囲より後ろ
                    i += item.from.length - item.to.length
                }
            }
            code = code.slice(0, item.index) + item.from + code.slice(item.index + item.to.length)
        }
        return i
    }
}

// 参考) https://hydrocul.github.io/wiki/blog/2014/1101-hyphen-minus-wave-tilde.html
const HYPHENS: Record<string, boolean> = { // ハイフン問題
    0x2d: true, // ASCIIのハイフン
    0x2010: true, // 別のハイフン
    0x2011: true, // 改行しないハイフン
    0x2013: true, // ENダッシュ
    0x2014: true, // EMダッシュ
    0x2015: true, // 全角のダッシュ
    0x2212: true // 全角のマイナス
}
export const TILDES: Record<string, boolean> = { // チルダ問題
    0x7e: true,
    0x02dc: true, // 小さなチルダ
    0x02F7: true, // Modifier Letter Low Tilde
    0x2053: true, // Swung Dash - 辞書のみだし
    0x223c: true, // Tilde Operator: 数学で Similar to
    0x301c: true, // Wave Dash(一般的な波ダッシュ)
    0xFF5E: true // 全角チルダ
}
// スペース問題
// 参考) http://anti.rosx.net/etc/memo/002_space.html
const SPACES: Record<string, boolean> = {
    0x20: true,
    0x2000: true, // EN QUAD
    0x2002: true, // EN SPACE
    0x2003: true, // EM SPACE
    0x2004: true, // THREE-PER-EM SPACE
    0x2005: true, // FOUR-PER-EM SPACE
    0x2006: true, // SIX-PER-EM SPACE
    0x2007: true, // FIGURE SPACE
    0x2009: true, // THIN SPACE
    0x200A: true, // HAIR SPACE
    0x200B: true, // ZERO WIDTH SPACE
    0x202F: true, // NARROW NO-BREAK SPACE
    0x205F: true, // MEDIUM MATHEMATICAL SPACE
    0x3000: true, // 全角スペース
    0x3164: true // HANGUL FILLER
}
// その他の変換
const convertTable: Record<string, string> = {
    0x09: ' ', // TAB --> SPC
    0x203B: '#', // '※' --- コメント
    // 0x3001: ',', // 読点 --- JSON記法で「,」と「、」を区別したいので読点は変換しないことに。(#276)
    0x3002: ';', // 句点
    0x3010: '[', // '【'
    0x3011: ']', // '】'
    0xFF0C: '、' // 読点 '，' 論文などで利用、ただし句点はドットと被るので変換しない (#735)
}

// NakoPrepare.convert1ch
const convert1ch = (ch: string) => {
    const c = ch.codePointAt(0)!
    // テーブルによる変換
    if (convertTable[c]) { return convertTable[c] }
    // ASCIIエリア
    if (c < 0x7F) { return ch }
    // 全角半角単純変換可能 --- '！' - '～'
    if (c >= 0xFF01 && c <= 0xFF5E) {
        const c2 = c - 0xFEE0
        return String.fromCodePoint(c2)
    }
    // 問題のエリア
    if (HYPHENS[c]) { return '-' }
    if (TILDES[c]) { return '~' }
    if (SPACES[c]) { return ' ' }
    return ch
}

// NakoPrepare.convert
export default function prepare(code: string): Array<{ text: string, sourcePosition: number }> {
    if (!code) { return [] }
    const src = new Replace(code)
    const replaceList = new Array<[string, string]>()

    // 改行コードを統一
    src.replaceAll('\r\n', '\n')
    src.replaceAll('\r', '\n')

    // 「リンゴの値段」→「__リンゴ_的_値段__」(#631)
    // @ts-ignore
    src.getText().replace(/([\u3005\u4E00-\u9FCF_a-zA-Z0-9ァ-ヶー]+?)の([\u3005\u4E00-\u9FCF_a-zA-Z0-9ァ-ヶー]+?)(は|\s*\=)/g, (str: string, p1: string, p2: string) => {
        // 定数宣言は除く
        if (p1 == '定数' || p1 == '変数') return
        const key1 = p1 + 'の' + p2
        const key2 = '__' + p1 + '_的_' + p2 + '__'
        src.replaceAll(key1, key2)
        replaceList.push([key1, key2])
    })

    let flagStr = false  // 文字列リテラル内かどうか
    let flagStr2 = false  // 絵文字による文字列リテラル内かどうか
    let endOfStr = ""  // 文字列リテラルを終了させる記号
    let res = new Array<{ text: string, sourcePosition: number }>()
    let left = 0  // 現在処理中の部分文字列の左端の位置
    let str = '' // 文字列リテラルの値

    // 一文字ずつ全角を半角に置換する
    let i = 0
    while (i < src.getText().length) {
        const c = src.getText().charAt(i)
        const ch2 = src.getText().substr(i, 2)
        // 文字列のとき
        if (flagStr) {
            if (c === endOfStr) {
                flagStr = false
                replaceList.forEach((key) => { str = str.split(key[1]).join(key[0]) })
                res.push({ text: str + endOfStr, sourcePosition: src.getSourcePosition(left) })
                i++
                left = i
                continue
            }
            str += c
            i++
            continue
        }
        // 絵文字制御による文字列のとき
        if (flagStr2) {
            if (ch2 === endOfStr) {
                flagStr2 = false
                replaceList.forEach((key) => { str = str.split(key[1]).join(key[0]) })
                res.push({ text: str + endOfStr, sourcePosition: src.getSourcePosition(left) })
                i += 2
                left = i
                continue
            }
            str += c
            i++
            continue
        }
        // 文字列判定
        if (c === '「') {
            res.push({ text: c, sourcePosition: src.getSourcePosition(left) })
            i++
            left = i
            flagStr = true
            endOfStr = '」'
            str = ''
            continue
        }
        if (c === '『') {
            res.push({ text: c, sourcePosition: src.getSourcePosition(left) })
            i++
            left = i
            flagStr = true
            endOfStr = '』'
            str = ''
            continue
        }
        if (c === '“') {
            res.push({ text: c, sourcePosition: src.getSourcePosition(left) })
            i++
            left = i
            flagStr = true
            endOfStr = '”'
            str = ''
            continue
        }
        // JavaScriptの内部的には文字列はUTF-16で扱われてるので charAt を使う場合 絵文字が2文字扱いになる --- #726
        if (ch2 === '🌴' || ch2 === '🌿') {
            res.push({ text: ch2, sourcePosition: src.getSourcePosition(left) })
            i += 2
            left = i
            flagStr2 = true
            endOfStr = ch2
            str = ''
            continue
        }
        const c1 = convert1ch(c)
        if (c1 === '"' || c1 === '\'') {
            res.push({ text: c1, sourcePosition: src.getSourcePosition(left) })
            i++
            left = i
            flagStr = true
            endOfStr = c
            str = ''
            continue
        }
        // ラインコメントを飛ばす (#725)
        if (c1 === '#') {
            res.push({ text: c1, sourcePosition: src.getSourcePosition(left) })
            i++
            left = i
            flagStr = true // 本当はコメントだけど便宜上
            endOfStr = '\n'
            str = ''
            continue
        }
        // ラインコメントを飛ばす
        if (ch2 === '//' || ch2 == '／／') {
            res.push({ text: '//', sourcePosition: src.getSourcePosition(left) })  // 強制的に'//'とする
            i += 2
            left = i
            flagStr = true
            endOfStr = '\n'
            str = ''
            continue
        }
        // 複数行コメント内を飛ばす (#731)
        if (ch2 === '/*') {
            res.push({ text: ch2, sourcePosition: src.getSourcePosition(left) })
            i += 2
            left = i
            flagStr2 = true
            endOfStr = '*/'
            str = ''
            continue
        }
        // 変換したものを追加
        res.push({ text: c1, sourcePosition: src.getSourcePosition(left) })
        i++
        left = i
    }
    if (flagStr || flagStr2) {
        res.push({ text: str + endOfStr, sourcePosition: src.getSourcePosition(left) })
    }
    return res
}
