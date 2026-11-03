# Privacy practices（ダッシュボードの Privacy タブ）

Privacy タブの各欄は 1 つの言語でしか入力できないため、審査担当者が読む英語で入力する。各ブロックの中身をそのまま貼り付ける。日本語訳は確認用。

## Single purpose description（単一目的）

```text
Hides non-body items (account bar, subject, sender, date, recipients) on Gmail's print page so that only the message body is printed, except the items the user chooses to keep.
```

日本語訳：Gmail の印刷画面で、本文以外の項目（アカウント欄・件名・送信元・日時・宛先）を隠し、本文だけを印刷できるようにする。ただし、利用者が「残す」と選んだ項目は隠さない。

## Permission justification: storage（storage の理由）

```text
Used only to save which items the user wants to keep in the printout (an on/off value for each of five items) in chrome.storage.sync. No email content, email addresses or other data are stored.
```

日本語訳：印刷に残す項目の設定（5 項目それぞれのオン・オフ）を chrome.storage.sync に保存するためだけに使う。メールの内容やアドレスなどは保存しない。

## Host permission justification（ホスト権限の理由）

```text
Content scripts are declared for https://mail.google.com/mail/* and narrowed with include_globs ["*view=pt*"], so they are injected only into Gmail's print page. Changing the layout of that page is the single purpose of the extension.
- content.css hides the selected items with CSS.
- content.js reads the saved setting, adds or removes classes on the <html> element, and sets one data-gpc-ready attribute when the setting has been applied (or could not be loaded).
- print-gate.js runs in the MAIN world only to wrap window.print, so that printing waits (up to 1.5 seconds) until the setting has been applied. It only checks the data-gpc-ready attribute.
None of the scripts read email content. The extension itself makes no network requests; the only stored value is the display setting in chrome.storage.sync, which Chrome may sync across the user's devices when Chrome sync is on.
```

日本語訳：コンテンツスクリプトは https://mail.google.com/mail/* を対象とし、include_globs で印刷画面（view=pt）だけに絞っている。content.css が項目を隠し、content.js は設定を読んで `<html>` のクラスを付け外しし、反映後（読み込みに失敗した場合も）に data-gpc-ready 属性を 1 つ付ける。print-gate.js は MAIN world で window.print を包み、設定の反映まで最大 1.5 秒印刷を待たせるだけ。どのスクリプトもメールの内容を読まない。拡張機能自身は通信しない（保存する表示設定は、Chrome の同期が有効なら Chrome が端末間で同期する）。

## Are you using remote code?（リモートコードの使用）

**No, I am not using remote code.**（すべてのコードはパッケージ内にある）

## Data usage（データの使用）

- 収集するデータの種類：**どれにもチェックしない**（収集なし）
- 3 つの宣誓：**すべてにチェックする**
  - I do not sell or transfer user data to third parties, outside of the approved use cases
  - I do not use or transfer user data for purposes that are unrelated to my item's single purpose
  - I do not use or transfer user data to determine creditworthiness or for lending purposes

## Privacy policy URL

```text
https://ext.ykich.work/print-clean-for-gmail/privacy/
```
