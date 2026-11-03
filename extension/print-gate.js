// Runs in the page's MAIN world at document_start (see manifest.json).
// Delays Gmail's automatic window.print() until content.js marks <html> ready,
// so the user's display settings are applied before printing.
// Extension APIs and the GPC namespace exist only in the isolated world,
// so this file must not use them.
(() => {
  // Must match GPC.READY_ATTR in settings.js (checked by test/print-gate.test.js).
  const READY_ATTR = 'data-gpc-ready';
  const TIMEOUT_MS = 1500;
  const WRAPPED = Symbol.for('gpc.printGate.wrapped');

  const originalPrint = window.print;
  if (typeof originalPrint !== 'function' || originalPrint[WRAPPED]) return;

  const root = document.documentElement;
  const isReady = () => root.hasAttribute(READY_ATTR);

  let pending = false;

  const waitThenPrint = () => {
    pending = true;
    let observer = null;
    let timer = 0;

    const finish = () => {
      if (!pending) return;
      pending = false;
      if (observer) observer.disconnect();
      clearTimeout(timer);
      originalPrint.call(window);
    };

    observer = new MutationObserver(() => {
      if (isReady()) finish();
    });
    observer.observe(root, { attributes: true, attributeFilter: [READY_ATTR] });
    timer = setTimeout(finish, TIMEOUT_MS);
    // The attribute may have been set between the check and observe().
    if (isReady()) finish();
  };

  function gatedPrint() {
    if (isReady()) {
      originalPrint.call(window);
      return;
    }
    if (pending) return; // collapse repeated calls while waiting
    waitThenPrint();
  }

  Object.defineProperty(gatedPrint, WRAPPED, { value: true });
  window.print = gatedPrint;
})();
