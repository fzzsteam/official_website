const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

test('organization-owned resources are scoped by organization id', () => {
  const drama = read('src/lib/admin/drama-admin-service.ts');
  const episode = read('src/lib/admin/episode-admin-service.ts');

  assert.match(drama, /organizationId:\s*adminUser\.organizationId/);
  assert.match(episode, /organizationId:\s*adminUser\.organizationId/);
});

test('admin routes do not use frontend session helpers', () => {
  for (const file of [
    'src/lib/admin-auth/session.ts',
    'app/api/admin/auth/me/route.ts',
    'app/api/admin/dramas/route.ts',
  ]) {
    const source = read(file);
    assert.doesNotMatch(source, /@\/lib\/auth\/session/);
  }
});

test('upload path validation runs before storing paths', () => {
  const drama = read('src/lib/admin/drama-admin-service.ts');
  const episode = read('src/lib/admin/episode-admin-service.ts');

  assert.match(drama, /assertAllowedUploadPath\(adminUser,\s*data\.coverPath\)/);
  assert.match(episode, /assertAllowedUploadPath\(adminUser,\s*data\.videoPath\)/);
});
