# Chrome Web Store 入力ガイド

デベロッパーダッシュボードの各欄に、どのファイルの内容を入れるかの対応表。

## Package

| 欄 | 入力するもの |
|---|---|
| パッケージ | `npm run package` で作る `dist/print-clean-for-gmail-<version>.zip` |

## Store listing

既定の言語は English（`manifest.json` の `default_locale: en`）。日本語は言語を追加して入力する。

| 欄 | English | 日本語 |
|---|---|---|
| 名前・短い説明 | `extension/_locales/en/messages.json` から自動で入る | `extension/_locales/ja/messages.json` から自動で入る |
| 詳細説明 | [`description.en.txt`](description.en.txt) の全文 | [`description.ja.txt`](description.ja.txt) の全文 |
| スクリーンショット | `docs/screenshots/*-en.png`（全言語向けアセット） | `docs/screenshots/screenshot-1-before-after.png`, `screenshot-2-popup.png`（日本語向けの上書き） |

| 欄（言語共通） | 入力するもの |
|---|---|
| ストア用アイコン | `extension/icons/icon-128.png` |
| カテゴリ | Productivity 系（例：Tools） |
| ホームページの URL | `https://ext.ykich.work/print-clean-for-gmail/` |
| サポートの URL | `https://github.com/ykich/print-clean-for-gmail/issues` |
| 公式 URL | 空欄（Search Console でドメイン確認をした場合のみ設定） |

## Privacy

[`privacy-practices.md`](privacy-practices.md) の各ブロックを、同名の欄に貼り付ける。

## Distribution

| 欄 | 入力するもの |
|---|---|
| 料金 | 無料 |
| 公開範囲 | Public |
| 地域 | すべての地域 |

## プライバシーポリシー

- 原稿：[`privacy-policy.md`](privacy-policy.md)
- 公開ページ：`site/print-clean-for-gmail/privacy/index.html`（https://ext.ykich.work/print-clean-for-gmail/privacy/）
- 2 つの内容は手で同期する。変更したら両方の「最終更新日」を改める
