export default {
  // @ホットキー
  'ホットキー登録': { // @ホットキーKEYにEVENTを登録する // @ほっときーとうろく
    type: 'func',
    josi: [['に', 'で'], ['を']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  },
  'ホットキー解除': { // @ホットキーKEYを解除する // @ほっときーかいじょ
    type: 'func',
    josi: [['を', 'の']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  }
}
