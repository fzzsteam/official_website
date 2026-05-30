const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

test('tailwind.config.ts exists and defines brand colors', () => {
  const cfg = read('tailwind.config.ts');
  assert.match(cfg, /brand/, 'should define brand color namespace');
  assert.match(cfg, /#C9912A/, 'should include gold color');
  assert.match(cfg, /content.*app.*tsx/, 'should scan app directory');
  assert.match(cfg, /content.*src.*tsx/, 'should scan src directory');
});

test('globals.css includes Tailwind directives', () => {
  const css = read('app/globals.css');
  assert.match(css, /@tailwind base/, 'should include base directive');
  assert.match(css, /@tailwind components/, 'should include components directive');
  assert.match(css, /@tailwind utilities/, 'should include utilities directive');
});

test('postcss.config.js exists', () => {
  assert.ok(
    fs.existsSync(path.join(root, 'postcss.config.js')),
    'postcss.config.js should exist'
  );
});
