export default {
  '初期化': {
    type: 'func',
    josi: [],
    fn: (...args) => { }
  },

  '対象イベント': { type: 'const', value: '' }, // @たいしょういべんと
  '受信データ': { type: 'const', value: '' }, // @たいしょういべんと
  'SELF': { type: 'const', value: '' }, // @SELF
  '依頼主': { type: 'const', value: '' }, // @SELF

  'NAKOワーカーデータ受信時': { // @無名関数Fでなでしこv3エンジンに対してワーカーメッセージによりデータを受信した時に実行するイベントを設定。『受信データ』に受信したデータM。『対象イベント』にイベント引数。 // @NAKOわーかーでーたじゅしんしたとき
    type: 'func',
    josi: [['で']],
    fn: (...args) => { },
    return_none: true
  },
  'ワーカーメッセージ受信時': { // @無名関数Fでselfに対してメッセージを受信した時に実行するイベントを設定。『受信データ』に受信したデータ。『対象イベント』にイベント引数。 // @わーかーめっせーじじゅしんしたとき
    type: 'func',
    josi: [['で']],
    fn: (...args) => { },
    return_none: true
  },
  'NAKOワーカーデータ送信': { // @起動もとに固有の形式でデータを送信する。 // @NAKOわーかーでーたへんしん
    type: 'func',
    josi: [['を']],
    fn: (...args) => { },
    return_none: true
  },
  'ワーカーメッセージ送信': { // @起動もとにメッセージを送信する。 // @わーかーめっせーじへんしん
    type: 'func',
    josi: [['を']],
    fn: (...args) => { },
    return_none: true
  },
  '表示': { // @メインスレッドに固有の形式で表示データを送信する。 // @ひょうじ
    type: 'func',
    josi: [['を']],
    fn: (...args) => { },
    return_none: true
  },
  '終了': { // @ワーカーを終了する。 // @しゅうりょう
    type: 'func',
    josi: [],
    fn: (...args) => { },
    return_none: true
  }
}
