# Print Clean for Gmail

Gmail の「すべて印刷」画面（URL に `view=pt`）で、本文以外（アカウント欄・件名・送信元・日時・宛先）を隠す Chrome 拡張（Manifest V3）。

## 構成

| パス | 内容 |
|---|---|
| `extension/` | 拡張機能の本体（ストアに出す ZIP の中身）と `test/` |
| `docs/SPEC.md` | **設計の唯一の正**。挙動を変えるときは先にここを更新する |
| `store/` | ストアの入力ガイド（`store/README.md`）、詳細説明、Privacy タブの文面、プライバシーポリシーの原稿 |
| `site/` | https://ext.ykich.work に Cloudflare Pages で公開する静的ページ（ビルドなし、出力ディレクトリ `site`） |
| `docs/icon/` | アイコンの元画像（Gemini で生成）と生成に使った指示文。`extension/icons/` の PNG はここから縮小して作った |
| `tools/` | `package.sh`（ZIP 作成）、`dump-skeleton.js`（Gmail 印刷画面の DOM 構造を伏せ字で取り出す） |

## コマンド

```bash
npm test                          # node:test（Node.js 24 以上）
node --check extension/<file>.js  # 構文チェック
npm run package                   # dist/print-clean-for-gmail-<version>.zip（コミット済みのファイルだけを含む）
```

## 守る約束

- 権限は `storage` だけ。`host_permissions`・通信処理（`fetch` 等）・`innerHTML`・リモートコードは入れない
- キー名・クラス名・属性名・既定値は `extension/settings.js`（グローバル `GPC`）だけで定義する。例外は MAIN world の `print-gate.js` と、`content.js` の予備の属性名（テストで一致を検査）
- `print-gate.js` は MAIN world で動く。`chrome.*` と `GPC` は使えない。グローバル変数を増やさない
- 非表示は CSS だけで既定に効かせる（JS より先に効くことが前提）
- 表示文言は `extension/_locales/{en,ja}/messages.json` に置き、`GPC.MESSAGE_KEYS` と過不足なく揃える（テストで検査）。`default_locale` は `en`
- 拡張機能の挙動を変えたら `extension/manifest.json` の `version` を上げる

## 一緒に更新する文書

実装を変えたら、次が実装と食い違っていないか確認する。ストア審査は記述と実装の一致を見る。

- `store/description.en.txt` / `store/description.ja.txt`（ストアの詳細説明。プレーンテキスト、そのまま貼る）
- `store/privacy-practices.md`（Privacy タブ。英語）
- `README.md`（安全性の表、既知の制限）
- プライバシーポリシーは `store/privacy-policy.md` と `site/print-clean-for-gmail/privacy/index.html` の 2 か所を同時に更新し、最終更新日を改める

## 公開前の確認

- 公開リポジトリなので、コミット前に秘密情報・個人のパス・実在のメールアドレス・Gmail の識別子（`ik=`、スレッド ID）が含まれていないか確認する
- テストやスクリーンショットのメールアドレスは `example.com` のダミーだけを使う
- Cloudflare の Web Analytics / Rocket Loader / Email Obfuscation は使わない（`site/_headers` の厳しい CSP で壊れる）
