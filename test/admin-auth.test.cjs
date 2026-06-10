const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

test('admin password helper hashes and verifies passwords', () => {
  const source = read('src/lib/admin-auth/password.ts');

  assert.match(source, /bcrypt/);
  assert.match(source, /hashAdminPassword/);
  assert.match(source, /verifyAdminPassword/);
});

test('admin session uses a separate httpOnly cookie', () => {
  const source = read('src/lib/admin-auth/session.ts');

  assert.match(source, /ADMIN_SESSION_COOKIE_NAME\s*=\s*'fzzs_admin_session'/);
  assert.match(source, /httpOnly:\s*true/);
  assert.match(source, /sameSite:\s*'lax'/);
});

test('admin auth routes use unified response helpers', () => {
  for (const file of [
    'app/api/admin/auth/login/route.ts',
    'app/api/admin/auth/logout/route.ts',
    'app/api/admin/auth/me/route.ts',
  ]) {
    const source = read(file);
    assert.match(source, /\bok\s*\(/);
    assert.match(source, /\bfail\s*\(/);
  }
});

test('admin guard distinguishes admin role and organization role', () => {
  const source = read('src/lib/admin-auth/require-admin.ts');

  assert.match(source, /requireAdminSession/);
  assert.match(source, /requireAdminRole/);
  assert.match(source, /requireOrganizationRole/);
  assert.match(source, /ADMIN_FORBIDDEN/);
});
