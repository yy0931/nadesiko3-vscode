const vscode = require('vscode')
const { expect } = require('chai')
const { legend } = require('../../src/extension')

const sleep = (/** @type {number} */ms) => /** @type {Promise<void>} */new Promise((resolve) => setTimeout(resolve, ms))

// 5秒間試してだめだったらエラーを投げる。
const retry = async (/** @type {() => Promise<void> */f) => {
    const startTime = Date.now()
    while (true) {
        try {
            await f()
            break
        } catch (err) {
            if (Date.now() - startTime < 5000) {
                await sleep(100)
                continue
            }
            throw err
        }
    }
}

/** @type {<T>(x: T | null) => T} */
const notNull = (x) => x

describe('一時的なファイル', () => {
    /** @type {vscode.TextDocument} */
    let document
    /** @type {vscode.TextEditor} */
    let editor
    before(async () => {
        document = await vscode.workspace.openTextDocument({ language: 'nadesiko3', content: '「こんにちは」を表示する。\n' })
        await vscode.window.showTextDocument(document)
        return retry(async () => {
            editor = notNull(vscode.window.activeTextEditor)
            expect(editor).not.to.be.undefined
        })
    })
    it('ソースコード上に「ファイルを実行」ボタンを表示する', () => retry(async () => {
        /** @type {vscode.CodeLens[]} */
        const lens = await vscode.commands.executeCommand('vscode.executeCodeLensProvider', document.uri)
        expect(lens).to.be.an('array').and.have.lengthOf(1)
        expect(notNull(lens)[0].command).to.deep.include({
            title: '$(play) ファイルを実行',
            command: 'nadesiko3.runActiveFile',
        })
    }))
    it('シンタックスハイライト', () => retry(async () => {
        /** @type {vscode.SemanticTokens} */
        const tokens = await vscode.commands.executeCommand('vscode.provideDocumentSemanticTokens', document.uri)

        // 文字を入力するまでシンタックスハイライトされない問題があるため、文字列リテラル内に'a'を挿入する。
        await editor.edit((edit) => { edit.insert(new vscode.Position(0, 1), 'a') })

        // 最初の要素が文字列（0個目のトークンのtype（3番目の要素））
        // 参照: DocumentSemanticTokensProvider のJSDoc
        const id = legend.tokenTypes.indexOf('string')
        expect(tokens?.data[0 * 5 + 3]).to.equal(id)
    }))
})
