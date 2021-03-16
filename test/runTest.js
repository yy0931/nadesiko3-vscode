//@ts-check
const path = require('path')
const { runTests } = require('vscode-test')
const fs = require('fs')
const semver = require('semver')

const main = async () => {
	// package.jsonのengines.vscodeを読む
	const packageJSON = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json')).toString())
	const minVersion = semver.minVersion(packageJSON.engines.vscode)?.format()

	// 各バージョンでテストする
	for (const version of ['stable', 'insiders', minVersion]) {
		await runTests({
			extensionDevelopmentPath: path.resolve(__dirname, '../'),
			extensionTestsPath: path.resolve(__dirname, './suite/index'),
			launchArgs: ['--disable-extensions'],
			version,
		})
	}
}

main().catch((err) => {
	console.error('Failed to run tests')
	process.exit(1)
})
// `extensionDevelopmentPath` 下の拡張機能とともにVSCodeを起動し、その中で `extensionTestsPath` のrun関数を実行する。
