import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import '../settings.js';

const { GPC } = globalThis;
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const manifest = JSON.parse(read('manifest.json'));

test('READY_ATTR is a data attribute', () => {
  assert.match(GPC.READY_ATTR, /^data-[a-z-]+$/);
});

test('manifest runs print-gate.js in the MAIN world on the same pages at document_start', () => {
  const [isolated, ...rest] = manifest.content_scripts;
  const gate = rest.find((entry) => entry.js?.includes('print-gate.js'));
  assert.ok(gate, 'print-gate entry exists');
  assert.equal(gate.world, 'MAIN');
  assert.equal(gate.run_at, 'document_start');
  assert.deepEqual(gate.js, ['print-gate.js']);
  assert.deepEqual(gate.matches, isolated.matches);
  assert.deepEqual(gate.include_globs, isolated.include_globs);
  assert.equal(gate.css, undefined);
  assert.equal(isolated.world ?? 'ISOLATED', 'ISOLATED');
});

test('no new permissions are requested', () => {
  assert.deepEqual(manifest.permissions, ['storage']);
  assert.equal(manifest.host_permissions, undefined);
  assert.equal(manifest.web_accessible_resources, undefined);
});

test('print-gate.js uses the same ready attribute and leaks no globals by name', () => {
  const src = read('print-gate.js');
  assert.ok(src.includes(`'${GPC.READY_ATTR}'`), 'contains READY_ATTR literal');
  assert.ok(!/chrome\./.test(src), 'MAIN world script must not touch chrome.* APIs');
  assert.ok(!/globalThis\.GPC|window\.GPC/.test(src), 'must not rely on GPC (isolated world only)');
});

test('content.js marks the page ready via GPC.READY_ATTR (fallback literal must match)', () => {
  const src = read('content.js');
  assert.ok(src.includes('GPC.READY_ATTR'), 'uses GPC.READY_ATTR');
  const literals = [...src.matchAll(/'(data-[a-z-]+)'/g)].map((m) => m[1]);
  for (const literal of literals) assert.equal(literal, GPC.READY_ATTR);
});

test('manifest declares minimum_chrome_version >= 111 for world: MAIN', () => {
  assert.ok(Number(manifest.minimum_chrome_version) >= 111);
});
