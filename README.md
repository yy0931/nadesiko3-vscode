# vscode-nadesiko3 README

プログラミング言語なでしこv3の拡張機能

![screenshot](https://raw.githubusercontent.com/yy0931/nadesiko3-vscode/master/nako.png)

## Features

実装済みの機能:
- [x] シンタックスハイライト
- [x] トークンの可視化
- [x] 関数のドキュメントのホバー
- [x] Webブラウザ上で実行
- [x] シンタックスエラーの位置を表示
- [x] 関数の定義元へジャンプ

## 使用方法
拡張子が .nako3 のファイルがなでしこv3のファイルとして認識されます。
作成したプログラムを実行するにはVisual Studio Code の右上の ▷ ボタンか、ソースコード上に表示されるボタンを押してください。

トークンの区切り線や助詞の強調が不要な場合は、VSCodeの設定から無効化出来ます。

外部プラグインの使用に由来するシンタックスエラーは、特定のコメント文を追加することで回避出来ます。[プラグインについて](https://github.com/yy0931/nadesiko3-vscode/blob/main/プラグインについて.md) を参照してください。

プログラム内の関数名の定義場所を見るには、関数名を右クリックして Go to Definition （定義へ移動） を選択するか、関数名をCtrl + クリックするか、関数名にカーソルを重ねてF12キーを押してください。自作の関数の場合はその定義場所、プラグインの場合はそれに対応する宣言ファイルが表示されます。

![go_to_definition](https://raw.githubusercontent.com/yy0931/nadesiko3-vscode/master/go_to_definition.png)
