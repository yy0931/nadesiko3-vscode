import * as vscode from "vscode"

const codeLendsProvider: vscode.CodeLensProvider = {
    provideCodeLenses(
        document: vscode.TextDocument,
        token: vscode.CancellationToken,
    ): vscode.ProviderResult<vscode.CodeLens[]> {
        if (document.getText().length <= 2) {
            return []
        }
        return [
            new vscode.CodeLens(
                new vscode.Range(0, 0, 0, 0),
                {
                    title: "$(play) ブラウザで実行",
                    command: "nadesiko3.runActiveFileOnBrowser",
                },
            ),
            new vscode.CodeLens(
                new vscode.Range(0, 0, 0, 0),
                {
                    title: "$(play) VSCode上で実行",
                    command: "nadesiko3.runActiveFileOnVSCode",
                },
            ),
        ];
    }
}

export default codeLendsProvider
