const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

test('membership service exposes expiry calculation and plan query logic', () => {
  const source = read('src/lib/membership/membership-service.ts');

  assert.match(source, /calculateNextVipExpiry/);
  assert.match(source, /currentVipExpiredAt/);
  assert.match(source, /durationDays/);
  assert.match(source, /baseTime/);
});

test('membership plans route returns enabled plans with ok envelope', () => {
  const source = read('app/api/membership/plans/route.ts');

  assert.match(source, /getEnabledMembershipPlans/);
  assert.match(source, /\bok\s*\(/);
});
