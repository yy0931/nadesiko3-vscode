export default {
  // @AJAXとHTTP
  'AJAX送信時': { // @非同期通信(Ajax)でURLにデータを送信し、成功するとcallbackが実行される。その際『対象』にデータが代入される。 // @AJAXそうしんしたとき
    type: 'func',
    josi: [['の'], ['まで', 'へ', 'に']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'GET送信時': { // @非同期通信(Ajax)でURLにデータを送信し、成功するとcallbackが実行される。その際『対象』にデータが代入される。 // @GETそうしんしたとき
    type: 'func',
    josi: [['の'], ['まで', 'へ', 'に']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'POSTデータ生成': { // @連想配列をkey=value&key=value...の形式に変換する // @POSTでーたせいせい
    type: 'func',
    josi: [['の', 'を']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  },
  'POST送信時': { // @AjaxでURLにPARAMSをPOST送信し『対象』にデータを設定 // @POSTそうしんしたとき
    type: 'func',
    josi: [['の'], ['まで', 'へ', 'に'], ['を']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  },
  'POSTフォーム送信時': { // @AjaxでURLにPARAMSをフォームとしてPOST送信し『対象』にデータを設定 // @POSTふぉーむそうしんしたとき
    type: 'func',
    josi: [['の'], ['まで', 'へ', 'に'], ['を']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  },
  'AJAX失敗時': { // @Ajax命令でエラーが起きたとき // @AJAXえらーしっぱいしたとき
    type: 'func',
    josi: [['の']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  },
  'AJAXオプション': { type: 'const', value: '' }, // @AJAXおぷしょん
  'AJAXオプション設定': { // @Ajax命令でオプションを設定 // @AJAXおぷしょんせってい
    type: 'func',
    josi: [['に', 'へ', 'と']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'AJAX送信': { // @逐次実行構文にて、非同期通信(Ajax)でURLにデータを送信する。成功すると『対象』にデータが代入される。失敗すると『AJAX失敗時』を実行。 // @AJAXそうしんした
    type: 'func',
    josi: [['まで', 'へ', 'に']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'HTTP取得': { // @逐次実行構文にて、非同期通信(Ajax)でURLにデータを送信する。成功すると『対象』にデータが代入される。失敗すると『AJAX失敗時』を実行。 // @HTTPしゅとく
    type: 'func',
    josi: [['の', 'から', 'を']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'POST送信': { // @逐次実行構文にて、AjaxでURLにPARAMSをPOST送信し『対象』にデータを設定。失敗すると『AJAX失敗時』を実行。 // @POSTそうしん
    type: 'func',
    josi: [['まで', 'へ', 'に'], ['を']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  },
  'POSTフォーム送信': { // @逐次実行構文にて、AjaxでURLにPARAMSをフォームとしてPOST送信し『対象』にデータを設定。失敗すると『AJAX失敗時』を実行。 // @POSTふぉーむそうしん
    type: 'func',
    josi: [['まで', 'へ', 'に'], ['を']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  }
}
