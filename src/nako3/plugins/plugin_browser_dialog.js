export default {
  // @ダイアログ
  '言': { // @メッセージダイアログにSを表示 // @いう
    type: 'func',
    josi: [['と', 'を']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  '尋': { // @メッセージSと入力ボックスを出して尋ねる // @たずねる
    type: 'func',
    josi: [['と', 'を']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  },
  '文字尋': { // @メッセージSと入力ボックスを出して尋ねる。返り値は常に入力されたままの文字列となる // @もじたずねる
    type: 'func',
    josi: [['と', 'を']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  },
  '二択': { // @メッセージSと[OK]と[キャンセル]のダイアログを出して尋ねる // @にたく
    type: 'func',
    josi: [['で', 'の', 'と', 'を']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  }
}
