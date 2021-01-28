/**
 * file: plugin_express.js
 * Webサーバのためのプラグイン (expressをラップしたもの)
 */

export default {
  '初期化': {
    type: 'func',
    josi: [],
    fn: (...args) => { }
  },
  // @Webサーバ(Express)
  'GETデータ': { type: 'const', value: '' }, // @WEBサーバクエリ
  'POSTデータ': { type: 'const', value: '' }, // @WEBサーバクエリ
  'WEBサーバ名前設定': { // @Webサーバの名前を変更する // @WEBさーばなまえへんこう
    type: 'func',
    josi: [['に', 'へ']],
    fn: (...args) => { },
    return_none: true
  },
  'WEBサーバ起動': { // @ポートPORTNOでWebサーバを起動して成功したら『WEBサーバ起動成功した時』を実行する // @WEBさーばきどう
    type: 'func',
    josi: [['の', 'で']],
    fn: (...args) => { }
  },
  'WEBサーバ起動時': { // @ポートPORTNOでWebサーバを起動して成功したらCALLBACKを実行する // @WEBさーばきどうしたとき
    type: 'func',
    josi: [['を'], ['の', 'で']],
    fn: (...args) => { }
  },
  'WEBサーバ起動成功時': { // @WEBサーバ起動が成功した時にcallbackを実行 // @WEBさーばきどうせいこうしたとき
    type: 'func',
    josi: [['を']],
    fn: (...args) => { },
    return_none: true
  },
  'WEBサーバ起動失敗時': { // @WEBサーバ起動が失敗した時にcallbackを実行 // @WEBさーばきどうしっぱいしたとき
    type: 'func',
    josi: [['を']],
    fn: (...args) => { },
    return_none: true
  },
  'WEBサーバ静的パス指定': { // @サーバのHTMLや画像などを配置する静的パスを指定する // @WEBさーばせいてきぱすしてい
    type: 'func',
    josi: [['を'], ['に', 'へ']],
    fn: (...args) => { },
    return_none: true
  },
  'WEBサーバGET時': { // @URIにGETメソッドがあった時の処理を指定 // @WEBさーばGETしたとき
    type: 'func',
    josi: [['を'], ['に', 'へ']],
    fn: (...args) => { },
    return_none: true
  },
  'WEBサーバPOST時': { // @URIにPOSTメソッドがあった時の処理を指定 // @WEBさーばPOSTしたとき
    type: 'func',
    josi: [['を'], ['に', 'へ']],
    fn: (...args) => { },
    return_none: true
  },
  'WEBサーバPUT時': { // @URIにPOSTメソッドがあった時の処理を指定 // @WEBさーばPUTしたとき
    type: 'func',
    josi: [['を'], ['に', 'へ']],
    fn: (...args) => { },
    return_none: true
  },
  'WEBサーバDELETE時': { // @URIにPOSTメソッドがあった時の処理を指定 // @WEBさーばDELETEしたとき
    type: 'func',
    josi: [['を'], ['に', 'へ']],
    fn: (...args) => { },
    return_none: true
  },
  'WEBサーバヘッダ出力': { // @クライアントにヘッダOBJを出力 // @WEBさーばへっだしゅつりょく
    type: 'func',
    josi: [['を', 'の']],
    fn: (...args) => { },
    return_none: true
  },
  'WEBサーバステータス出力': { // @クライアントにステータスNOを出力 // @WEBさーばすてーたすしゅつりょく
    type: 'func',
    josi: [['を', 'の']],
    fn: (...args) => { },
    return_none: true
  },
  'WEBサーバ出力': { // @クライアントにSを出力 // @WEBさーばしゅつりょく
    type: 'func',
    josi: [['を', 'と']],
    fn: (...args) => { },
    return_none: true
  },
  'WEBサーバリダイレクト': { // @URLにリダイレクトする // @WEBさーばりだいれくと
    type: 'func',
    josi: [['へ', 'に']],
    fn: (...args) => { },
    return_none: true
  }
}
