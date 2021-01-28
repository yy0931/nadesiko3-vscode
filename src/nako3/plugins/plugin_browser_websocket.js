export default {
  // @WebSocket
  'WS接続完了時': { // @WebSocketでサーバに接続完了した時に実行されるイベントを指定 // @WSせつぞくかんりょうしたとき
    type: 'func',
    josi: [['を']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'WS受信時': { // @WebSocketでサーバからメッセージを受信した時に実行されるイベントを指定 // @WSじゅしんしたとき
    type: 'func',
    josi: [['を']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'WSエラー発生時': { // @WebSocketでエラーが発生した時に実行されるイベントを指定 // @WSえらーはっせいじ
    type: 'func',
    josi: [['を']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'WS接続': { // @WebSocketサーバsに接続する // @WSせつぞく
    type: 'func',
    josi: [['に', 'へ', 'の']],
    fn: (...args) => { throw new Error("未実装") }
  },
  'WS送信': { // @アクティブなWebSocketへsを送信する // @WSそうしん
    type: 'func',
    josi: [['を', 'と']],
    fn: (...args) => { throw new Error("未実装") }
  },
  'WS切断': { // @アクティブなWebSocketを閉じる // @WSせつだん
    type: 'func',
    josi: [],
    fn: (...args) => { throw new Error("未実装") }
  }
}
