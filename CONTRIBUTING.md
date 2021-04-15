# Contributing

修正・提案など歓迎しています。自由にissueやpull requestを送ってください。

```shell
yarn                 # 依存のインストール
yarn test            # テスト
VSCodeで開いてF5キー   # デバッグ
vsce package         # .vsixファイルの生成
```

# 更新方法

1. `yarn upgrade && node gen_docs.js`
3. package.jsonのversionを上げる
4. README.mdを更新する
5. VSCodeを閉じて `yarn test`
6. `yarn vsce package`
