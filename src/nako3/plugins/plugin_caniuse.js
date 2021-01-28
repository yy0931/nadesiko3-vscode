const browserslist = require('browserslist')
const caniuseData = require('caniuse-db/data.json')

export default {
  '初期化': {
    type: 'func',
    josi: [],
    fn: function (sys) {
    }
  },
  // @ブラウザサポート
  'ブラウザ名変換表': { type: 'const', value: caniuseData.agents }, // @ぶらうざめいへんかんひょう
  '対応ブラウザ一覧取得': { // @対応しているブラウザの一覧を取得する // @たいおうぶらうざいちらんしゅとく
    type: 'func',
    josi: [],
    fn: function () {
      return browserslist()
    }
  },
}
