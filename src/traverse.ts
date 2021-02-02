import { Ast } from "./parse"

export const traverse = <T>(ast: Ast | Ast[], collect: (v: Ast) => T): T[] => {
    if (Array.isArray(ast)) {
        return ast.flatMap((child) => traverse(child, collect))
    }

    const result = new Array<T>()
    for (const key of Object.keys(ast)) {
        if (key === "declaration") {
            continue
        }
        const astAsAny = ast as any
        if (typeof astAsAny[key] === "object" && astAsAny[key] !== null && typeof astAsAny[key].type === "string") {
            result.push(...traverse(astAsAny[key], collect))
        }
        if (Array.isArray(astAsAny[key]) && (astAsAny[key] as Ast[]).every((v) => typeof v.type === "string")) {
            result.push(...(astAsAny[key] as Ast[]).flatMap((v) => traverse(v, collect)))
        }
    }
    return result
}

export const debugAst = (ast: Ast): Ast => {
    ast = { ...ast }
    for (const key of ["line", "column", "file", "preprocessedCodeOffset", "preprocessedCodeLength", "startOffset", "endOffset", "rawJosi", "declaration", "meta", "isDefinition"]) {
        delete (ast as any)[key]
    }
    for (const key of Object.keys(ast)) {
        const astAsAny = ast as any
        if (typeof astAsAny[key] === "object" && astAsAny[key] !== null && typeof astAsAny[key].type === "string") {
            astAsAny[key] = debugAst(astAsAny[key])
        }
        if (Array.isArray(astAsAny[key]) && (astAsAny[key] as Ast[]).every((v) => typeof v.type === "string")) {
            astAsAny[key] = (astAsAny[key] as Ast[]).map((v) => debugAst(v))
        }
    }
    switch (ast.type) {
        case "word": return { type: "word", value: ast.value }
        case "eol": return { type: "eol" }
        case "eof": return { type: "eof" }
        default:
            return ast
    }
}
