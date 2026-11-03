// Content script for Gmail print view (view=pt).
// content.css hides everything by default; this script only adds
// GPC.CLASS_PREFIX + key classes to <html> for items the user chose to show.
// Once the classes are applied (or loading failed), it sets GPC.READY_ATTR on <html>
// so print-gate.js (MAIN world) lets Gmail's automatic window.print() run.
(() => {
  // Used only when settings.js failed to load, so print-gate.js does not wait for its timeout.
  // Must match GPC.READY_ATTR in settings.js.
  const FALLBACK_READY_ATTR = 'data-gpc-ready';

  function markReady(attr) {
    const root = document.documentElement;
    if (root) {
      root.setAttribute(attr, '1');
    }
  }

  const { GPC } = globalThis;
  if (!GPC) {
    console.error('[print-clean-for-gmail] settings.js (GPC) is not loaded');
    markReady(FALLBACK_READY_ATTR);
    return;
  }

  const allClasses = GPC.ITEMS.map(({ key }) => GPC.CLASS_PREFIX + key);

  function applyShow(rawShow) {
    const root = document.documentElement;
    if (!root) {
      return;
    }
    const wanted = new Set(GPC.showClasses(rawShow));
    allClasses.forEach((cls) => {
      root.classList.toggle(cls, wanted.has(cls));
    });
  }

  // async so that a synchronous throw from chrome.storage also ends up in catch.
  (async () => {
    try {
      const result = await chrome.storage.sync.get(GPC.STORAGE_KEY);
      applyShow(result[GPC.STORAGE_KEY]);
    } catch (error) {
      // Keep the CSS defaults (everything hidden) when storage is unavailable.
      console.error('[print-clean-for-gmail] failed to read settings', error);
    } finally {
      markReady(GPC.READY_ATTR);
    }
  })();

  // Re-applies classes only; READY_ATTR stays set from the initial load.
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'sync' || !(GPC.STORAGE_KEY in changes)) {
      return;
    }
    applyShow(changes[GPC.STORAGE_KEY].newValue);
  });
})();
