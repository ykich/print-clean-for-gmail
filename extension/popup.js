// Popup UI: one checkbox per GPC.ITEMS entry (checked = show in print). Saves on every change.
(() => {
  const CHECKBOX_ID_PREFIX = 'gpc-item-';

  const form = document.getElementById('items');
  const statusEl = document.getElementById('status');

  // Localized text for a GPC message key. A missing translation shows the key itself and logs it.
  function t(key, substitutions) {
    const message = chrome.i18n.getMessage(key, substitutions);
    if (!message) {
      console.error(`missing i18n message: ${key}`);
      return key;
    }
    return message;
  }

  function localizeStaticText() {
    document.documentElement.lang = t('popupLang');
    document.title = t('appName');
    document.getElementById('app-name').textContent = t('appName');
    document.getElementById('hint').textContent = t('popupHint');
    form.setAttribute('aria-label', t('popupFormLabel'));
  }

  // Last state confirmed by storage (read or successful write). Never mutated in place.
  let current = GPC.normalize(undefined);

  function showError(message) {
    statusEl.textContent = message;
    statusEl.className = 'status error';
    statusEl.hidden = false;
  }

  function clearStatus() {
    statusEl.textContent = '';
    statusEl.className = 'status';
    statusEl.hidden = true;
  }

  function errorText(err) {
    return err && err.message ? err.message : String(err);
  }

  // Wrap the callback API so both chrome.runtime.lastError and thrown errors become a rejection.
  function storageGet(key) {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(key, (result) => {
        const err = chrome.runtime.lastError;
        if (err) {
          reject(new Error(err.message));
          return;
        }
        resolve(result);
      });
    });
  }

  function storageSet(items) {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.set(items, () => {
        const err = chrome.runtime.lastError;
        if (err) {
          reject(new Error(err.message));
          return;
        }
        resolve();
      });
    });
  }

  function checkboxFor(key) {
    return document.getElementById(CHECKBOX_ID_PREFIX + key);
  }

  function render(show) {
    GPC.ITEMS.forEach(({ key }) => {
      const box = checkboxFor(key);
      if (box) box.checked = show[key];
    });
  }

  function setDisabled(disabled) {
    GPC.ITEMS.forEach(({ key }) => {
      const box = checkboxFor(key);
      if (box) box.disabled = disabled;
    });
  }

  // What the UI currently shows; may run ahead of `current` while saves are pending.
  let desired = current;
  // Saves run one at a time so a quick second toggle cannot overwrite the first.
  let saveQueue = Promise.resolve();

  // Reads `desired` at run time, so a save queued before an earlier failure cannot write a stale value.
  async function save() {
    const next = desired;
    try {
      await storageSet({ [GPC.STORAGE_KEY]: next });
      current = next;
      clearStatus();
    } catch (err) {
      showError(t('errorSave', [errorText(err)]));
      desired = current;
      render(current);
    }
  }

  function handleChange(key, checked) {
    desired = GPC.normalize({ ...desired, [key]: checked });
    saveQueue = saveQueue.then(save);
  }

  function buildItem({ key, messageKey }) {
    const wrapper = document.createElement('label');
    wrapper.className = 'item';

    const box = document.createElement('input');
    box.type = 'checkbox';
    box.id = CHECKBOX_ID_PREFIX + key;
    box.name = key;
    box.disabled = true;
    box.addEventListener('change', () => {
      handleChange(key, box.checked);
    });

    const text = document.createElement('span');
    text.textContent = t(messageKey);

    wrapper.append(box, text);
    return wrapper;
  }

  async function init() {
    localizeStaticText();
    GPC.ITEMS.forEach((item) => form.append(buildItem(item)));
    try {
      const result = await storageGet(GPC.STORAGE_KEY);
      current = GPC.normalize(result ? result[GPC.STORAGE_KEY] : undefined);
      desired = current;
      render(current);
      setDisabled(false);
    } catch (err) {
      showError(t('errorLoad', [errorText(err)]));
    }
  }

  init().catch((err) => showError(t('errorInit', [errorText(err)])));
})();
