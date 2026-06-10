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
    'COOKIE_SECRET',
    'ALIYUN_ACCESS_KEY_ID',
    'OSS_BUCKET',
    'WECHAT_PAY_MCH_ID',
  ]) {
    assert.match(source, new RegExp(key));
  }
  assert.doesNotMatch(source, /NEXT_PUBLIC_.*SECRET/);
});

test('admin API routes use unified success and error envelopes', () => {
  const adminRouteFiles = [
    'app/api/admin/auth/login/route.ts',
    'app/api/admin/auth/logout/route.ts',
    'app/api/admin/auth/me/route.ts',
    'app/api/admin/register/route.ts',
    'app/api/admin/organizations/route.ts',
    'app/api/admin/organizations/[id]/route.ts',
    'app/api/admin/organizations/[id]/review/route.ts',
    'app/api/admin/uploads/policy/route.ts',
    'app/api/admin/dramas/route.ts',
    'app/api/admin/dramas/[id]/route.ts',
    'app/api/admin/dramas/[id]/submit/route.ts',
    'app/api/admin/dramas/[id]/review/route.ts',
    'app/api/admin/dramas/[id]/episodes/route.ts',
    'app/api/admin/dramas/[id]/episodes/[episodeId]/route.ts',
  ];

  for (const file of adminRouteFiles) {
    const source = read(file);
    assert.match(source, /\bok\s*\(/, `${file} should call ok()`);
    assert.match(source, /\bfail\s*\(/, `${file} should call fail()`);
  }
});
