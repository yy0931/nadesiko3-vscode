declare module "nadesiko3/src/nako3" {
    class NakoCompiler {
        constructor()
        get log(): string
        static getHeader(): string
        /**
         * コードを単語に分割し属性の補正を行う
         */
        tokenize(code: string, isFirst: boolean, line?: number): string
        tokenizeAsync(code: string, isFirst: boolean, filename: string, line?: number): Promise<any>
        /**
         * コードを単語に分割する
         */
        rawtokenize(code: string, line: number, filename: string): any[]
        /**
         * 単語の属性を構文解析に先立ち補正する
         */
        converttoken(tokens: any, isFirst: boolean): any
        /**
         * デバッグモードに設定する
         */
        useDebug(flag?: boolean): void
        /**
         * 環境のリセット
         */
        reset(): void
        /**
         * コードを生成
         */
        generate(ast: any, isTest: boolean): string
        /**
         * コードをパースしてASTにする
         */
        parse(code: string, filename: string): any
        parseAsync(code: string, filename: string): Promise<any>
        getUsedFuncs(ast: any): any
        getUsedAndDefFuncs(astQueue: any, blockQueue: any): void
        getUsedAndDefFunc(block: any, astQueue: any, blockQueue: any): void
        deleteUnNakoFuncs(): any
        /**
         * プログラムをコンパイルしてJavaScriptのコードを返す
         */
        compile(code: string, filename: string, isTest: boolean): string
        compileAsync(code: string, filename: string, isTest: boolean): Promise<string>
        _run(code: string, fname: string, isReset: boolean, isTest: boolean): this
        _runEx(code: string, fname: string, opts: any): this
        _runAsync(code: string, fname: string, isReset: boolean, isTest: boolean): Promise<this>
        _runExAsync(code: string, fname: string, opts: any): Promise<this>
        runEx(code: string, fname: string, opts: any): this
        runExAsync(code: string, fname: string, opts: any): Promise<this>
        test(code: string, fname: string): this
        run(code: string, fname: string): this
        runReset(code: string, fname: string): this
        testAsync(code: string, fname: string): Promise<this>
        runAsync(code: string, fname: string): Promise<this>
        runResetAsync(code: string, fname: string): Promise<this>
        clearLog(): void
        /**
         * eval()実行前に直接JSのオブジェクトを取得する場合
         */
        getVarsList(): any
        /**
         * 完全にJSのコードを取得する場合
         */
        getVarsCode(): this
        /**
         * プラグイン・オブジェクトを追加
         */
        addPlugin(po: any): void
        /**
         * プラグイン・オブジェクトを追加(ブラウザ向け)
         */
        addPluginObject(objName: string, po: any): void
        /**
         * プラグイン・ファイルを追加(Node.js向け)
         */
        addPluginFile(objName: string, fpath: string, po: any): void
        /**
         * 関数を追加する
         */
        addFunc(key: string, josi: any, fn: any): void
        /**
         * 関数をセットする
         */
        setFunc(key: string, josi: any, fn: any): void
        /**
         * プラグイン関数を参照する
         */
        getFunc(key: string): any
    }
    export = NakoCompiler
}

declare module "nadesiko3/src/nako_parser_const" {
    export const opPriority: Record<string, number>
    export const keizokuJosi: string[]
}

declare module "nadesiko3/src/nako_reserved_words" {
    const reservedWords: Record<string, string>
    export = reservedWords
}

declare module "nadesiko3/src/nako_josi_list" {
    export const tarareba: Record<string, boolean>
    export const josiRE: RegExp
}

declare module "nadesiko3/src/nako_lex_rules" {
    const a: {
        rules: any[],
        trimOkurigana: (s: string) => string,
    }
    export = a
}

declare module "nadesiko3/src/plugin_node" {
    const a: any
    export = a
}

declare module "nadesiko3/src/plugin_csv" {
    const a: any
    export = a
}

declare module "nadesiko3/src/nako_parser_base" {
    export class NakoParserBase {
        index: number
        constructor()
    }
}

declare module "nadesiko3/src/nako_parser3" {
    import { NakoParserBase } from "nadesiko3/src/nako_parser_base"
    interface Ast<Token> {
        // 一部のプロパティのみ。
        type: string
        cond?: Token | Ast<Token>
        block?: (Token | Ast<Token>)[] | Token | Ast<Token>
        false_block?: Token | Ast<Token>
        josi?: string
        value?: unknown
        line?: number
    }
    class NakoParser extends NakoParserBase {
        parse<Token>(tokens: Token): Ast<Token>
    }
    export = NakoParser
}

declare module "nadesiko3/src/nako_syntax_error" {
    class NakoSyntaxError extends Error {
        constructor(msg: string, line: number, fname: string)
    }
    export = NakoSyntaxError
}
