const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

test('episode admin service checks drama ownership and upload paths', () => {
  const source = read('src/lib/admin/episode-admin-service.ts');

  assert.match(source, /listAdminEpisodes/);
  assert.match(source, /upsertAdminEpisode/);
  assert.match(source, /deleteAdminEpisode/);
  assert.match(source, /assertAllowedUploadPath/);
  assert.match(source, /assertDramaWritable/);
});

test('episode admin routes require approved admin session', () => {
  const source = read('app/api/admin/dramas/[id]/episodes/route.ts');

  assert.match(source, /requireAdminSession/);
  assert.match(source, /assertApprovedOrganization/);
  assert.match(source, /upsertAdminEpisode/);
});
