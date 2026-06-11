const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

test('LoginModal wires send-code and login APIs', () => {
  const source = read('src/components/LoginModal.tsx');

  assert.match(source, /\/api\/auth\/send-code/);
  assert.match(source, /\/api\/auth\/login/);
});

test('VipModal loads membership plans from API', () => {
  const source = read('src/components/VipModal.tsx');

  assert.match(source, /\/api\/membership\/plans/);
});

test('PaymentModal wires native order creation and payment status polling', () => {
  const source = read('src/components/PaymentModal.tsx');

  assert.match(source, /\/api\/payments\/wechat\/native/);
  assert.match(source, /\/api\/payments\/wechat\/status/);
});

test('VideoPlayer wiring fetches episode play url', () => {
  const pageSource = read('src/components/episode-detail/index.tsx');
  const playerSource = read('src/components/episode-detail/VideoPlayer.tsx');
  const combined = `${pageSource}\n${playerSource}`;

  assert.match(combined, /play-url/);
});

test('HomePage fetches drama list from API instead of hardcoded data', () => {
  const source = read('src/components/HomePage.tsx');
  assert.match(source, /\/api\/dramas/, 'should fetch from /api/dramas');
  assert.doesNotMatch(source, /const heroDramas\s*=\s*\[/, 'should not have hardcoded heroDramas array');
});

test('App fetches drama detail for cast and recommendations', () => {
  const source = read('src/App.tsx');
  assert.match(source, /\/api\/dramas/, 'App should fetch from /api/dramas');
  assert.doesNotMatch(source, /mockCast|mockRecommendations/, 'App should not use mock data');
});

test('admin pages use admin API helper and backend routes', () => {
  const login = read('app/admin/login/page.tsx');
  const dramas = read('app/admin/dramas/page.tsx');
  const dramaNew = read('app/admin/dramas/new/page.tsx');
  const dramaDetail = read('app/admin/dramas/[id]/page.tsx');

  assert.match(login, /adminApi/);
  assert.match(dramas, /\/api\/admin\/dramas/);
  assert.match(dramas, /\/release/);
  assert.match(dramaNew, /redirect\('\/admin\/dramas'\)/);
  assert.match(dramaDetail, /redirect\('\/admin\/dramas'\)/);
});
