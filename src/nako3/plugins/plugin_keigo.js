// 敬語を使いたい人のためのプラグイン (お遊び機能)

export default {
  '初期化': {
    type: 'func',
    josi: [],
    fn: (...args) => { }
  },
  // @丁寧語
  'お世話': { type: 'const', value: 1 }, // @おせわ
  'な': { // @Aになる // @なる
    type: 'func',
    josi: [['に', 'へ']],
    fn: (...args) => { }
  },
  'おります': { // @ソースコードを読む人を気持ちよくする // @おります
    type: 'func',
    josi: [],
    fn: (...args) => { },
    return_none: true
  },
  'どうぞ': { // @ソースコードを読む人を気持ちよくする // @どうぞ
    type: 'func',
    josi: [],
    fn: (...args) => { },
    return_none: true
  },
  'よろしくお願': { // @ソースコードを読む人を気持ちよくする // @よろしくおねがいします
    type: 'func',
    josi: [],
    fn: (...args) => { },
    return_none: true
  }

}
