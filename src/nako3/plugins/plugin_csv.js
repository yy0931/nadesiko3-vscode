const csv = require('csv-lite-js')

export default {
  '初期化': {
    type: 'func',
    josi: [],
    fn: function (sys) {
    }
  },
  // @CSV操作
  'CSV取得': { // @CSV形式のデータstrを強制的に二次元配列に変換して返す // @CSVしゅとく
    type: 'func',
    josi: [['を', 'の', 'で']],
    fn: function (str) {
      csv.options.delimiter = ','
      return csv.parse(str)
    }
  },
  'TSV取得': { // @TSV形式のデータstrを強制的に二次元配列に変換して返す // @TSVしゅとく
    type: 'func',
    josi: [['を', 'の', 'で']],
    fn: function (str) {
      csv.options.delimiter = "\t"
      return csv.parse(str)
    }
  },
  '表CSV変換': { // @二次元配列AをCSV形式に変換して返す // @ひょうCSVへんかん
    type: 'func',
    josi: [['を']],
    fn: function (a) {
      csv.options.delimiter = ','
      return csv.stringify(a)
    }
  },
  '表TSV変換': { // @二次元配列AをTSV形式に変換して返す // @ひょうTSVへんかん
    type: 'func',
    josi: [['を']],
    fn: function (a) {
      csv.options.delimiter = '\t'
      return csv.stringify(a)
    }
  }
}
