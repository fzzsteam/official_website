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

test('schema.prisma defines admin backend models and ownership fields', () => {
  const schema = readSchema();

  assert.match(schema, /model\s+AdminUser\s+\{/);
  assert.match(schema, /@@map\("admin_users"\)/);
  assert.match(schema, /model\s+Organization\s+\{/);
  assert.match(schema, /@@map\("organizations"\)/);
  assert.match(schema, /ownerType\s+String\s+@default\("admin"\)\s+@map\("owner_type"\)/);
  assert.match(schema, /reviewStatus\s+String\s+@default\("draft"\)\s+@map\("review_status"\)/);
});

test('admin migration creates backend tables and indexes', () => {
  const migration = fs.readFileSync(path.join(root, 'prisma/migrations/0002_admin_backend/migration.sql'), 'utf8');

  assert.match(migration, /CREATE TABLE IF NOT EXISTS `admin_users`/i);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS `organizations`/i);
  assert.match(migration, /ALTER TABLE `dramas` ADD COLUMN `owner_type`/i);
  assert.match(migration, /uk_admin_users_phone/i);
  assert.match(migration, /uk_organizations_credit_code/i);
});
