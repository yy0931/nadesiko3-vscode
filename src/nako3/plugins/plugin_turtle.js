/**
 * Turtle Graphics for Web browser (nadesiko3)
 * plugin_turtle.js
 */

export default {
  '初期化': {
    type: 'func',
    josi: [],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  },

  // @タートルグラフィックス/カメ操作
  'カメ作成': { // @タートルグラフィックスを開始してカメのIDを返す // @かめさくせい
    type: 'func',
    josi: [],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  },
  'ゾウ作成': { // @ゾウの画像でタートルグラフィックスを開始してIDを返す // @ぞうさくせい
    type: 'func',
    josi: [],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  },
  'パンダ作成': { // @パンダの画像でタートルグラフィックスを開始してIDを返す // @ぱんださくせい
    type: 'func',
    josi: [],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  },
  'カメ操作対象設定': { // @IDを指定して操作対象となるカメを変更する // @かめそうさたいしょうせってい
    type: 'func',
    josi: [['に', 'へ', 'の']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'カメ描画先': { type: 'var', value: 'turtle_cv' }, // @かめびょうがさき
  'カメ画像URL': { type: 'var', value: null }, // @かめがぞうURL
  'カメ画像変更': { // @カメの画像をURLに変更する // @かめがぞうへんこう
    type: 'func',
    josi: [['に', 'へ']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'カメ速度': { type: 'const', value: 100 }, // @かめそくど
  'カメ速度設定': { // @カメの動作速度vに設定(大きいほど遅い) // @かめそくどせってい
    type: 'func',
    josi: [['に', 'へ']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  },
  'カメ移動': { // @カメの位置を[x,y]へ移動する // @かめいどう
    type: 'func',
    josi: [['に', 'へ']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'カメ起点移動': { // @カメの描画起点位置を[x,y]へ移動する // @かめきてんいどう
    type: 'func',
    josi: [['に', 'へ']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'カメ進': { // @カメの位置をVだけ進める // @かめすすむ
    type: 'func',
    josi: [['だけ']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'カメ戻': { // @カメの位置をVだけ戻す // @かめもどる
    type: 'func',
    josi: [['だけ']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'カメ角度設定': { // @カメの向きをDEGに設定する // @かめかくどせってい
    type: 'func',
    josi: [['に', 'へ', 'の']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'カメ右回転': { // @カメの向きをDEGだけ右に向ける // @かめみぎかいてん
    type: 'func',
    josi: [['だけ']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'カメ左回転': { // @カメの向きをDEGだけ左に向ける // @かめひだりかいてん
    type: 'func',
    josi: [['だけ']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'カメペン色設定': { // @カメのペン描画色をCに設定する // @かめぺんいろせってい
    type: 'func',
    josi: [['に', 'へ']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'カメペンサイズ設定': { // @カメペンのサイズをWに設定する // @かめぺんさいずせってい
    type: 'func',
    josi: [['に', 'へ']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  },
  'カメペン設定': { // @カメペンを使うかどうかをV(オン/オフ)に設定する // @かめぺんせってい
    type: 'func',
    josi: [['に', 'へ']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  },
  'カメパス開始': { // @カメで明示的にパスの描画を開始する // @かめぱすかいし
    type: 'func',
    josi: [],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  },
  'カメパス閉': { // @カメでパスを明示的に閉じる(省略可能) // @かめぱすとじる
    type: 'func',
    josi: [],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  },
  'カメパス線引': { // @カメでパスを閉じて、カメペン色設定で指定した色で枠線を引く // @かめぱすせんひく
    type: 'func',
    josi: [],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  },
  'カメパス塗': { // @カメでパスを閉じて、カメ塗り色設定で指定した色で塗りつぶす // @かめぱすぬる
    type: 'func',
    josi: [],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  },
  'カメ文字描画': { // @カメの位置に文字Sを描画 // @かめもじびょうが
    type: 'func',
    josi: [['を', 'と', 'の']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  },
  'カメ文字設定': { // @カメ文字描画で描画するテキストサイズやフォント(48px serif)などを設定 // @かめもじせってい
    type: 'func',
    josi: [['に', 'へ', 'で']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  },
  'カメ塗色設定': { // @カメパスの塗り色をCに設定する // @かめぬりいろせってい
    type: 'func',
    josi: [['に', 'へ']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'カメ全消去': { // @表示しているカメと描画内容を全部消去する // @かめぜんしょうきょ
    type: 'func',
    josi: [],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'カメコマンド実行': { // @カメにコマンドSを実行する。コマンドは改行か「;」で区切る。コマンドと引数は「=」で区切り引数はかカンマで区切る // @かめこまんどじっこう
    type: 'func',
    josi: [['の', 'を']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'カメ非表示': { // @カメの画像を非表示にする。描画に影響しない。 // @かめひひょうじ
    type: 'func',
    josi: [],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'カメ表示': { // @非表示にしたカメを表示する。 // @かめひょうじ
    type: 'func',
    josi: [],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'カメクリック時': { // @ 操作対象のカメをクリックした時のイベントを設定する // @かめくりっくしたとき
    type: 'func',
    josi: [['を']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  }
}
