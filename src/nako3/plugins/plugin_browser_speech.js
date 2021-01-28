export default {
  // @音声合成
  '話': { // @音声合成APIを使って、Sを発話する // @はなす
    type: 'func',
    josi: [['と', 'を', 'の']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  },
  '話終時': { // @音声合成APIを使って、Sを発話し発話した後でcallbackを実行 // @はなしおわったとき
    type: 'func',
    josi: [['で'], ['と', 'を', 'の']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  },
  '話者一覧取得': { // @音声合成APIの話者一覧を得る // @わしゃいちらんしゅとく
    type: 'func',
    josi: [],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  },
  '話者設定': { // @音声合成APIの話者を指定する // @わしゃせってい
    type: 'func',
    josi: [['に', 'へ']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  },
  '話者速度': { type: 'const', value: 1.0 }, // @わしゃそくど
  '話者声高': { type: 'const', value: 1.0 }, // @わしゃこわだか
  '話者音量': { type: 'const', value: 1.0 }, // @わしゃこおんりょう
  '話者詳細設定': { // @音声合成APIの話者の設定をオブジェクト形式で設定する。『速度,声高,ピッチ,音量』を指定 // @わしゃしょうさいせってい
    type: 'func',
    josi: [['で', 'に', 'へ']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  }
}
