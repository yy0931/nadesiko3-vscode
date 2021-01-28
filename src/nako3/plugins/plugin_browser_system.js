export default {
  // @システム
  '終': { // @ブラウザでプログラムの実行を強制終了する // @おわる
    type: 'func',
    josi: [],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  }
}
