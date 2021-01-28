export default {
  // @DOM操作/イベント
  'DOMイベント追加': { // @DOMのEVENTになでしこ関数名funcStrのイベントを追加// @DOMいべんとついか
    type: 'func',
    josi: [['の'], ['に', 'へ'], ['を']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'DOMイベント削除': { // @DOMのEVENTからなでしこ関数名funcStrのイベントを削除// @DOMいべんとさくじょ
    type: 'func',
    josi: [['の'], ['から'], ['を']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'DOMイベント発火時': { // @DOMのEVENTが発火した時にCALLBACKを実行するように設定 // @DOMいべんとはっかしたとき
    type: 'func',
    josi: [['で'], ['の'], ['が']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  '対象イベント': { type: 'const', value: '' }, // @たいしょういべんと
  'DOMイベント処理停止': { // @キーイベントやマウスイベントで、元々ブラウザが行う処理を中止する // @DOMいべんとしょりていし
    type: 'func',
    josi: [['を', 'の']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'クリック時': { // @無名関数FでDOMをクリックした時に実行するイベントを設定 // @くりっくしたとき
    type: 'func',
    josi: [['で'], ['を']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  '読込時': { // @無名関数FでDOMを読み込んだ時に実行するイベントを設定 // @よみこんだとき
    type: 'func',
    josi: [['で'], ['を']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'フォーム送信時': { // @無名関数Fでフォームを送信した時に実行するイベントを設定 // @ふぉーむそうしんしたとき
    type: 'func',
    josi: [['で'], ['を', 'の']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  '押キー': { type: 'const', value: '' }, // @おされたきー
  'キー押時': { // @無名関数FでDOMに対してキーを押した時に実行するイベントを設定。『押されたキー』が設定される。 // @きーおしたとき
    type: 'func',
    josi: [['で'], ['を', 'の']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'キー離時': { // @無名関数FでDOMに対してキーを離した時に実行するイベントを設定。『押されたキー』が設定される。 // @きーはなしたとき
    type: 'func',
    josi: [['で'], ['を', 'の']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'キータイピング時': { // @無名関数FでDOMに対してキーをプレスした時に実行するイベントを設定。『押されたキー』が設定される。 // @きーたいぴんぐしたとき
    type: 'func',
    josi: [['で'], ['を', 'の']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'マウスX': { type: 'const', value: 0 }, // @まうすX
  'マウスY': { type: 'const', value: 0 }, // @まうすY
  'マウス押時': { // @無名関数FでDOMに対してマウスボタンを押した時に実行するイベントを設定。『マウスX』『マウスY』に座標が設定される。『対象』にイベントDOM。『対象イベント』にイベント引数。 // @まうすおしたとき
    type: 'func',
    josi: [['で'], ['を', 'の']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'マウス移動時': { // @無名関数FでDOMに対してマウスカーソルが移動した時に実行するイベントを設定。『マウスX』『マウスY』に座標が設定される。『対象』にイベントDOM。『対象イベント』にイベント引数。 // @まうすいどうしたとき
    type: 'func',
    josi: [['で'], ['を', 'の']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'マウス離時': { // @無名関数FでDOMに対してマウスボタンを離した時に実行するイベントを設定。『マウスX』『マウスY』に座標が設定される。『対象』にイベントDOM。『対象イベント』にイベント引数。 // @まうすはなしたとき
    type: 'func',
    josi: [['で'], ['を', 'の']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'タッチX': { type: 'const', value: 0 }, // @たっちX
  'タッチY': { type: 'const', value: 0 }, // @たっちY
  'タッチ配列': { type: 'const', value: [] }, // @たっちはいれつ
  'タッチイベント計算': { // @タッチイベントで座標計算を行う。『タッチX』『タッチY』『対象』『対象イベント』が設定される。 // @たっちいべんとけいさん
    type: 'func',
    josi: [['の']],
    fn: (...args) => { throw new Error("未実装") }
  },
  'タッチ開始時': { // @無名関数FでDOMに対してタッチを開始した時に実行するイベントを設定。// @たっちかいししたとき
    type: 'func',
    josi: [['で'], ['を', 'の']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'タッチ時': { // @無名関数FでDOMに対してタッチして指を動かした時に実行するイベントを設定。// @たっちしたとき
    type: 'func',
    josi: [['で'], ['を', 'の']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'タッチ終了時': { // @無名関数FでDOMに対してタッチして指を離した時のイベントを設定。// @たっちしゅうりょうしたとき
    type: 'func',
    josi: [['で'], ['を', 'の']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'タッチキャンセル時': { // @無名関数FでDOMに対してタッチイベントをキャンセルした時の動作を設定。// @たっちきゃんせるしたとき
    type: 'func',
    josi: [['で'], ['を', 'の']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  }
}
