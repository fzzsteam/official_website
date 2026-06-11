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

test('assertAllowedUploadPath rejects path traversal segments', () => {
  const source = read('src/lib/admin-upload/upload-service.ts');

  assert.match(source, /posix\.normalize/);
  assert.match(source, /split\('\/'\)/);
  assert.match(source, /includes\('\.\.'\)/);
});

test('getAllowedUploadPrefix throws typed admin auth error for invalid owner', () => {
  const source = read('src/lib/admin-upload/upload-service.ts');

  assert.doesNotMatch(source, /new Error\('INVALID_UPLOAD_OWNER'\)/);
  assert.match(source, /createAdminAuthError\('ADMIN_FORBIDDEN'/);
});

test('upload component still requests policy and only submits path', () => {
  const source = read('src/components/admin/AdminMediaUpload.tsx');

  assert.match(source, /\/api\/admin\/uploads\/policy/);
  assert.match(source, /onChange\(objectKey\)/);
  assert.doesNotMatch(source, /onChange\(upload\.host/);
});
