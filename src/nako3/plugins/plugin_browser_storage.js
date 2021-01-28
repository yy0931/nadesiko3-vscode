export default {
  // @ローカルストレージ
  '保存': { // @ブラウザのlocalStorageのキーKに文字列Vを保存 // @ほぞん
    type: 'func',
    josi: [['を'], ['に', 'へ']],
    fn: (...args) => { },
    return_none: true
  },
  '開': { // @ブラウザのlocalStorageからVを読む // @ひらく
    type: 'func',
    josi: [['を', 'から', 'の']],
    fn: (...args) => { },
    return_none: false
  },
  '存在': { // @ブラウザのlocalStorageにKEYが存在しているか調べる // @そんざい
    type: 'func',
    josi: [['が']],
    fn: (...args) => { },
    return_none: false
  },
  'ローカルストレージ保存': { // @ブラウザのlocalStorageのKにVを保存 // @ろーかるすとれーじほぞん
    type: 'func',
    josi: [['に', 'へ'], ['を']],
    fn: (...args) => { },
    return_none: true
  },
  'ローカルストレージ読': { // @ブラウザのlocalStorageからVを読む // @ろーかるすとれーじよむ
    type: 'func',
    josi: [['を', 'から', 'の']],
    fn: (...args) => { },
    return_none: false
  },
  'ローカルストレージキー列挙': { // @ブラウザのlocalStorageのキー一覧を返す // @ろーかるすとれーじきーれっきょ
    type: 'func',
    josi: [[]],
    fn: (...args) => { },
    return_none: false
  },
  'ローカルストレージキー削除': { // @ブラウザのlocalStorageのkeyを削除 // @ろーかるすとれーじきーさくじょ
    type: 'func',
    josi: [['を', 'の']],
    fn: (...args) => { },
    return_none: true
  },
  'ローカルストレージ全削除': { // @ブラウザのlocalStorageのデータを全部削除する // @ろーかるすとれーじぜんさくじょ
    type: 'func',
    josi: [],
    fn: (...args) => { },
    return_none: true
  }
}
