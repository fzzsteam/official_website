const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const { createApp } = require('../server/app');

test('GET /api/site-config returns signed asset metadata', async () => {
  const app = createApp({
    assetSigner: {
      async sign(resourcePath) {
        return `https://signed.example.com/${resourcePath}?token=test`;
      }
    }
  });

  const response = await request(app).get('/api/site-config');

  assert.equal(response.status, 200);
  assert.equal(response.body.expiresInSeconds, 3600);
  assert.equal(response.body.assets.lizhiTrailer, 'https://signed.example.com/official_site/lizhi/trailer.mp4?token=test');
  assert.equal(response.body.assets.upcomingCover01, 'https://signed.example.com/official_site/upcoming/cover-01.jpg?token=test');
});

test('GET /drama.html renders signed media URLs', async () => {
  const app = createApp({
    assetSigner: {
      async sign(resourcePath) {
        return `https://signed.example.com/${resourcePath}?token=test`;
      }
    }
  });

  const response = await request(app).get('/drama.html');

  assert.equal(response.status, 200);
  assert.match(response.text, /https:\/\/signed\.example\.com\/official_site\/lizhi\/trailer\.mp4\?token=test/);
  assert.doesNotMatch(response.text, /\{\{MEDIA_BASE_URL\}\}/);
});

test('GET / renders signed upcoming cover URLs', async () => {
  const app = createApp({
    assetSigner: {
      async sign(resourcePath) {
        return `https://signed.example.com/${resourcePath}?token=test`;
      }
    }
  });

  const response = await request(app).get('/');

  assert.equal(response.status, 200);
  assert.match(response.text, /https:\/\/signed\.example\.com\/official_site\/upcoming\/cover-01\.jpg\?token=test/);
  assert.match(response.text, /https:\/\/signed\.example\.com\/official_site\/lizhi\/poster1\.jpg\?token=test/);
});
