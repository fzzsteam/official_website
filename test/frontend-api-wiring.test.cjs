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
