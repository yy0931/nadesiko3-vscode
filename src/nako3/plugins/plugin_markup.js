/**
 * file: plugin_markup.js
 * マークアップ言語関連のプラグイン
 */

import marked from "marked"
import html from "html"

export default {
  // @マークアップ
  'マークダウンHTML変換': { // @マークダウン形式で記述された文字列SをHTML形式に変換する // @まーくだうんHTMLへんかん
    type: 'func',
    josi: [['を']],
    fn: function (s) {
      const html = marked(s)
      return html
    }
  },
  'HTML整形': { // @HTML形式で記述された文字列Sを整形する // @HTMLせいけい
    type: 'func',
    josi: [['を']],
    fn: function (s) {
      return html.prettyPrint(s, { indent_size: 2 })
    }
  }
}
