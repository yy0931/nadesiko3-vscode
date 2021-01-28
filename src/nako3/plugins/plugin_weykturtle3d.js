/**
 * PluginWeykTurtle3D
 */

export default {
  '初期化': {
    type: 'func',
    josi: [],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") }
  },
  // @3Dタートルグラフィックス/カメ操作
  'T3Dカメ作成': { // @タートルグラフィックスを開始してカメのIDを返す // @T3Dかめさくせい
    type: 'func',
    josi: [],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: false
  },
  'T3Dカメ操作対象設定': { // @IDを指定して操作対象となるカメを変更する // @T3Dかめそうさたいしょうせってい
    type: 'func',
    josi: [['に', 'へ', 'の']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'T3Dカメ描画先': { type: 'var', value: 'turtle3d_div' }, // @T3Dかめびょうがさき
  'T3DカメモデルURL': { type: 'var', value: '' }, // @T3DかめもでるURL
  'T3Dカメモデル変更': { // @カメのモデルをURLに変更する // @T3Dかめもでるへんこう
    type: 'func',
    josi: [['に', 'へ']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'T3Dカメ速度': { type: 'const', value: 100 }, // @T3Dかめそくど
  'T3Dカメ速度設定': { // @カメの動作速度vに設定(大きいほど遅い) // @T3Dかめそくどせってい
    type: 'func',
    josi: [['に', 'へ']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'T3Dカメ移動': { // @カメの位置を[x,y,z]へ移動する // @T3Dかめいどう
    type: 'func',
    josi: [['に', 'へ']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'T3Dカメ原点設定': { // @カメの原点を現在の位置・向きに設定する // @T3Dかめげんてんせってい
    type: 'func',
    josi: [],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'T3Dカメ原点移動': { // @カメを原点の位置・向きに移動する(描画はしない) // @T3Dかめげんてんいどう
    type: 'func',
    josi: [],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'T3Dカメ起点移動': { // @カメの描画起点位置を[x,y,z]へ移動する // @T3Dかめきてんいどう
    type: 'func',
    josi: [['に', 'へ']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'T3Dカメ進': { // @カメの位置をVだけ進める // @T3Dかめすすむ
    type: 'func',
    josi: [['だけ']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'T3Dカメ戻': { // @カメの位置をVだけ戻す // @T3Dかめもどる
    type: 'func',
    josi: [['だけ']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'T3Dカメ上平行移動': { // @カメの位置を上にVだけ進める // @T3Dかめうえへいこういどう
    type: 'func',
    josi: [['だけ']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'T3Dカメ下平行移動': { // @カメの位置を下にVだけ進める // @T3Dかめしたへいこういどう
    type: 'func',
    josi: [['だけ']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'T3Dカメ左平行移動': { // @カメの位置を左にVだけ進める // @T3Dかめひだりへいこういどう
    type: 'func',
    josi: [['だけ']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'T3Dカメ右平行移動': { // @カメの位置を右にVだけ進める // @T3Dかめみぎへいこういどう
    type: 'func',
    josi: [['だけ']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'T3Dカメ動': { // @カメの位置をDIRにVだけ進める // @T3Dかめうごく
    type: 'func',
    josi: [['へ', 'に'], ['だけ']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'T3Dカメ角度設定': { // @カメの向きをオイラー(XYZ)にて設定する // @T3Dかめかくどせってい
    type: 'func',
    josi: [['に', 'へ', 'の']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'T3Dカメ右回転': { // @カメの向きをDEGだけ右に向ける // @T3Dかめみぎかいてん
    type: 'func',
    josi: [['だけ']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'T3Dカメ左回転': { // @カメの向きをDEGだけ左に向ける // @T3Dかめひだりかいてん
    type: 'func',
    josi: [['だけ']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'T3Dカメ上回転': { // @カメの向きをDEGだけ上に向ける // @T3Dかめうえかいてん
    type: 'func',
    josi: [['だけ']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'T3Dカメ下回転': { // @カメの向きをDEGだけ下に向ける // @T3Dかめしたかいてん
    type: 'func',
    josi: [['だけ']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'T3Dカメ回転': { // @カメの向きをDEGだけDIRに向ける // @T3Dかめかいてん
    type: 'func',
    josi: [['へ', 'に'], ['だけ']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'T3Dカメ右ロール': { // @カメをDEGだけ右に傾ける // @T3Dかめみぎろーる
    type: 'func',
    josi: [['だけ']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'T3Dカメ左ロール': { // @カメのDEGだけ左に傾ける // @T3Dかめひだりろーる
    type: 'func',
    josi: [['だけ']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'T3Dカメ傾': { // @カメをDEGだけDIRに傾ける // @T3Dかめかたむける
    type: 'func',
    josi: [['に', 'へ'], ['だけ']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'T3Dカメペン色設定': { // @カメのペン描画色をCに設定する // @T3Dかめぺんいろせってい
    type: 'func',
    josi: [['に', 'へ']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'T3Dカメペンサイズ設定': { // @カメペンのサイズをWに設定する // @T3Dかめぺんさいずせってい
    type: 'func',
    josi: [['に', 'へ']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'T3Dカメペン設定': { // @カメペンを使うかどうかをV(オン/オフ)に設定する // @T3Dかめぺんせってい
    type: 'func',
    josi: [['に', 'へ']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'T3Dカメ全消去': { // @表示しているカメと描画内容を全部消去する // @T3Dかめぜんしょうきょ
    type: 'func',
    josi: [],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'T3Dカメ非表示': { // @カメのモデルを非表示にする。描画に影響しない。 // @T3Dかめひひょうじ
    type: 'func',
    josi: [],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'T3Dカメ表示': { // @非表示にしたカメのモデルを表示する。 // @T3Dかめひょうじ
    type: 'func',
    josi: [],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'T3D視点カメ設定': { // @指定したカメを視点として使用する // @T3Dしてんかめせってい
    type: 'func',
    josi: [['に', 'へ']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  // @3Dタートルグラフィックス/基本機能
  'T3D描画': { // @現在の状態を描画する // @T3Dびょうが
    type: 'func',
    josi: [],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'T3D背景色設定': { // @canvasをクリアする際の背景色を設定する // @T3Dはいけいしょくせってい
    type: 'func',
    josi: [['に', 'へ']],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'T3DJSON取得': { // @描画した線のJSON形式で取得する // @T3DJSONしゅとく
    type: 'func',
    josi: [],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: false
  },
  // @3Dタートルグラフィックス/ヘルパ機能
  'T3Dカメラヘルパ表示': { // @カメラヘルパーを表示する // @T3Dかめらへるぱひょうじ
    type: 'func',
    josi: [],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'T3Dカメラヘルパ非表示': { // @カメラヘルパーを非表示にする // @T3Dかめらへるぱひひょうじ
    type: 'func',
    josi: [],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'T3D軸線ヘルパ表示': { // @座標軸ヘルパーを表示する // @T3Dじくせんへるぱひょうじ
    type: 'func',
    josi: [],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  },
  'T3D軸線ヘルパ非表示': { // @座標軸ヘルパーを非表示にする // @T3Dじくせんへるぱひひょうじ
    type: 'func',
    josi: [],
    fn: (...args) => { throw new Error("Webブラウザ用の関数は呼び出せません。") },
    return_none: true
  }
}
