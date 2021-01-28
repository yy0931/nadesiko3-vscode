const errMsgCanvasInit = '描画を行うためには、HTML内にcanvasを配置し、idを振って『描画開始』命令に指定します。'

export default {
  // @描画
  '描画開始': { // @描画先にCanvas(文字列でクエリの指定も可)を指定して描画API(2D)の利用準備する // @びょうがかいし
    type: 'func',
    josi: [['の', 'へ', 'で']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  '描画中キャンバス': { type: 'const', value: null }, // @ びょうがちゅうきゃんばす
  '線色設定': { // @Canvasの線の描画色(lineStyle)を指定する   // @ せんいろしてい
    type: 'func',
    josi: [['に', 'へ']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  '塗色設定': { // @Canvasへの描画色(fillStyle)を指定する   // @ ぬりいろしてい
    type: 'func',
    josi: [['に', 'へ']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  '線描画': { // @ [x1, y1]から[x2, y2]まで線を描画する // @ せんびょうが
    type: 'func',
    josi: [['から'], ['へ', 'まで']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  '線太設定': { // @ vに線の太さ設定 // @ せんふとさせってい
    type: 'func',
    josi: [['に', 'へ']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  '四角描画': { // @ [x, y, w, h]で矩形を描画する // @ しかくびょうが
    type: 'func',
    josi: [['の', 'へ', 'に']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  '描画クリア': { // @ [x, y, w, h]の範囲を描画クリア // @ びょうがくりあ
    type: 'func',
    josi: [['の', 'へ', 'に']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  '円描画': { // @ [x, y]へrの円を描画する // @ えんびょうが
    type: 'func',
    josi: [['へ', 'に'], ['の']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  '楕円描画': { // @ [x, y, x幅, y幅, 回転, 開始角, 終了角, 左回転か]に楕円を描画する // @ だえんびょうが
    type: 'func',
    josi: [['へ', 'に', 'の']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  '多角形描画': { // @ 座標配列vを指定して多角形を描画する // @ たかっけいびょうが
    type: 'func',
    josi: [['で', 'の', 'を']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  '画像描画': { // @ ファイル名F(またはImage)の画像を[sx, sy, sw, sh]の[dx, dy, dw, dh]へ描画し、Imageを返す // @ がぞうびょうが
    type: 'func',
    josi: [['の', 'を'], ['の', 'を'], ['へ', 'に']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: false
  },
  '描画フォント設定': { // @ 描画フォントを指定する(CSSのフォント設定と同じ 例「36px Aria」) // @ びょうがふぉんとせってい
    type: 'func',
    josi: [['を', 'の', 'で', 'に']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  '文字描画': { // @ [x, y]へテキストSを描画する(描画フォント設定でサイズなど指定) // @ がぞうびょうが
    type: 'func',
    josi: [['へ', 'に'], ['の', 'を']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  }
}
