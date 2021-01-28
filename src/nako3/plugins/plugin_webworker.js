export default {
  '初期化': {
    type: 'func',
    josi: [],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  },
  // @イベント用定数
  '対象イベント': { type: 'const', value: '' }, // @たいしょういべんと
  '受信データ': { type: 'const', value: '' }, // @たいしょういべんと

  'ワーカーURL': { type: 'const', value: '' }, // @わーかーURL
  'ワーカーURL設定': { // @なでしこv3のファイルのあるURLを設定 // @わーかーURLせってい
    type: 'func',
    josi: [['に', 'へ', 'と']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },

  'ワーカー起動': { // @指定したURLでWebWorkerを起動する。ワーカオブジェクトを返す。 // @わーかーきどう
    type: 'func',
    josi: [['で', 'を', 'の']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: false
  },
  'ワーカーJS起動': { // @指定したJavascriptのソースでWebWorkerを起動する。ワーカオブジェクトを返す。 // @わーかーJSきどう
    type: 'func',
    josi: [['で', 'を', 'の']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: false
  },
  'NAKOワーカー起動': { // @指定したなでしこ３のWebWorkerを起動する。ワーカオブジェクトを返す。 // @NAKOわーかーきどう
    type: 'func',
    josi: [['で']],
    isVariableJosi: true,
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: false
  },
  'NAKOワーカーハンドラ設定': { // @ワーカーにNAKOワーカーのための設定を行う。 // @NAKOわーかーはんどらせってい
    type: 'func',
    josi: [['に', 'へ', 'の']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'NAKOワーカーデータ受信時': { // @無名関数Fでなでしこv3エンジンに対してワーカーメッセージによりデータを受信した時に実行するイベントを設定。『受信データ』に受信したデータ。『対象イベント』にイベント引数。 // @NAKOわーかーでーたじゅしんしたとき
    type: 'func',
    josi: [['で'], ['から']],
    isVariableJosi: true,
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'NAKOワーカー表示時': { // @無名関数Fでなでしこv3エンジンに対してワーカーメッセージにより表示データを受信した時に実行するイベントを設定。『受信データ』に表示しようとしたデータ。『対象イベント』にイベント引数。 // @NAKOわーかーひょうじしたとき
    type: 'func',
    josi: [['で'], ['から']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'ワーカーメッセージ受信時': { // @無名関数Fでworkに対してメッセージを受信した時に実行するイベントを設定。『受信データ』に受信したデータ。『対象イベント』にイベント引数。 // @わーかーめっせーじじゅしんしたとき
    type: 'func',
    josi: [['で'], ['から']],
    isVariableJosi: true,
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'NAKOワーカープログラム起動': { // @WORKERに固有の形式でプログラムの転送と実行行う。 // @NAKOわーかーぷろぐらむきどう
    type: 'func',
    josi: [['に', 'で'], ['を']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'NAKOワーカーリセット': { // @WORKERに固有の形式でプログラムの転送と実行行う。 // @わーかーりせっと
    type: 'func',
    josi: [['を']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'ワーカー終了': { // @WORKERを終了する。 // @わーかーしゅうりょう
    type: 'func',
    josi: [['を']],
    isVariableJosi: true,
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'NAKOワーカー終了': { // @WORKERを終了する。 // @NAKOわーかーしゅうりょう
    type: 'func',
    josi: [['を']],
    isVariableJosi: true,
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'NAKOワーカーデータ送信': { // @WORKERに固有の形式でデータを送信する。 // @NAKOわーかーでーたそうしん
    type: 'func',
    josi: [['を'], ['に', 'へ']],
    isVariableJosi: true,
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'ワーカーメッセージ送信': { // @WORKERにメッセージを送信する。 // @わーかーめっせーじそうしん
    type: 'func',
    josi: [['を'], ['に', 'へ']],
    isVariableJosi: true,
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'NAKOワーカー転送': { // @WORKERにユーザー定義関数またはユーザ定義のグローバル変数を転送する。 // @NAKOわーかーてんそう
    type: 'func',
    josi: [['を'], ['に', 'へ']],
    isVariableJosi: true,
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  }
}
