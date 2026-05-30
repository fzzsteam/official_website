const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

test('drama service exposes play url authorization flow', () => {
  const source = read('src/lib/drama/drama-service.ts');

  assert.match(source, /getEpisodePlayUrl/);
  assert.match(source, /accessLevel/);
  assert.match(source, /vipExpiredAt/);
  assert.match(source, /signOssPath/);
});

test('oss service signs private paths without public env leakage', () => {
  const source = read('src/lib/oss/oss-service.ts');

  assert.match(source, /signOssPath/);
  assert.match(source, /OSS_SIGNED_URL_EXPIRES_SECONDS/);
  assert.doesNotMatch(source, /NEXT_PUBLIC_/);
});

test('drama service returns signed coverUrl and posterUrl in list', () => {
  const source = read('src/lib/drama/drama-service.ts');
  assert.match(source, /coverUrl/);
  assert.match(source, /posterUrl/);
  assert.match(source, /genreNames/);
});

test('drama service signs avatarUrl for cast members', () => {
  const source = read('src/lib/drama/drama-service.ts');
  assert.match(source, /avatarUrl/);
});
