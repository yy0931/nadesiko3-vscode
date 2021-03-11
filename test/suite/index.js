const path = require('path')
const Mocha = require('mocha')
const glob = require('glob')

/** @returns {Promise<void>} */
exports.run = function run() {
	const mocha = new Mocha({ color: true, timeout: 10 * 1000 })

	const testsRoot = path.resolve(__dirname, '..')

	return new Promise((resolve, reject) => {
		glob('**/**.test.js', { cwd: testsRoot }, (err, files) => {
			if (err) {
				return reject(err)
			}

			files.forEach((f) => mocha.addFile(path.resolve(testsRoot, f)))

			try {
				mocha.run((failures) => {
					if (failures > 0) {
						reject(new Error(`${failures} tests failed.`))
					} else {
						resolve()
					}
				})
			} catch (err) {
				console.error(err)
				reject(err)
			}
		})
	})
}
