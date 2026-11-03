# Print Clean for Gmail — 設計メモ

Gmail の「すべて印刷」画面で、本文以外（アカウント欄・件名・送信元・日時・宛先）を非表示にする Chrome 拡張（Manifest V3）。

## 対象ページ

- `https://mail.google.com/mail/*` のうち、URL に `view=pt` を含むページだけ
- manifest では `matches: ["https://mail.google.com/mail/*"]` と `include_globs: ["*view=pt*"]` で絞る
- このページは読み込み直後に `window.print()` が自動で呼ばれる。**非表示は印刷ダイアログが出る前に効いていなければならない**

## 印刷画面の DOM 構造（実測）

```
body
└ div.bodycontainer
  ├ table                      … アカウント欄（img.logo ＋ 自分のアドレス）
  ├ hr
  └ div.maincontent
    ├ table                    … 件名（font[size=+1] b）＋「N 件のメッセージ」
    ├ hr
    └ table.message            … メッセージ 1 通ごと（複数通なら繰り返す）
      └ tbody
        ├ tr  td(送信元: font b 名前 + アドレス) / td[align=right](日時)
        ├ tr  td[colspan=2] > font.recipient > div.replyto, div(宛先)
        └ tr  td[colspan=2] > table … 本文
```

複数通のスレッドでは `table.message` が繰り返される。セレクタは `table.message` すべてに効くように書く（複数通のスレッドで実機確認済み）。

## 隠す項目と CSS セレクタ

| key | 隠す要素 |
| `account` | `.bodycontainer > table:first-child` と、その直後の `hr` |
| `subject` | `.maincontent > table:first-child` と、その直後の `hr` |
| `sender` | `table.message > tbody > tr:first-child > td:first-child` |
| `date` | `table.message > tbody > tr:first-child > td[align="right"]` |
| `recipients` | `table.message > tbody > tr:has(font.recipient)` |

## 仕組み（競合を避けるための取り決め）

- **既定は全部隠す。CSS だけで隠す。** `content.css` は `html:not(.gpc-show-<key>) <セレクタ> { display: none !important; }` の形で書く。JS が動く前から隠れるので、印刷ダイアログに間に合う
- 利用者が「表示する」を選んだ項目だけ、`content.js` が `<html>` に `gpc-show-<key>` クラスを付ける
- 設定は `chrome.storage.sync` のキー `gpcShow` に `{ account: bool, subject: bool, ... }` で保存する
- キー名・クラス名・既定値・入力検証は **`settings.js`（グローバル `GPC`）だけが定義する**。他のファイルに文字列を直書きしない
  - `GPC.STORAGE_KEY`, `GPC.ITEMS`（`{key, label}` の配列）, `GPC.DEFAULT_SHOW`, `GPC.normalize(raw)`, `GPC.showClasses(show)`
- 権限は `storage` だけ。`host_permissions` は付けない

## ファイル構成の取り決め


- manifest には `action.default_popup: "popup.html"` を含める（popup 側のファイル名はこれで固定）
- content script は `js: ["settings.js", "content.js"]`, `css: ["content.css"]`, `run_at: "document_start"`
- `content.js` は `chrome.storage.onChanged` も購読し、印刷画面を開いたまま設定を変えても反映する
- popup は各項目のチェックボックス（チェック = 印刷に表示する）。変更したら即保存する

## 完了条件

- `npm test` が成功する
- `node --check` で各 JS の構文エラーがない
- `manifest.json` が `node -e "JSON.parse(require('fs').readFileSync('extension/manifest.json','utf8'))"` で読める
- 最終確認は人間が実機で行う（`chrome://extensions` →「パッケージ化されていない拡張機能を読み込む」）

## ストア公開

- 表示名は **`Print Clean for Gmail`**（Google の商標を先頭に置かない）。フォルダ名・キー名・クラス名は変えない
- 公開形態は「公開（Public）」。version は `1.0.0`
- ダッシュボードへの入力内容は `store/README.md` にまとめる。詳細説明はプレーンテキスト（`store/description.*.txt`）、Privacy タブは英語（`store/privacy-practices.md`）
- データは収集・送信しない。権限は `storage` のみのまま増やさない


## 多言語対応（ja / en）

- 表示言語は Chrome の UI 言語で自動選択。`default_locale` は `en`（ja / en 以外の環境は英語）
- 文言はすべて `_locales/{ja,en}/messages.json` に置き、`chrome.i18n.getMessage()` で読む。JS / HTML に表示文言を直書きしない
- 使うキーは `settings.js` の `GPC.MESSAGE_KEYS` が唯一の正。各項目の文言キーは `GPC.ITEMS[].messageKey`
- `errorSave` / `errorLoad` / `errorInit` は置換を 1 つ取る（placeholders の content は `$1`、例: `"保存に失敗しました: $ERROR$"`）
- テスト `extension/test/settings.test.js` が、両言語にキーが過不足なくあることを検査する
- `<html lang>` には `popupLang`（その言語ファイル自身の言語タグ）を入れる。`getUILanguage()` は使わない（ja / en 以外の環境で表示言語とずれるため）

| ファイル | 担当 |
|---|---|
| `settings.js`, `test/settings.test.js`, この節 | Leader |
| `_locales/{ja,en}/messages.json`, `manifest.json` の `default_locale`, `store/*.md`, `README.md` | coder-i18n |
| `popup.html`, `popup.js` | coder-popup |

## 印刷タイミングの保証（print gate）

- 問題: Gmail は印刷画面の読み込み後に `window.print()` を自動で呼ぶ。`content.js` の設定読み込み（非同期）が間に合わないと、「表示する」を選んだ項目が隠れたまま印刷される
- 対策: `print-gate.js` を **MAIN world**・`document_start` で読み込み、`window.print` を包む
  - `<html>` に `GPC.READY_ATTR`（`data-gpc-ready`）が付いていれば、そのまま元の `print` を呼ぶ
  - 付いていなければ、属性が付くまで待ってから 1 回だけ呼ぶ（待機中の重複呼び出しはまとめる）
  - **1500 ms 待っても付かなければ、そのまま印刷する**（印刷を止めない）
  - MAIN world では `chrome.*` と `GPC` は使えない。属性名は文字列で持ち、テストで `GPC.READY_ATTR` と一致を検査する
  - 例外として `content.js` も、`settings.js` の読み込み失敗時の予備として属性名の文字列を持ってよい（テストで一致を検査）
  - 自動・手動を問わず、待機中の `window.print()` はすぐに戻り、準備完了後に印刷する
- `minimum_chrome_version` は `111`（`world: "MAIN"` の要件）
  - グローバル変数を増やさない（IIFE）。元の `print` 以外のページの関数は変更しない
- `content.js` は、クラスの反映が終わった時点（成功・失敗のどちらでも）で `GPC.READY_ATTR` を付ける
- 権限は増やさない（`world: "MAIN"` は Chrome 111 以降の content_scripts の機能）
- 実機確認済み（2026-11-03）：既定で本文だけが印刷される／「表示する」を選んだ項目が最初の印刷プレビューから出る／印刷ダイアログを閉じた後も Gmail の印刷画面に異常がない（`window.print()` がすぐ戻ることによる影響なし）

| ファイル | 担当 |
|---|---|
| `settings.js`（`READY_ATTR`）, `test/print-gate.test.js`, この節 | Leader |
| `print-gate.js`（新規）, `manifest.json` の content_scripts, `test/print-gate-fixture.html`（新規） | coder-gate |
| `content.js`, `store/*.md`, `README.md` | coder-content |
