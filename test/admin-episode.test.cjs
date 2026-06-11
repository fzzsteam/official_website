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

test('admin episode service returns signed video preview URLs', () => {
  const media = read('src/lib/admin/media-url.ts');
  const episode = read('src/lib/admin/episode-admin-service.ts');

  assert.match(media, /mapAdminEpisodeMedia/);
  assert.match(episode, /videoPreviewUrl/);
  assert.match(episode, /videoUrl/);
  assert.match(episode, /mapAdminEpisodeMedia/);
});

test('episode status API publishes and unpublishes independently', () => {
  const route = read('app/api/admin/dramas/[id]/episodes/[episodeId]/status/route.ts');
  const service = read('src/lib/admin/episode-admin-service.ts');

  assert.match(route, /requireAdminSession/);
  assert.match(route, /assertApprovedOrganization/);
  assert.match(route, /updateAdminEpisodeStatus/);
  assert.match(service, /episodeStatusSchema/);
  assert.match(service, /publishedAt:\s*data\.status === 'published'/);
  assert.match(service, /accessLevel:\s*'member'/);
});
