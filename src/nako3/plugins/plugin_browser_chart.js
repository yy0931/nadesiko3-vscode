export default {
  // @グラフ描画_CHARTJS
  'グラフ描画': { // @ Chart.jsを利用して、DATAのグラフを描画 // @ぐらふびょうが
    type: 'func',
    josi: [['を', 'で', 'の']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  },
  'グラフオプション': { type: 'const', value: {} }, // @ぐらふおぷしょん
  '線グラフ描画': { // @ 線グラフを描画 // @せんぐらふびょうが
    type: 'func',
    josi: [['を', 'で', 'の']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  },
  '棒グラフ描画': { // @ 棒グラフを描画 // @ぼうぐらふびょうが
    type: 'func',
    josi: [['を', 'で', 'の']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  },
  '横棒グラフ描画': { // @ 横棒グラフを描画 // @よこぼうぐらふびょうが
    type: 'func',
    josi: [['を', 'で', 'の']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  },
  '円グラフ描画': { // @ 円グラフを描画 // @えんぐらふびょうが
    type: 'func',
    josi: [['を', 'で', 'の']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  },
  '二次元グラフデータ変形': { // @ 二次元配列をXXグラフ描画の形式に整形する。種類TとDATAを指定。 // @にじげんぐらふでーたへんけい
    type: 'func',
    josi: [['の'], ['を']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  }
}
