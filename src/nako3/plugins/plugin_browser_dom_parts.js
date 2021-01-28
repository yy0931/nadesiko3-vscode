export default {
  // @DOM部品操作
  'DOM親要素': { type: 'const', value: '' }, // @DOMおやようそ
  'DOM生成個数': { type: 'const', value: 0 }, // @DOMせいせいこすう
  'DOM親要素設定': { // @「ボタン作成」「エディタ作成」などのDOM要素を追加する対象を指定(デフォルトはdocument)して親要素のDOMオブジェクトを返す // @DOMおやようそせってい
    type: 'func',
    josi: [['に', 'へ']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  },
  'ボタン作成': { // @ラベルlabelを持つbutton要素を追加しDOMオブジェクトを返す // @ぼたんさくせい
    type: 'func',
    josi: [['の']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  },
  'エディタ作成': { // @textの値を持つテキストボックス(input[type='text'])の要素を追加しDOMオブジェクトを返す // @えでぃたさくせい
    type: 'func',
    josi: [['の']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  },
  'テキストエリア作成': { // @textの値を持つtextarea要素を追加しDOMオブジェクトを返す // @てきすとえりあさくせい
    type: 'func',
    josi: [['の']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  },
  'ラベル作成': { // @textの値を持つラベル(span要素)を追加しDOMオブジェクトを返す // @らべるさくせい
    type: 'func',
    josi: [['の']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  },
  '改行作成': { // @改行(br要素)を追加しDOMオブジェクトを返す // @かいぎょうさくせい
    type: 'func',
    josi: [],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  },
  'チェックボックス作成': { // @textのラベルを持つチェックボックス(input[type='checkbox'])要素を追加しDOMオブジェクトを返す // @ちぇっくぼっくすさくせい
    type: 'func',
    josi: [['の']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  },
  'セレクトボックス作成': { // @配列optionsの選択肢を持つselect要素を追加しDOMオブジェクトを返す // @せれくとぼっくすさくせい
    type: 'func',
    josi: [['の']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  }
}
