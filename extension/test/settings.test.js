import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../settings.js';

const { GPC } = globalThis;

test('every item is hidden by default', () => {
  assert.deepEqual(Object.values(GPC.DEFAULT_SHOW), [false, false, false, false, false]);
  assert.deepEqual(GPC.showClasses(undefined), []);
});

test('normalize keeps booleans and drops invalid or unknown values', () => {
  const result = GPC.normalize({ sender: true, date: 'yes', evil: true });
  assert.equal(result.sender, true);
  assert.equal(result.date, false);
  assert.equal('evil' in result, false);
});

test('showClasses returns prefixed classes for shown items only', () => {
  assert.deepEqual(GPC.showClasses({ subject: true, recipients: true }), [
    'gpc-show-subject',
    'gpc-show-recipients',
  ]);
});

import { readFileSync, readdirSync } from 'node:fs';

const LOCALES_DIR = new URL('../_locales/', import.meta.url);
const SUBSTITUTED_KEYS = ['errorSave', 'errorLoad', 'errorInit'];

function readMessages(locale) {
  return JSON.parse(readFileSync(new URL(`${locale}/messages.json`, LOCALES_DIR), 'utf8'));
}

test('ja and en locales exist and default_locale is en', () => {
  const locales = readdirSync(LOCALES_DIR).sort();
  assert.deepEqual(locales, ['en', 'ja']);
  const manifest = JSON.parse(readFileSync(new URL('../manifest.json', import.meta.url), 'utf8'));
  assert.equal(manifest.default_locale, 'en');
});

for (const locale of ['en', 'ja']) {
  test(`${locale}: every message key has a non-empty message and no extra keys`, () => {
    const messages = readMessages(locale);
    assert.deepEqual(Object.keys(messages).sort(), [...GPC.MESSAGE_KEYS].sort());
    for (const key of GPC.MESSAGE_KEYS) {
      assert.equal(typeof messages[key].message, 'string', key);
      assert.notEqual(messages[key].message.trim(), '', key);
    }
  });

  test(`${locale}: error messages declare exactly one substitution placeholder`, () => {
    const messages = readMessages(locale);
    for (const key of SUBSTITUTED_KEYS) {
      const { message, placeholders } = messages[key];
      assert.ok(placeholders && Object.keys(placeholders).length === 1, key);
      const [name] = Object.keys(placeholders);
      assert.equal(placeholders[name].content, '$1', key);
      assert.ok(message.includes(`$${name.toUpperCase()}$`), key);
    }
  });
}
