export default {
  '初期化': {
    type: 'func',
    josi: [],
    fn: (...args) => { throw new Error("未実装") }
  },
  // @CSV操作
  'CSV取得': { // @CSV形式のデータstrを強制的に二次元配列に変換して返す // @CSVしゅとく
    type: 'func',
    josi: [['を', 'の', 'で']],
    fn: (...args) => { throw new Error("未実装") }
  },
  'TSV取得': { // @TSV形式のデータstrを強制的に二次元配列に変換して返す // @TSVしゅとく
    type: 'func',
    josi: [['を', 'の', 'で']],
    fn: (...args) => { throw new Error("未実装") }
  },
  '表CSV変換': { // @二次元配列AをCSV形式に変換して返す // @ひょうCSVへんかん
    type: 'func',
    josi: [['を']],
    fn: (...args) => { throw new Error("未実装") }
  },
  '表TSV変換': { // @二次元配列AをTSV形式に変換して返す // @ひょうTSVへんかん
    type: 'func',
    josi: [['を']],
    fn: (...args) => { throw new Error("未実装") }
  }
}
