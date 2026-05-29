const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function readPackageJson() {
  return JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
}

function readNextConfig() {
  return fs.readFileSync(path.join(root, 'next.config.mjs'), 'utf8');
}

test('package.json scripts use Next.js tooling', () => {
  const packageJson = readPackageJson();

  assert.equal(packageJson.scripts.dev, 'next dev');
  assert.equal(packageJson.scripts.build, 'next build');
  assert.equal(packageJson.scripts.start, 'node .next/standalone/server.js');
  assert.equal(packageJson.scripts.test, 'node --test test/*.test.cjs');
});

test('package.json includes next dependency', () => {
  const packageJson = readPackageJson();

  assert.ok(packageJson.dependencies.next);
});

test('next.config.mjs uses standalone output', () => {
  const nextConfig = readNextConfig();

  assert.match(nextConfig, /output:\s*['"]standalone['"]/);
});

test('vite.config.ts has been removed', () => {
  assert.equal(fs.existsSync(path.join(root, 'vite.config.ts')), false);
});
