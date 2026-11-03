// Shared contract between content script and popup.
// Loaded as a classic script (content_scripts / <script>) and exposes one global.
(() => {
  const STORAGE_KEY = 'gpcShow';
  const CLASS_PREFIX = 'gpc-show-';
  // Set on <html> by content.js once the user's show/hide classes are applied (or failed to load).
  // print-gate.js (MAIN world) waits for it before letting Gmail's auto window.print() run.
  const READY_ATTR = 'data-gpc-ready';

  // Each item is hidden by default. "show" = true means the user wants it printed.
  const ITEMS = Object.freeze([
    Object.freeze({ key: 'account', messageKey: 'itemAccount' }),
    Object.freeze({ key: 'subject', messageKey: 'itemSubject' }),
    Object.freeze({ key: 'sender', messageKey: 'itemSender' }),
    Object.freeze({ key: 'date', messageKey: 'itemDate' }),
    Object.freeze({ key: 'recipients', messageKey: 'itemRecipients' }),
  ]);

  // Every chrome.i18n message key the extension uses (must exist in every _locales/*/messages.json).
  // errorSave / errorLoad / errorInit take one substitution: the error text.
  const MESSAGE_KEYS = Object.freeze([
    'appName',
    'appDesc',
    'popupLang', // BCP 47 tag of the language actually shown ("ja" / "en"), used for <html lang>
    'popupHint',
    'popupFormLabel',
    ...ITEMS.map((item) => item.messageKey),
    'errorSave',
    'errorLoad',
    'errorInit',
  ]);

  const DEFAULT_SHOW = Object.freeze(
    Object.fromEntries(ITEMS.map((item) => [item.key, false])),
  );

  /** Validate raw storage value; unknown keys and non-boolean values fall back to defaults. */
  function normalize(raw) {
    const source = raw && typeof raw === 'object' ? raw : {};
    return Object.freeze(
      Object.fromEntries(
        ITEMS.map(({ key }) => [
          key,
          typeof source[key] === 'boolean' ? source[key] : DEFAULT_SHOW[key],
        ]),
      ),
    );
  }

  /** Class names to put on <html> for items the user wants to show. */
  function showClasses(show) {
    const normalized = normalize(show);
    return ITEMS.filter(({ key }) => normalized[key]).map(({ key }) => CLASS_PREFIX + key);
  }

  globalThis.GPC = Object.freeze({
    STORAGE_KEY,
    CLASS_PREFIX,
    READY_ATTR,
    ITEMS,
    MESSAGE_KEYS,
    DEFAULT_SHOW,
    normalize,
    showClasses,
  });
})();
