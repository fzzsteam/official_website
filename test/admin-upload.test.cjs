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

  assert.match(source, /getCurrentAdminUser/);
  assert.match(source, /ADMIN_AUTH_REQUIRED/);
  assert.match(source, /createUploadPolicy/);
});

test('upload policy route allows anonymous registration license upload only', () => {
  const route = read('app/api/admin/uploads/policy/route.ts');
  const service = read('src/lib/admin-upload/upload-service.ts');

  assert.match(route, /input\.fileKind === 'license'/);
  assert.match(route, /createRegistrationUploadPolicy/);
  assert.match(route, /请先登录后台/);
  assert.match(service, /organization-registration\/\$\{fileKind\}/);
  assert.match(service, /assertRegistrationUploadPath/);
});

test('register page requests registration-scoped license upload policy', () => {
  const register = read('app/admin/register/page.tsx');
  const upload = read('src/components/admin/AdminMediaUpload.tsx');
  const route = read('app/api/admin/uploads/policy/route.ts');

  assert.match(register, /uploadScope="registration"/);
  assert.match(upload, /uploadScope/);
  assert.match(upload, /JSON\.stringify\(\{ fileKind, uploadScope \}\)/);
  assert.match(route, /uploadScope:\s*z\.enum\(\['admin', 'registration'\]\)\.optional\(\)\.default\('admin'\)/);
  assert.match(route, /input\.uploadScope === 'registration'/);
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
  assert.doesNotMatch(source, /break-all rounded-md bg-slate-50/);
  assert.doesNotMatch(source, /选择文件/);
  assert.doesNotMatch(source, /重新选择/);
  assert.doesNotMatch(source, /px-3 py-2 text-sm text-slate-600/);
  assert.match(source, /previewUrl/);
  assert.match(source, /previewSize/);
  assert.match(source, /aspect-\[9\/16\]/);
  assert.match(source, /aspect-video/);
  assert.match(source, /aspect-\[4\/3\]/);
  assert.match(source, /border-dashed/);
  assert.match(source, /htmlFor=\{inputId\}/);
  assert.match(source, /上传中\.\.\./);
  assert.match(source, /hover:border-slate-400/);
  assert.match(source, /hover:bg-slate-100/);
  assert.doesNotMatch(source, /hover:bg-brand-gold\/5/);
});

test('upload component scopes overlay and controls to the preview frame', () => {
  const source = read('src/components/admin/AdminMediaUpload.tsx');

  assert.match(source, /<div className=\{`relative w-full \$\{previewSizeClassName\}`\}>/);
  assert.match(source, /className="flex h-full w-full cursor-pointer/);
  assert.match(source, /className="block h-full w-full cursor-pointer/);
  assert.match(source, /absolute inset-0/);
  assert.doesNotMatch(source, /<div className="relative">/);
});
