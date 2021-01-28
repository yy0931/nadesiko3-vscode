export default {
  // @DOM操作
  'DOCUMENT': { type: 'const', value: '' }, // @DOCUMENT
  'WINDOW': { type: 'const', value: '' }, // @WINDOW
  'NAVIGATOR': { type: 'const', value: '' }, // @NAVIGATOR
  'DOM要素ID取得': { // @DOMの要素をIDを指定して取得 // @DOMようそIDしゅとく
    type: 'func',
    josi: [['の', 'を']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  },
  'DOM要素取得': { // @DOMの要素をクエリqで取得して返す // @DOMようそしゅとく
    type: 'func',
    josi: [['の', 'を']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  },
  'DOM要素全取得': { // @DOMの要素をクエリqで全部取得して返す // @DOMようそぜんしゅとく
    type: 'func',
    josi: [['の', 'を']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  },
  'タグ一覧取得': { // @任意のタグの一覧を取得して返す // @たぐいちらんしゅとく
    type: 'func',
    josi: [['の', 'を']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  },
  'DOMイベント設定': { // @DOMのEVENTになでしこ関数名funcStrのイベントを設定 // @DOMいべんとせってい
    type: 'func',
    josi: [['の'], ['に', 'へ'], ['を']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'DOMテキスト設定': { // @DOMにテキストを設定 // @DOMてきすとせってい
    type: 'func',
    josi: [['に', 'の', 'へ'], ['を']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'DOMテキスト取得': { // @DOMのテキストを取得 // @DOMてきすとしゅとく
    type: 'func',
    josi: [['の', 'から']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  },
  'DOM_HTML設定': { // @DOMにHTML文字列を設定 // @DOM_HTMLせってい
    type: 'func',
    josi: [['に', 'の', 'へ'], ['を']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'DOM_HTML取得': { // @DOMのHTML文字列を取得 // @DOM_HTMLしゅとく
    type: 'func',
    josi: [['の', 'から']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  },
  'テキスト設定': { // @DOMのテキストにVを設定 // @てきすとせってい
    type: 'func',
    josi: [['に', 'の', 'へ'], ['を']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  },
  'テキスト取得': { // @DOMのテキストを取得 // @てきすとしゅとく
    type: 'func',
    josi: [['の', 'から']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  },
  'HTML設定': { // @DOMのHTMLにVを設定 // @HTMLせってい
    type: 'func',
    josi: [['に', 'の', 'へ'], ['を']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  },
  'HTML取得': { // @DOMのテキストを取得 // @HTMLしゅとく
    type: 'func',
    josi: [['の', 'から']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  },
  'DOM属性設定': { // @DOMの属性Sに値Vを設定 // @DOMぞくせいせってい
    type: 'func',
    josi: [['の'], ['に', 'へ'], ['を']],
    uses: ['DOM和スタイル'],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'DOM属性取得': { // @DOMの属性Sを取得 // @DOMぞくせいしゅとく
    type: 'func',
    josi: [['の', 'から'], ['を']],
    uses: ['DOM和スタイル'],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  },
  'DOM和スタイル': { // const // @DOMわすたいる
    type: 'const',
    value: {
      '幅': 'width',
      '高さ': 'height',
      '高': 'height',
      '背景色': 'background-color',
      '色': 'color',
      'マージン': 'margin',
      '余白': 'padding',
      '文字サイズ': 'font-size',
      '行揃え': 'text-align',
      '左': 'left',
      '右': 'right',
      '中央': 'center',
      'ボーダー': 'border',
      'ボックス表示': 'display',
      'なし': 'none',
      'ブロック': 'block',
      '表示位置': 'float',
      '重なり': 'z-index'
    }
  },
  'DOMスタイル設定': { // @DOMのスタイルAに値Bを設定 // @DOMすたいるせってい
    type: 'func',
    josi: [['の'], ['に', 'へ'], ['を']],
    uses: ['DOM和スタイル'],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'DOMスタイル一括設定': { // @DOMに(オブジェクト型で)スタイル情報を一括設定 // @DOMすたいるいっかつせってい
    type: 'func',
    josi: [['に', 'へ'], ['を']],
    uses: ['DOM和スタイル'],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'DOMスタイル取得': { // @DOMのSTYLEの値を取得 // @DOMすたいるしゅとく
    type: 'func',
    josi: [['の'], ['を']],
    uses: ['DOM和スタイル'],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  },
  'DOMスタイル一括取得': { // @DOMのSTYLE(配列で複数指定)の値を取得 // @DOMすたいるいっかつしゅとく
    type: 'func',
    josi: [['の'], ['を']],
    uses: ['DOM和スタイル'],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  },
  'DOM要素作成': { // @DOMにTAGの新規要素を作成 // @DOMようそさくせい
    type: 'func',
    josi: [['の', 'を']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  },
  'DOM子要素追加': { // @DOMの要素PAの子へ要素ELを追加してPAを返す // @DOMこようそついか
    type: 'func',
    josi: [['に', 'へ'], ['を']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  },
  'DOM子要素削除': { // @DOMの要素PAの子から要素ELを削除してPAを返す // @DOMこようそさくじょ
    type: 'func',
    josi: [['から'], ['を']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  }
}
