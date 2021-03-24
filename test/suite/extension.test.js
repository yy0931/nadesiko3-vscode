const vscode = require('vscode')
const { expect } = require('chai')
const { legend, retry } = require('../../src/extension')
const path = require('path')
const docs = require('../../src/docs')

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
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
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
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
    })
    it('シンタックスエラーの表示', async () => {
        const { document } = await openUntitledFile('A=')
        await retry(async () => {
            const diagnostics = vscode.languages.getDiagnostics(document.uri)
            expect(diagnostics).has.lengthOf(1)
            expect(diagnostics[0].severity).to.equal(vscode.DiagnosticSeverity.Error)
            expect(diagnostics[0].message).to.include('文法エラー')
        })
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
    })
    it('警告の表示', async () => {
        const { document } = await openUntitledFile('Aを表示')
        await retry(async () => {
            const diagnostics = vscode.languages.getDiagnostics(document.uri)
            expect(diagnostics).has.lengthOf(1)
            expect(diagnostics[0].severity).to.equal(vscode.DiagnosticSeverity.Warning)
            expect(diagnostics[0].message).to.include('変数 A は定義されていません')
        })
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
    })
    it('プログラムの実行', async () => {
        const { } = await openUntitledFile('1+2を表示\n10を表示')
        const out = await vscode.commands.executeCommand('nadesiko3.runActiveFile', false, /* vscodeTest= */true)
        expect(out.log).to.equal('3\n10')
        expect(out.html.trim()).to.equal(`<div style="">3</div><div style="">10</div>`)
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor') // webview
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor') // editor
    })
    it('ドキュメントの表示', () => {
        expect(docs['plugin_csv']['CSV取得']).to.not.null
    })
})
