export default {
  // @HTML操作
  'HTML変換': { // @文字列をHTMLに変換して返す // @HTMLへんかん
    type: 'func',
    josi: [['を']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  }
}
