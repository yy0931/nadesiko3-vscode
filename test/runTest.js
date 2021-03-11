const path = require('path')
const { runTests } = require('vscode-test')

// `extensionDevelopmentPath` 下の拡張機能とともにVSCodeを起動し、その中で `extensionTestsPath` のrun関数を実行する。
runTests({
	extensionDevelopmentPath: path.resolve(__dirname, '../'),
	extensionTestsPath: path.resolve(__dirname, './suite/index'),
	launchArgs: ['--disable-extensions'],
}).catch((err) => {
	console.error('Failed to run tests')
	process.exit(1)
})
