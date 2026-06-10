const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

test('upload service generates role-scoped object prefixes', () => {
  const source = read('src/lib/admin-upload/upload-service.ts');

  assert.match(source, /getAllowedUploadPrefix/);
  assert.match(source, /admin\/\$\{adminUser\.id\}/);
  assert.match(source, /organizations\/\$\{adminUser\.organizationId\}/);
  assert.match(source, /assertAllowedUploadPath/);
});

test('upload policy route requires admin session', () => {
  const source = read('app/api/admin/uploads/policy/route.ts');

  assert.match(source, /requireAdminSession/);
  assert.match(source, /createUploadPolicy/);
});
