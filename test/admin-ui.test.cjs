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

test('admin shared drawer and toolbar components exist', () => {
  const drawer = read('src/components/admin/AdminDrawer.tsx');
  const toolbar = read('src/components/admin/AdminListToolbar.tsx');

  assert.match(drawer, /export function AdminDrawer/);
  assert.match(drawer, /fixed inset-y-0 right-0/);
  assert.match(drawer, /role="dialog"/);
  assert.match(toolbar, /export function AdminListToolbar/);
  assert.match(toolbar, /filterGroups/);
});

test('admin media upload and preview components support rich media states', () => {
  const upload = read('src/components/admin/AdminMediaUpload.tsx');
  const preview = read('src/components/admin/AdminMediaPreview.tsx');

  assert.match(upload, /\/api\/admin\/uploads\/policy/);
  assert.match(upload, /uploading/);
  assert.match(upload, /onChange\(objectKey\)/);
  assert.match(upload, /onClear/);
  assert.match(preview, /type === 'video'/);
  assert.match(preview, /<video/);
  assert.match(preview, /<img/);
});

test('status badge labels include review and release statuses', () => {
  const badge = read('src/components/admin/StatusBadge.tsx');

  assert.match(badge, /upcoming:\s*'待上架'/);
  assert.match(badge, /released:\s*'已上架'/);
  assert.match(badge, /submitted:\s*'待审核'/);
});

test('admin layout uses dark sidebar and light content workspace', () => {
  const layout = read('src/components/admin/AdminLayout.tsx');
  const sidebar = read('src/components/admin/AdminSidebar.tsx');

  assert.match(layout, /bg-slate-100/);
  assert.match(layout, /text-slate-950/);
  assert.match(sidebar, /bg-brand-card/);
});

test('admin login page exposes organization registration entry', () => {
  const login = read('app/admin/login/page.tsx');

  assert.match(login, /机构注册/);
  assert.match(login, /href="\/admin\/register"/);
});
