import nakoVersion from './nako_version'

/**
 * なでしこの文法エラーを表示するクラス
 */

class NakoSyntaxError extends Error {
  constructor(msg, line, fname) {
    const line2 = line + 1
    const fname2 = (fname === undefined) ? '' : fname
    // Get Nadesiko Version

    // Error Message Format
    const title = `[文法エラー]${fname2}(${line2}行目): ${msg}\n` +
      `[バージョン] ${nakoVersion.version}`
    super(title)
  }
}

export default NakoSyntaxError
