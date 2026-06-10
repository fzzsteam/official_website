const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

test('admin UI uses the existing brand theme and shadcn-style primitives', () => {
  const layout = read('src/components/admin/AdminLayout.tsx');
  const badge = read('src/components/admin/StatusBadge.tsx');

  assert.match(layout, /brand-bg/);
  assert.match(layout, /brand-card/);
  assert.match(layout, /brand-gold/);
  assert.match(badge, /rounded-md/);
});

test('admin login and register pages wire admin APIs', () => {
  const login = read('app/admin/login/page.tsx');
  const register = read('app/admin/register/page.tsx');

  assert.match(login, /\/api\/admin\/auth\/login/);
  assert.match(register, /\/api\/admin\/register/);
});

test('admin upload field requests upload policy API', () => {
  const source = read('src/components/admin/UploadField.tsx');

  assert.match(source, /\/api\/admin\/uploads\/policy/);
  assert.match(source, /XMLHttpRequest|fetch/);
});
