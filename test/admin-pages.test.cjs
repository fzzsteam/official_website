const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

test('organization admin pages wire list, detail, and review APIs', () => {
  const list = read('app/admin/organizations/page.tsx');
  const detail = read('app/admin/organizations/[id]/page.tsx');

  assert.match(list, /\/api\/admin\/organizations/);
  assert.match(list, /\/api\/admin\/organizations\/\$\{organization\.id\}\/review/);
  assert.match(list, /\/api\/admin\/organizations\/\$\{organizationId\}\/reset-password/);
  assert.match(list, /重置密码/);
  assert.match(list, /密码已重置为手机号后 8 位/);
  assert.match(detail, /redirect\('\/admin\/organizations'\)/);
});

test('drama admin pages wire CRUD, submit, review, and episodes APIs', () => {
  const list = read('app/admin/dramas/page.tsx');
  const edit = read('app/admin/dramas/[id]/page.tsx');
  const episodes = read('app/admin/dramas/[id]/episodes/page.tsx');

  assert.match(list, /\/api\/admin\/dramas/);
  assert.match(list, /\/submit/);
  assert.match(list, /\/review/);
  assert.match(edit, /redirect\('\/admin\/dramas'\)/);
  assert.match(episodes, /\/episodes/);
});
