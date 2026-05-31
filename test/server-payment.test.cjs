const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

test('wechat payment service exposes native order creation and idempotent callback entrypoints', () => {
  const source = read('src/lib/payment/wechat-service.ts');

  assert.match(source, /createWechatNativeOrder/);
  assert.match(source, /handleWechatPaymentNotification/);
  assert.match(source, /requestWechatNativeCodeUrl/);
  assert.match(source, /https:\/\/api\.mch\.weixin\.qq\.com\/v3\/pay\/transactions\/native/);
  assert.match(source, /WECHATPAY2-SHA256-RSA2048/);
  assert.match(source, /Wechatpay-Serial/);
  assert.match(source, /decryptWechatResource/);
  assert.match(source, /verifyWechatpaySignature/);
  assert.doesNotMatch(source, /weixin:\/\/wxpay\/bizpayurl\?/);
  assert.match(source, /calculateNextVipExpiry/);
  assert.match(source, /pending/);
  assert.match(source, /paid/);
  assert.match(source, /vip_expired_at/);
});

test('wechat payment env schema supports public key mode', () => {
  const source = read('src/lib/config/env.ts');

  assert.match(source, /WECHAT_PAY_PUBLIC_KEY_ID/);
  assert.match(source, /WECHAT_PAY_PUBLIC_KEY_BASE64/);
  assert.match(source, /WECHAT_PAY_PRIVATE_KEY_BASE64/);
  assert.match(source, /WECHAT_PAY_CERT_SERIAL_NO/);
  assert.doesNotMatch(source, /WECHAT_PAY_PRIVATE_KEY:\s*z/);
  assert.doesNotMatch(source, /WECHAT_PAY_PUBLIC_KEY:\s*z/);
});

test('wechat payment service decodes base64 encoded pem env values', () => {
  const source = read('src/lib/payment/wechat-service.ts');

  assert.match(source, /WECHAT_PAY_PRIVATE_KEY_BASE64/);
  assert.match(source, /WECHAT_PAY_PUBLIC_KEY_BASE64/);
  assert.match(source, /Buffer\.from\([^)]*base64[^)]*\)/s);
  assert.match(source, /toString\('utf8'\)/);
});

test('wechat payment service preserves upstream failure status and safe response text', () => {
  const source = read('src/lib/payment/wechat-service.ts');

  assert.match(source, /WechatPayRequestError/);
  assert.match(source, /response\.status/);
  assert.match(source, /responseText/);
  assert.match(source, /WECHAT_NATIVE_ORDER_REQUEST_FAILED/);
});

test('wechat payment routes use unified ok\/fail response helpers', () => {
  const routeFiles = [
    'app/api/payments/wechat/native/route.ts',
    'app/api/payments/wechat/status/route.ts',
    'app/api/payments/wechat/notify/route.ts',
  ];

  for (const file of routeFiles) {
    const source = read(file);
    assert.match(source, /\bok\s*\(/);
    assert.match(source, /\bfail\s*\(/);
  }
});
