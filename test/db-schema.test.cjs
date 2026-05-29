const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const schemaPath = path.join(root, 'src/lib/db/schema.sql');
const seedPath = path.join(root, 'src/lib/db/seed.sql');

function readSchema() {
  return fs.readFileSync(schemaPath, 'utf8');
}

function readSeed() {
  return fs.readFileSync(seedPath, 'utf8');
}

test('schema.sql defines required core tables', () => {
  const schema = readSchema();

  for (const table of ['users', 'sms_codes', 'membership_plans', 'orders', 'dramas', 'episodes']) {
    assert.match(schema, new RegExp(`CREATE TABLE\\s+${table}\\b`, 'i'));
  }
});

test('schema.sql uses shared id and timestamp conventions', () => {
  const schema = readSchema();

  assert.match(schema, /id\s+CHAR\(36\)\s+PRIMARY KEY/i);
  assert.match(schema, /created_at\s+DATETIME\(3\)\s+NOT NULL/i);
  assert.match(schema, /updated_at\s+DATETIME\(3\)\s+NOT NULL/i);
});

test('schema.sql defines required unique keys', () => {
  const schema = readSchema();

  assert.match(schema, /UNIQUE KEY\s+uk_users_phone\s*\(\s*phone\s*\)/i);
  assert.match(schema, /UNIQUE KEY\s+uk_orders_order_no\s*\(\s*order_no\s*\)/i);
  assert.match(schema, /UNIQUE KEY\s+uk_episodes_drama_episode\s*\(\s*drama_id\s*,\s*episode_no\s*\)/i);
});

test('seed.sql contains default membership plans', () => {
  const seed = readSeed();

  assert.match(seed, /30d/);
  assert.match(seed, /30天会员/);
  assert.match(seed, /2990/);
  assert.match(seed, /365d/);
  assert.match(seed, /365天会员/);
  assert.match(seed, /19900/);
});
