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

test('Navbar uses Tailwind responsive classes for mobile/desktop', () => {
  const src = read('src/components/episode-detail/Navbar.tsx');
  assert.match(src, /hidden md:flex/, 'nav links should be hidden on mobile with md:flex');
  assert.match(src, /md:hidden/, 'hamburger should be hidden on desktop');
});

test('VideoPlayer uses 9:16 aspect ratio', () => {
  const src = read('src/components/episode-detail/VideoPlayer.tsx');
  assert.doesNotMatch(src, /aspectRatio.*16.*9|16\/9/, 'should not use 16:9 ratio');
  assert.match(src, /aspect-\[9\/16\]/, 'should use 9:16 Tailwind class');
});

test('EpisodeDetailPage has responsive flex layout', () => {
  const src = read('src/components/episode-detail/index.tsx');
  assert.match(src, /flex-col lg:flex-row/, 'should stack on mobile, side-by-side on desktop');
  assert.match(src, /lg:max-w-\[400px\]/, 'video should be max 400px on desktop');
  assert.match(src, /hidden lg:flex/, 'sidebar selector should be hidden on mobile');
  assert.match(src, /lg:hidden/, 'inline selector should be hidden on desktop');
});
