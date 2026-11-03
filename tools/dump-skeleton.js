// Gmail の印刷画面（view=pt）の DOM 構造だけを取り出す。
// 文字は長さだけ残して伏せ字にし、href / src などの値は出力しない。
// 使い方: 印刷画面で DevTools の Console に貼って実行 → 結果がクリップボードにコピーされる。
(() => {
  const KEEP_ATTRS = ['class', 'width', 'align', 'colspan', 'size', 'dir', 'role'];
  const MAX_DEPTH = 14;
  const lines = [];

  const describe = (el) => {
    const attrs = KEEP_ATTRS
      .filter((name) => el.hasAttribute(name))
      .map((name) => `${name}="${el.getAttribute(name)}"`);
    if (el.hasAttribute('id')) attrs.push('id=…');
    if (el.hasAttribute('style')) attrs.push('style=…');
    if (el.hasAttribute('href')) attrs.push('href=…');
    if (el.hasAttribute('src')) attrs.push('src=…');
    return `<${el.tagName.toLowerCase()}${attrs.length ? ' ' + attrs.join(' ') : ''}>`;
  };

  const walk = (node, depth) => {
    if (depth > MAX_DEPTH) return;
    const indent = '  '.repeat(depth);
    for (const child of node.childNodes) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        if (['SCRIPT', 'STYLE'].includes(child.tagName)) {
          lines.push(`${indent}<${child.tagName.toLowerCase()}>(省略)`);
          continue;
        }
        lines.push(indent + describe(child));
        walk(child, depth + 1);
      } else if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
        lines.push(`${indent}"#×${child.textContent.trim().length}"`);
      }
    }
  };

  walk(document.body, 0);
  const output = lines.join('\n');
  copy(output);
  return `コピーしました（${lines.length} 行）`;
})();
