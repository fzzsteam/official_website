const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('package.json uses Next.js tooling scripts and dependency', () => {
  const pkg = readJson('package.json');

  assert.equal(pkg.scripts.dev, 'next dev');
  assert.equal(pkg.scripts.build, 'next build');
  assert.equal(pkg.scripts.start, 'node .next/standalone/server.js');
  assert.equal(pkg.scripts.test, 'node --test test/*.test.cjs');
  assert.ok(pkg.dependencies.next, 'next dependency should exist');
});

test('next.config.mjs enables standalone output', () => {
  const nextConfig = readText('next.config.mjs');

  assert.match(nextConfig, /output:\s*['"]standalone['"]/);
});

test('vite.config.ts has been removed', () => {
  assert.equal(fs.existsSync(path.join(root, 'vite.config.ts')), false);
});
