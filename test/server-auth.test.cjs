const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

test('sms code helper stores hashed codes with expiration and consumption tracking', () => {
  const source = read('src/lib/auth/sms-code.ts');

  assert.match(source, /bcrypt/);
  assert.match(source, /expiresAt/);
  assert.match(source, /consumedAt/);
});

test('session helper configures secure httpOnly cookie defaults', () => {
  const source = read('src/lib/auth/session.ts');

  assert.match(source, /httpOnly:\s*true/);
  assert.match(source, /sameSite:\s*'lax'/);
  assert.match(source, /secure:/);
});

test('auth routes use unified ok\/fail response helpers', () => {
  const routeFiles = [
    'app/api/auth/send-code/route.ts',
    'app/api/auth/login/route.ts',
    'app/api/auth/logout/route.ts',
    'app/api/auth/me/route.ts',
  ];

  for (const file of routeFiles) {
    const source = read(file);
    assert.match(source, /\bok\s*\(/);
    assert.match(source, /\bfail\s*\(/);
  }
});
