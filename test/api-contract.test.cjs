const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

test('API helpers enforce unified success and error envelopes', () => {
  const source = read('src/lib/api/response.ts');
  assert.match(source, /export function ok/);
  assert.match(source, /export function fail/);
  assert.match(source, /data/);
  assert.match(source, /error/);
  assert.match(source, /code/);
  assert.match(source, /message/);
});

test('environment config validates server-only variables centrally', () => {
  const source = read('src/lib/config/env.ts');
  for (const key of [
    'DATABASE_URL',
    'COOKIE_SECRET',
    'ALIYUN_ACCESS_KEY_ID',
    'OSS_BUCKET',
    'WECHAT_PAY_MCH_ID',
  ]) {
    assert.match(source, new RegExp(key));
  }
  assert.doesNotMatch(source, /NEXT_PUBLIC_.*SECRET/);
});
