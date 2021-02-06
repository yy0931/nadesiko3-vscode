import "regenerator-runtime/runtime"
//@ts-ignore
import * as monacoAny from "monaco-editor/esm/vs/editor/editor.main.js"
import type monacoType from "monaco-editor"
const monaco: typeof monacoType = monacoAny
import * as vscode from "./monaco_vscode"
import LanguageFeatures from "../../src/language_features"

// parcelでmonacoを使う場合に必要
declare const self: any
self.MonacoEnvironment = {
    getWorkerUrl: (moduleId: any, label: any) => {
        if (label === "json") {
            return "./json.worker.js"
        }
        if (label === "css" || label === "scss" || label === "less") {
            return "./css.worker.js"
        }
        if (label === "html" || label === "handlebars" || label === "razor") {
            return "./html.worker.js"
        }
        if (label === "typescript" || label === "javascript") {
            return "./ts.worker.js"
        }
        return "./editor.worker.js"
    }
}

monaco.languages.register({ id: 'nadesiko3' })

const legend = new vscode.SemanticTokensLegend(
    ["namespace", "class", "enum", "interface", "struct", "typeParameter", "type", "parameter", "variable", "property", "enumMember", "event", "function", "method", "macro", "label", "comment", "string", "keyword", "number", "regexp", "operator"],
    ["declaration", "definition", "readonly", "static", "deprecated", "abstract", "async", "modification", "documentation", "defaultLibrary"],
)

const languageFeatures = new LanguageFeatures(
    vscode.SemanticTokensBuilder,
    vscode.SemanticTokensLegend,
    [],
    vscode.MarkdownString,
    monaco.Uri,
    false,
    vscode.VSCodeRange,
    vscode.Position,
)

monaco.languages.registerDocumentSemanticTokensProvider('nadesiko3', {
    getLegend: () => legend,

    provideDocumentSemanticTokens: (model: monacoType.editor.ITextModel, lastResultId: string | null, token: monacoType.CancellationToken): monacoType.languages.ProviderResult<monacoType.languages.SemanticTokens | monacoType.languages.SemanticTokensEdits> => {
        return languageFeatures.provideDocumentSemanticTokens(new vscode.TextDocument(model))
    },

    releaseDocumentSemanticTokens: () => {
    }
})

// デフォルトだと色が足りないため、個別に追加
monaco.editor.defineTheme("vs-plus", {
    base: "vs",
    inherit: true,
    colors: {},
    rules: [
        {
            token: "function",
            foreground: "#795E26",
        },
        {
            token: "variable.readonly",
            foreground: "#0070C1",
        },
        {
            token: "keyword",
            foreground: "#AF00DB"
        },
        {
            token: "macro",
            foreground: "#0000FF"
        }
    ],
})

const editor = monaco.editor.create(document.getElementById("container")!, {
    value: '「こんにちは」と表示',
    language: "nadesiko3",
    theme: "vs-plus",
    'semanticHighlighting.enabled': true, // https://github.com/microsoft/monaco-editor/issues/1833
})

let oldDecorationIndices = new Array<string>()
const updateDecorations = async () => {
    const model = editor.getModel()
    if (model === null) {
        return
    }

    const newDecorations = await languageFeatures.getDecorations(new vscode.TextDocument(model))
    const diff = new Array<monacoType.editor.IModelDeltaDecoration>()
    for (const d of newDecorations.josiDecorations) {
        diff.push({
            range: vscode.VSCodeRange.toMonaco(d.range),
            options: {
                inlineClassName: "josi-decoration",
                hoverMessage: {
                    value: (d.hoverMessage || "").toString(),
                    isTrusted: false,
                }
            }
        })
    }
    for (const d of newDecorations.tokenDecorations) {
        diff.push({
            range: vscode.VSCodeRange.toMonaco(d.range),
            options: {
                inlineClassName: "token-decoration",
                hoverMessage: {
                    value: (d.hoverMessage || "").toString(),
                    isTrusted: false,
                }
            }
        })
    }

    oldDecorationIndices = editor.deltaDecorations(oldDecorationIndices, diff)
}
updateDecorations().catch((err) => { console.error(err) })

editor.getModel()?.onDidChangeContent((event) => { updateDecorations().catch((err) => { console.error(err) }) })
