const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

test('drama admin service implements ownership and review actions', () => {
  const source = read('src/lib/admin/drama-admin-service.ts');

  assert.match(source, /listAdminDramas/);
  assert.match(source, /createAdminDrama/);
  assert.match(source, /updateAdminDrama/);
  assert.match(source, /submitDramaForReview/);
  assert.match(source, /reviewDrama/);
  assert.match(source, /assertAllowedUploadPath/);
  assert.match(source, /organizationId:\s*adminUser\.organizationId/);
});

test('drama review API is admin-only', () => {
  const source = read('app/api/admin/dramas/[id]/review/route.ts');

  assert.match(source, /requireAdminRole/);
  assert.match(source, /reviewDrama/);
});

test('drama submit API requires an approved organization or admin', () => {
  const source = read('app/api/admin/dramas/[id]/submit/route.ts');

  assert.match(source, /requireAdminSession/);
  assert.match(source, /assertApprovedOrganization/);
  assert.match(source, /submitDramaForReview/);
});

test('admin drama service maps media paths to signed admin URLs', () => {
  const media = read('src/lib/admin/media-url.ts');
  const drama = read('src/lib/admin/drama-admin-service.ts');

  assert.match(media, /signAdminMediaPath/);
  assert.match(media, /mapAdminDramaMedia/);
  assert.match(media, /signOssPath/);
  assert.match(drama, /mapAdminDramaMedia/);
  assert.match(drama, /posterUrl/);
  assert.match(drama, /coverUrl/);
  assert.doesNotMatch(drama, /trailerUrl/);
});

test('drama admin service auto-generates slug and persists fixed genres', () => {
  const genres = read('src/lib/admin/drama-genres.ts');
  const drama = read('src/lib/admin/drama-admin-service.ts');

  assert.match(genres, /DRAMA_GENRES/);
  assert.match(genres, /urban/);
  assert.match(genres, /romance/);
  assert.match(genres, /validateDramaGenreCodes/);
  assert.match(genres, /replaceDramaGenres/);
  assert.match(drama, /generateUniqueDramaSlug/);
  assert.match(drama, /replaceDramaGenres/);
  assert.match(drama, /const createdDrama = await tx\.drama\.findFirst/);
  assert.match(drama, /const updatedDrama = await tx\.drama\.findFirst/);
  assert.doesNotMatch(drama, /slug:\s*z\.string\(\)\.min\(1\)/);
});

test('drama release API updates release status separately from detail save', () => {
  const route = read('app/api/admin/dramas/[id]/release/route.ts');
  const service = read('src/lib/admin/drama-admin-service.ts');

  assert.match(route, /requireAdminRole/);
  assert.match(route, /updateDramaReleaseStatus/);
  assert.match(service, /updateDramaReleaseStatus/);
  assert.match(service, /reviewStatus !== 'approved'/);
  assert.match(service, /releaseStatus:\s*data\.releaseStatus/);
});
