const assert = require("assert")

/**
 * file: plugin_test.js
 * テスト実行用プラグイン
 */
export default {
  // @テスト
  'ASSERT等': { // @ mochaによるテストで、ASSERTでAとBが正しいことを報告する // @ASSERTひとしい
    type: 'func',
    josi: [['と'], ['が']],
    fn: function (a, b, sys) {
      assert.strictEqual(a, b)
    }
  },
  'テスト実行': { // @ mochaによるテストで、ASSERTでAとBでテスト実行してAとBが等しいことを報告する // @てすとじっこう
    type: 'func',
    josi: [['と'], ['で']],
    fn: function (a, b, sys) {
      assert.strictEqual(a, b)
    }
  },
  'テスト等しい': { // @ mochaによるテストで、ASSERTでAとBが正しいことを報告する // @テストひとしい
    type: 'func',
    josi: [['と'], ['が']],
    fn: function (a, b, sys) {
      assert.strictEqual(a, b)
    }
  },
}
