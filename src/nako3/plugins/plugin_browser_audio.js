export default {
  // @オーディオ
  'オーディオ開': { // @オーディオファイルのURLを指定して、オーディオを読み込み、Audioオブジェクトを返す // @おーでぃおひらく
    type: 'func',
    josi: [['を', 'の']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: false
  },
  'オーディオ再生位置': { type: 'const', value: 0 }, // @おーでぃおさいせいいち
  'オーディオ再生': { // @AudioオブジェクトOBJを指定してオーディをを再生 // @おーでぃおさいせい
    type: 'func',
    josi: [['を']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'オーディオ停止': { // @AudioオブジェクトOBJを指定してオーディを停止 // @おーでぃおていし
    type: 'func',
    josi: [['を']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'オーディオ一時停止': { // @AudioオブジェクトOBJを指定してオーディを一時停止 // @おーでぃおていし
    type: 'func',
    josi: [['を']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  }
}
