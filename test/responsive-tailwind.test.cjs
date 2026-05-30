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

test('VideoPlayer uses desktop 16:9 container and preserves portrait videos', () => {
  const src = read('src/components/episode-detail/VideoPlayer.tsx');
  assert.match(src, /aspectRatio:\s*isDesktop\s*\?\s*'16\/9'\s*:\s*\(videoAspect\s*\?\?\s*'9\/16'\)/, 'desktop should default to 16:9 and mobile should fall back to 9:16');
  assert.match(src, /objectFit:\s*isDesktop\s*\?\s*'contain'\s*:\s*'cover'/, 'desktop should contain portrait videos instead of cropping them');
});

test('EpisodeDetailPage has responsive flex layout', () => {
  const src = read('src/components/episode-detail/index.tsx');
  assert.match(src, /flex-col lg:flex-row/, 'should stack on mobile, side-by-side on desktop');
  assert.match(src, /hidden lg:flex/, 'sidebar selector should be hidden on mobile');
  assert.match(src, /lg:hidden/, 'inline selector should be hidden on desktop');
});

test('EpisodeSelector accepts sidebar and inline variants', () => {
  const src = read('src/components/episode-detail/EpisodeSelector.tsx');
  assert.match(src, /variant.*sidebar.*inline|inline.*sidebar/, 'should define both variants');
  assert.match(src, /grid-cols-8/, 'inline variant should use 8-column grid');
});

test('HomePage has responsive hero with touch swipe support', () => {
  const src = read('src/components/HomePage.tsx');
  assert.match(src, /onTouchStart/, 'hero should support touch start');
  assert.match(src, /onTouchEnd/, 'hero should support touch end');
  assert.match(src, /hidden lg:flex/, 'arrows should be hidden on mobile');
  assert.match(src, /line-clamp-2/, 'description should clamp on mobile');
});
