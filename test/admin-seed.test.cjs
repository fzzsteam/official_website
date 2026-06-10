const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

test('seed creates the default admin account with a hashed password', () => {
  const source = read('prisma/seed.ts');

  assert.match(source, /DEFAULT_ADMIN_ID/);
  assert.match(source, /adminUser\.upsert/);
  assert.match(source, /hashAdminPassword/);
  assert.doesNotMatch(source, /passwordHash:\s*['"][^'"]+['"]/);
});

test('seed assigns existing dramas to the default admin', () => {
  const source = read('prisma/seed.ts');

  assert.match(source, /ownerType:\s*'admin'/);
  assert.match(source, /ownerAdminUserId:\s*DEFAULT_ADMIN_ID/);
  assert.match(source, /reviewStatus:\s*'approved'/);
});
