const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const schemaPath = path.join(root, 'prisma/schema.prisma');
const seedPath = path.join(root, 'prisma/seed.ts');
const migrationPath = path.join(root, 'prisma/migrations/0001_init/migration.sql');

function readSchema() {
  return fs.readFileSync(schemaPath, 'utf8');
}

function readSeed() {
  return fs.readFileSync(seedPath, 'utf8');
}

function readMigration() {
  return fs.readFileSync(migrationPath, 'utf8');
}

test('schema.prisma defines required core models', () => {
  const schema = readSchema();

  for (const model of ['User', 'SmsCode', 'MembershipPlan', 'Order', 'Drama', 'Episode']) {
    assert.match(schema, new RegExp(`model\\s+${model}\\s+\\{`));
  }
});

test('schema.prisma uses CHAR(36) for primary keys', () => {
  const schema = readSchema();
  assert.match(schema, /@db\.Char\(36\)/);
  assert.match(schema, /@id/);
});

test('schema.prisma defines unique constraints on core fields', () => {
  const schema = readSchema();
  const migration = readMigration();
  assert.match(schema, /phone.*@unique/s);
  assert.match(migration, /uk_orders_order_no/);
  assert.match(schema, /uk_episodes_drama_episode/);
});

test('migration sql defines tables with IF NOT EXISTS', () => {
  const migration = readMigration();
  assert.match(migration, /CREATE TABLE IF NOT EXISTS `users`/i);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS `orders`/i);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS `episodes`/i);
});

test('seed.ts contains default membership plans', () => {
  const seed = readSeed();

  assert.match(seed, /30d/);
  assert.match(seed, /30天会员/);
  assert.match(seed, /2990/);
  assert.match(seed, /365d/);
  assert.match(seed, /365天会员/);
  assert.match(seed, /19900/);
});
