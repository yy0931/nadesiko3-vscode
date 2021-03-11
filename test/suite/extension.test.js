const vscode = require('vscode')
const { expect } = require('chai')
const { legend } = require('../../src/extension')

const sleep = (/** @type {number} */ms) => /** @type {Promise<void>} */new Promise((resolve) => setTimeout(resolve, ms))

// 5秒間試してだめだったらエラーを投げる。
/** @type {<T>(f: () => Promise<T>) => Promise<T>} */
const retry = async (f) => {
    const startTime = Date.now()
    while (true) {
        try {
            return await f()
        } catch (err) {
            if (Date.now() - startTime < 5000) {
                await sleep(100)
                continue
            }
            throw err
        }
    }
}

/** @type {<T>(x: T | null | undefined) => T} */
const notNullish = (x) => x

const openUntitledFile = async (/** @type {string} */content) => {
    const document = await vscode.workspace.openTextDocument({ language: 'nadesiko3', content })
    await vscode.window.showTextDocument(document)
    const editor = await retry(async () => {
        const editor = notNullish(vscode.window.activeTextEditor)
        expect(editor.document.uri).to.equal(document.uri)
        return editor
    })
    return { document, editor }
}

describe('一時的なファイル', () => {
    it('ソースコード上に「ファイルを実行」ボタンを表示する', async () => {
        const { document, editor } = await openUntitledFile('「こんにちは」を表示する。\n')
        await retry(async () => {
            /** @type {vscode.CodeLens[]} */
            const lens = notNullish(await vscode.commands.executeCommand('vscode.executeCodeLensProvider', document.uri))
            expect(lens).to.be.an('array').and.have.lengthOf(1)
            expect(notNullish(lens)[0].command).to.deep.include({
                title: '$(play) ファイルを実行',
                command: 'nadesiko3.runActiveFile',
            })
        })
        vscode.commands.executeCommand('workbench.action.closeActiveEditor')
    })
    it('シンタックスハイライト', async () => {
        const { document, editor } = await openUntitledFile('「こんにちは」を表示する。\n')
        await retry(async () => {
            // 文字を入力するまでシンタックスハイライトされない問題があるため、文字列リテラル内に'a'を挿入する。
            await editor.edit((edit) => { edit.insert(new vscode.Position(0, 1), 'a') })

            /** @type {vscode.SemanticTokens} */
            const tokens = notNullish(await vscode.commands.executeCommand('vscode.provideDocumentSemanticTokens', document.uri))

            // 最初の要素が文字列（0個目のトークンのtype（3番目の要素））
            // 参照: DocumentSemanticTokensProvider のJSDoc
            const id = legend.tokenTypes.indexOf('string')
            expect(tokens?.data[0 * 5 + 3]).to.equal(id)
        })
        vscode.commands.executeCommand('workbench.action.closeActiveEditor')
    })
    it('シンタックスエラーの表示', async () => {
        const { document } = await openUntitledFile('A=')
        await retry(async () => {
            const diagnostics = vscode.languages.getDiagnostics(document.uri)
            expect(diagnostics).has.lengthOf(1)
            expect(diagnostics[0].severity).to.equal(vscode.DiagnosticSeverity.Error)
            expect(diagnostics[0].message).to.include('文法エラー')
        })
        vscode.commands.executeCommand('workbench.action.closeActiveEditor')
    })
    it('警告の表示', async () => {
        const { document } = await openUntitledFile('Aを表示')
        await retry(async () => {
            const diagnostics = vscode.languages.getDiagnostics(document.uri)
            expect(diagnostics).has.lengthOf(1)
            expect(diagnostics[0].severity).to.equal(vscode.DiagnosticSeverity.Warning)
            expect(diagnostics[0].message).to.include('変数 A は定義されていません')
        })
        vscode.commands.executeCommand('workbench.action.closeActiveEditor')
    })
})
