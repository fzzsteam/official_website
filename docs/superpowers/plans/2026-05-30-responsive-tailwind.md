# Responsive Layout & Tailwind CSS Migration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate all frontend pages from inline-styles-only to Tailwind CSS v3, making the site fully responsive (mobile ≤ 768px, desktop ≥ 1024px), and fix the video player to correctly display 9:16 vertical content.

**Architecture:** Tailwind CSS v3 is added alongside existing inline styles. Layout properties (flex, grid, padding, width, display, responsive visibility) move to Tailwind classes; decorative styles (complex gradients, box-shadows) remain inline. EpisodeSelector gains a `variant` prop (`'sidebar' | 'inline'`) to serve both the desktop right-panel and mobile inline context. No new runtime dependencies.

**Tech Stack:** Tailwind CSS v3, PostCSS, Autoprefixer, Next.js 14 App Router, React 18, TypeScript, `node:test` for structural checks.

---

## File Map

| Task | Files |
|------|-------|
| 1 | `tailwind.config.ts` (new), `postcss.config.js` (new), `app/globals.css`, `test/responsive-tailwind.test.cjs` (new) |
| 2 | `src/components/episode-detail/Navbar.tsx` |
| 3 | `src/components/episode-detail/VideoPlayer.tsx` |
| 4 | `src/components/episode-detail/index.tsx` |
| 5 | `src/components/episode-detail/EpisodeSelector.tsx` |
| 6 | `src/components/episode-detail/EpisodeInfo.tsx`, `CastSection.tsx`, `Recommendations.tsx` |
| 7 | `src/components/HomePage.tsx` |
| 8 | `src/components/pages/InnerPage.tsx` |
| 9 | `src/components/LoginModal.tsx`, `VipModal.tsx`, `PaymentModal.tsx` |

---

### Task 1: Install & Configure Tailwind CSS

**Files:**
- Create: `tailwind.config.ts`
- Create: `postcss.config.js`
- Modify: `app/globals.css`
- Create: `test/responsive-tailwind.test.cjs`

- [ ] **Step 1: Install packages**

```bash
npm install -D tailwindcss@3 postcss autoprefixer
```

Expected: `tailwindcss`, `postcss`, `autoprefixer` appear in `devDependencies` in `package.json`.

- [ ] **Step 2: Create `tailwind.config.ts`**

```ts
import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg:    '#1C1917',
          card:  '#272320',
          gold:  '#C9912A',
          amber: '#d8a24d',
        },
      },
      fontFamily: {
        display:   ['var(--font-display)',   'serif'],
        body:      ['var(--font-body)',      'sans-serif'],
        cormorant: ['var(--font-cormorant)', 'serif'],
      },
    },
  },
} satisfies Config
```

- [ ] **Step 3: Create `postcss.config.js`**

```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 4: Prepend Tailwind directives to `app/globals.css`**

Add these three lines at the very top of `app/globals.css` (before the existing `* { box-sizing: border-box; }`):

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 5: Create `test/responsive-tailwind.test.cjs`**

```js
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
```

- [ ] **Step 6: Run the test**

```bash
node --test test/responsive-tailwind.test.cjs
```

Expected output: `3 passing`.

- [ ] **Step 7: Verify dev server starts cleanly**

```bash
npm run dev
```

Open http://localhost:3000 — page renders identically to before (no visual change yet). Check terminal for no errors.

- [ ] **Step 8: Commit**

```bash
git add tailwind.config.ts postcss.config.js app/globals.css test/responsive-tailwind.test.cjs package.json package-lock.json
git commit -m "feat: install and configure Tailwind CSS v3"
```

---

### Task 2: Responsive Navbar

**Files:**
- Modify: `src/components/episode-detail/Navbar.tsx`

Desktop (≥ 768px): current horizontal layout preserved.  
Mobile: brand + login/avatar + hamburger only; nav links hidden; hamburger opens slide-down drawer.

- [ ] **Step 1: Add a structural test**

Append to `test/responsive-tailwind.test.cjs`:

```js
test('Navbar uses Tailwind responsive classes for mobile/desktop', () => {
  const src = read('src/components/episode-detail/Navbar.tsx');
  assert.match(src, /hidden md:flex/, 'nav links should be hidden on mobile with md:flex');
  assert.match(src, /md:hidden/, 'hamburger should be hidden on desktop');
});
```

- [ ] **Step 2: Run new test to verify it fails**

```bash
node --test test/responsive-tailwind.test.cjs
```

Expected: 1 failure on the new Navbar test.

- [ ] **Step 3: Replace `src/components/episode-detail/Navbar.tsx` entirely**

```tsx
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { ModalType, PageType } from '../../context/AppContext';
import { tokens } from './tokens';
import UserDropdown from '../UserDropdown';

interface NavbarProps {
  onSearch?: () => void;
  onHistory?: () => void;
}

const NavSearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
  </svg>
);
const HistoryIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);
const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const CrownIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
    <path d="M2 19h20v2H2v-2zm18-9l-6 4-2-7-2 7-6-4 2 11h12l2-11z" />
  </svg>
);
const ChevronDownIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const HamburgerIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);
const CloseMenuIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const navLinks: Array<{ label: string; page?: PageType; modal?: Exclude<ModalType, 'none'> }> = [
  { label: '首页', page: 'home' },
  { label: '短剧', page: 'home' },
  { label: '会员中心', modal: 'vip' },
  { label: '关于我们', page: 'about' },
  { label: '业务介绍', page: 'business' },
  { label: '联系我们', page: 'contact' },
];

const Navbar: React.FC<NavbarProps> = ({ onSearch, onHistory }) => {
  const { user, page, navigateTo, openModal } = useApp();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNavClick = (link: typeof navLinks[0]) => {
    setMenuOpen(false);
    if (link.modal) { openModal(link.modal); return; }
    if (link.page) navigateTo(link.page);
  };

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-between px-4 md:px-11 py-[18px]"
        style={{
          background: 'linear-gradient(to bottom, rgba(20,15,10,0.96) 0%, rgba(20,15,10,0.7) 100%)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(240,237,232,0.05)',
        }}
      >
        {/* Brand */}
        <button
          onClick={() => navigateTo('home')}
          style={{
            fontFamily: tokens.fontCormorant,
            fontSize: 15, fontWeight: 400,
            letterSpacing: '0.28em',
            color: tokens.textPrimary,
            background: 'none', border: 'none',
            textTransform: 'uppercase', cursor: 'pointer',
            flexShrink: 0, padding: 0,
          }}
        >
          方直智胜
        </button>

        {/* Nav links — desktop only */}
        <ul className="hidden md:flex gap-7 list-none m-0 mx-8 p-0">
          {navLinks.map((link) => (
            <li key={link.label}>
              <button
                onClick={() => handleNavClick(link)}
                style={{
                  fontFamily: tokens.fontBody,
                  fontSize: 12, fontWeight: 300,
                  letterSpacing: '0.12em',
                  color: (link.label === '短剧' ? page === 'episode-detail' : link.page === page)
                    ? tokens.textPrimary : tokens.textMuted,
                  background: 'none', border: 'none',
                  cursor: 'pointer', padding: 0,
                }}
              >
                {link.label}
              </button>
            </li>
          ))}
        </ul>

        {/* Right actions */}
        <div className="flex items-center gap-4">
          {/* Search + History — desktop only */}
          <button onClick={onSearch} className="hidden md:flex items-center gap-1.5" style={iconBtnStyle}>
            <NavSearchIcon />
            <span style={{ fontFamily: tokens.fontBody, fontSize: 12, letterSpacing: '0.08em' }}>搜索剧名/演员</span>
          </button>
          <button onClick={onHistory} className="hidden md:flex items-center gap-1.5" style={iconBtnStyle}>
            <HistoryIcon />
            <span style={{ fontFamily: tokens.fontBody, fontSize: 12, letterSpacing: '0.08em' }}>观看历史</span>
          </button>

          {/* User area */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                className="flex items-center gap-2"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: user.isVip
                    ? 'linear-gradient(135deg, rgba(201,145,42,0.3), rgba(201,145,42,0.15))'
                    : 'rgba(240,237,232,0.1)',
                  border: `1px solid ${user.isVip ? 'rgba(201,145,42,0.5)' : 'rgba(240,237,232,0.2)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: user.isVip ? tokens.accentGold : tokens.textMuted, flexShrink: 0,
                }}>
                  <UserIcon />
                </div>
                <span className="hidden md:inline" style={{ fontFamily: tokens.fontBody, fontSize: 12, color: tokens.textMuted, letterSpacing: '0.06em' }}>
                  {user.phone}
                </span>
                {user.isVip && (
                  <span className="hidden md:inline-flex items-center gap-1" style={{
                    background: 'linear-gradient(135deg, #C9912A, #d8a24d)',
                    color: '#1a0f00', fontSize: 9, fontWeight: 600,
                    padding: '2px 6px', borderRadius: 2,
                    fontFamily: tokens.fontBody, letterSpacing: '0.08em',
                  }}>
                    <CrownIcon /> 尊享会员
                  </span>
                )}
                <span className="hidden md:flex" style={{ color: tokens.textMuted }}>
                  <ChevronDownIcon />
                </span>
              </button>
              {dropdownOpen && <UserDropdown onClose={() => setDropdownOpen(false)} />}
            </div>
          ) : (
            <button
              onClick={() => openModal('login')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(201,145,42,0.15)',
                border: '1px solid rgba(201,145,42,0.4)',
                borderRadius: 4, cursor: 'pointer',
                color: tokens.accentGold,
                fontFamily: tokens.fontBody, fontSize: 12,
                letterSpacing: '0.1em', padding: '7px 16px',
              }}
            >
              登录 / 注册
            </button>
          )}

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="md:hidden flex items-center justify-center p-1"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: tokens.textMuted }}
          >
            {menuOpen ? <CloseMenuIcon /> : <HamburgerIcon />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-[199] md:hidden"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="absolute top-[57px] left-0 right-0 py-2"
            style={{
              background: 'rgba(20,15,10,0.98)',
              backdropFilter: 'blur(16px)',
              borderBottom: '1px solid rgba(240,237,232,0.08)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNavClick(link)}
                className="w-full text-left px-6 py-3 block"
                style={{
                  fontFamily: tokens.fontBody,
                  fontSize: 15, fontWeight: 300,
                  letterSpacing: '0.12em',
                  color: (link.label === '短剧' ? page === 'episode-detail' : link.page === page)
                    ? tokens.textPrimary : tokens.textMuted,
                  background: 'none', border: 'none', cursor: 'pointer',
                }}
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

const iconBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none',
  color: 'rgba(240,237,232,0.58)', cursor: 'pointer', padding: 0,
};

export default Navbar;
```

- [ ] **Step 4: Run all tests**

```bash
node --test test/responsive-tailwind.test.cjs
```

Expected: all 4 tests pass.

- [ ] **Step 5: Verify in browser**

- 1280px: navbar unchanged
- 375px (iPhone SE in DevTools): only brand + login + hamburger icon visible; tap hamburger → drawer slides in with all nav links

- [ ] **Step 6: Commit**

```bash
git add src/components/episode-detail/Navbar.tsx test/responsive-tailwind.test.cjs
git commit -m "feat: responsive Navbar with mobile hamburger drawer"
```

---

### Task 3: VideoPlayer — 9:16 Aspect Ratio + Mobile Controls

**Files:**
- Modify: `src/components/episode-detail/VideoPlayer.tsx`

Change container from `aspectRatio: '16/9'` to Tailwind `aspect-[9/16]`. Simplify controls on mobile (hide text buttons, enlarge touch targets, hide volume). The parent (Task 4) handles centering on desktop.

- [ ] **Step 1: Add structural test**

Append to `test/responsive-tailwind.test.cjs`:

```js
test('VideoPlayer uses 9:16 aspect ratio', () => {
  const src = read('src/components/episode-detail/VideoPlayer.tsx');
  assert.doesNotMatch(src, /aspectRatio.*16.*9|16\/9/, 'should not use 16:9 ratio');
  assert.match(src, /aspect-\[9\/16\]/, 'should use 9:16 Tailwind class');
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
node --test test/responsive-tailwind.test.cjs
```

Expected: 1 failure on VideoPlayer test.

- [ ] **Step 3: Change the outer container div**

In `VideoPlayer.tsx`, find:

```tsx
    <div
      ref={containerRef}
      style={{ position: 'relative', width: '100%', background: '#000', aspectRatio: '16/9' }}
      onMouseMove={resetHideTimer}
      onMouseLeave={() => setShowControls(false)}
    >
```

Replace with:

```tsx
    <div
      ref={containerRef}
      className="relative w-full bg-black aspect-[9/16]"
      onMouseMove={resetHideTimer}
      onMouseLeave={() => setShowControls(false)}
    >
```

- [ ] **Step 4: Update the Back button — hide label text on mobile**

Find:

```tsx
      <button
        onClick={onBack}
        style={{
          position: 'absolute', top: 16, left: 16, zIndex: 20,
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(0,0,0,0.4)', border: 'none',
          color: tokens.textMuted, cursor: 'pointer',
          fontFamily: tokens.fontBody, fontSize: 12,
          letterSpacing: '0.1em', padding: '7px 14px',
          borderRadius: 2, backdropFilter: 'blur(4px)',
          transition: 'color 0.3s ease',
        }}
      >
        <BackArrowIcon />
        {backLabel}
      </button>
```

Replace with:

```tsx
      <button
        onClick={onBack}
        className="absolute top-4 left-4 z-20 flex items-center gap-1.5"
        style={{
          background: 'rgba(0,0,0,0.4)', border: 'none',
          color: tokens.textMuted, cursor: 'pointer',
          fontFamily: tokens.fontBody, fontSize: 12,
          letterSpacing: '0.1em', padding: '7px 14px',
          borderRadius: 2, backdropFilter: 'blur(4px)',
        }}
      >
        <BackArrowIcon />
        <span className="hidden md:inline">{backLabel}</span>
      </button>
```

- [ ] **Step 5: Update controls row — responsive layout**

Find the controls row div and its children (the `{/* Controls row */}` comment block). Replace the entire controls row:

```tsx
          {/* Controls row */}
          <div className="flex items-center justify-between">
            {/* Left controls */}
            <div className="flex items-center gap-2 md:gap-[14px]">
              <button onClick={togglePlay} className="p-3 md:p-1" style={ctrlBtnStyle}>
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
              </button>
              <button onClick={() => seek(-10)} className="p-3 md:p-1" style={ctrlBtnStyle} title="后退10秒">
                <Rewind10Icon />
              </button>
              <button onClick={() => seek(10)} className="p-3 md:p-1" style={ctrlBtnStyle} title="前进10秒">
                <Forward10Icon />
              </button>
              <button className="hidden md:flex p-1" style={ctrlBtnStyle} title="音量">
                <VolumeIcon />
              </button>
              <span style={{
                fontFamily: tokens.fontBody, fontSize: 12, color: tokens.textMuted,
                letterSpacing: '0.04em', userSelect: 'none',
              }}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-2 md:gap-[8px]">
              {['倍速', '高清'].map((label) => (
                <button key={label} className="hidden md:block" style={{
                  background: 'none', border: '1px solid rgba(240,237,232,0.28)',
                  color: tokens.textMuted, cursor: 'pointer',
                  fontFamily: tokens.fontBody, fontSize: 11,
                  padding: '3px 9px', borderRadius: 2,
                  letterSpacing: '0.08em',
                }}>
                  {label}
                </button>
              ))}
              <button className="hidden md:flex p-1" style={ctrlBtnStyle} title="设置"><SettingsIcon /></button>
              <button className="p-3 md:p-1" style={ctrlBtnStyle} title="全屏"><FullscreenIcon /></button>
            </div>
          </div>
```

- [ ] **Step 6: Run all tests**

```bash
node --test test/responsive-tailwind.test.cjs
```

Expected: all 5 tests pass.

- [ ] **Step 7: Verify in browser**

- Desktop (1280px): video is portrait 9:16, controls include 倍速/高清/音量/设置
- Mobile (375px): full-width portrait video, back button shows only arrow, 倍速/高清/音量/设置 hidden, play/seek/fullscreen have larger touch targets

- [ ] **Step 8: Commit**

```bash
git add src/components/episode-detail/VideoPlayer.tsx test/responsive-tailwind.test.cjs
git commit -m "feat: VideoPlayer 9:16 aspect ratio with responsive mobile controls"
```

---

### Task 4: EpisodeDetailPage — Responsive Two-Column Layout

**Files:**
- Modify: `src/components/episode-detail/index.tsx`

Desktop (≥ 1024px): left column (video max-w-[400px] + info below) + right sidebar (EpisodeSelector).  
Mobile: single column — video full-width → info → EpisodeSelector inline → cast → recommendations.

- [ ] **Step 1: Add structural test**

Append to `test/responsive-tailwind.test.cjs`:

```js
test('EpisodeDetailPage has responsive flex layout', () => {
  const src = read('src/components/episode-detail/index.tsx');
  assert.match(src, /flex-col lg:flex-row/, 'should stack on mobile, side-by-side on desktop');
  assert.match(src, /lg:max-w-\[400px\]/, 'video should be max 400px on desktop');
  assert.match(src, /hidden lg:flex/, 'sidebar selector should be hidden on mobile');
  assert.match(src, /lg:hidden/, 'inline selector should be hidden on desktop');
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
node --test test/responsive-tailwind.test.cjs
```

- [ ] **Step 3: Replace `src/components/episode-detail/index.tsx` entirely**

```tsx
import React, { useState, useEffect } from 'react';
import { tokens } from './tokens';
import Navbar from './Navbar';
import VideoPlayer from './VideoPlayer';
import EpisodeInfo from './EpisodeInfo';
import CastSection from './CastSection';
import EpisodeSelector from './EpisodeSelector';
import Recommendations from './Recommendations';
import type { Drama, CastMember, RecommendedDrama } from '../../types/drama';
import { useApp } from '../../context/AppContext';
import { apiGet, type ApiError } from '../../lib/api/client';

interface EpisodeDetailPageProps {
  drama: Drama;
  cast: CastMember[];
  recommendations: RecommendedDrama[];
  initialEpisode?: number;
  videoSrc?: string;
  videoPoster?: string;
  onBack?: () => void;
}

const EpisodeDetailPage: React.FC<EpisodeDetailPageProps> = ({
  drama,
  cast,
  recommendations,
  initialEpisode = 1,
  videoSrc,
  videoPoster,
  onBack,
}) => {
  const [currentEpisode, setCurrentEpisode] = useState(initialEpisode);
  const [currentVideoSrc, setCurrentVideoSrc] = useState(videoSrc);
  const [playLoading, setPlayLoading] = useState(false);
  const [playError, setPlayError] = useState('');
  const { navigateTo, openModal } = useApp();
  const handleBack = onBack ?? (() => navigateTo('home'));

  useEffect(() => {
    let cancelled = false;
    const loadPlayUrl = async () => {
      setPlayLoading(true);
      setPlayError('');
      try {
        const data = await apiGet<{ url: string }>(
          `/api/dramas/${encodeURIComponent(drama.id)}/episodes/${currentEpisode}/play-url`,
        );
        if (!cancelled) setCurrentVideoSrc(data.url);
      } catch (requestError) {
        if (cancelled) return;
        setCurrentVideoSrc(undefined);
        setPlayError(requestError instanceof Error ? requestError.message : '播放地址获取失败');
        const apiError = requestError as ApiError;
        if (apiError.code === 'AUTH_REQUIRED') openModal('login');
        else if (apiError.code === 'VIP_REQUIRED') openModal('vip');
      } finally {
        if (!cancelled) setPlayLoading(false);
      }
    };
    void loadPlayUrl();
    return () => { cancelled = true; };
  }, [currentEpisode, drama.id, openModal]);

  return (
    <div
      className="min-h-screen relative"
      style={{
        background: `
          linear-gradient(180deg, rgba(46, 35, 28, 0.18), rgba(24, 18, 15, 0.28)),
          linear-gradient(135deg, #3b3028 0%, #4a3a2f 20%, #5b4738 46%, #3e3127 72%, #241d19 100%)
        `,
        color: tokens.textPrimary,
        fontFamily: tokens.fontBody,
      }}
    >
      {/* Texture overlay */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        background: `
          radial-gradient(circle at top center, rgba(255,247,231,0.07) 0%, rgba(255,247,231,0.02) 24%, transparent 52%),
          repeating-linear-gradient(90deg, rgba(255,250,239,0.016) 0, rgba(255,250,239,0.016) 1px, transparent 1px, transparent 5px),
          repeating-linear-gradient(180deg, rgba(71,54,42,0.04) 0, rgba(71,54,42,0.04) 2px, transparent 2px, transparent 9px)
        `,
      }} />

      <Navbar />

      {/* Main layout: flex-col on mobile, flex-row on desktop */}
      <div className="flex flex-col lg:flex-row pt-[62px] relative z-[1] min-h-screen">

        {/* Left column */}
        <div className="flex-1 min-w-0 flex flex-col">

          {/* Video — full-width on mobile, max 400px centered on desktop */}
          <div className="w-full lg:max-w-[400px] lg:mx-auto">
            <VideoPlayer
              src={currentVideoSrc}
              poster={videoPoster}
              isVip={drama.isVip}
              onBack={handleBack}
              backLabel="返回详情页"
              isLoading={playLoading}
              errorMessage={playError}
            />
          </div>

          {/* Info row */}
          <div
            className="flex items-start px-4 md:px-5 pt-5"
            style={{
              gap: 32,
              borderBottom: '1px solid rgba(240,237,232,0.07)',
            }}
          >
            <EpisodeInfo drama={drama} currentEpisode={currentEpisode} />
            <CastSection cast={cast} />
          </div>

          {/* EpisodeSelector inline — mobile only */}
          <div className="lg:hidden">
            <EpisodeSelector
              drama={drama}
              currentEpisode={currentEpisode}
              onSelectEpisode={setCurrentEpisode}
              variant="inline"
            />
          </div>

          <Recommendations
            items={recommendations}
            onSelect={(id) => console.log('Navigate to drama:', id)}
          />
        </div>

        {/* Right sidebar — desktop only */}
        <div className="hidden lg:flex">
          <EpisodeSelector
            drama={drama}
            currentEpisode={currentEpisode}
            onSelectEpisode={setCurrentEpisode}
            variant="sidebar"
          />
        </div>
      </div>
    </div>
  );
};

export default EpisodeDetailPage;
```

- [ ] **Step 4: Run all tests**

```bash
node --test test/responsive-tailwind.test.cjs
```

Expected: all 6 tests pass.

- [ ] **Step 5: Commit**

Note: the page will show a TypeScript error until Task 5 adds the `variant` prop to EpisodeSelector. The build will fail — commit anyway, fix in the next task.

```bash
git add src/components/episode-detail/index.tsx test/responsive-tailwind.test.cjs
git commit -m "feat: EpisodeDetailPage responsive two-column layout"
```

---

### Task 5: EpisodeSelector — variant Prop

**Files:**
- Modify: `src/components/episode-detail/EpisodeSelector.tsx`

Add `variant?: 'sidebar' | 'inline'`. `sidebar` = current 336px panel. `inline` = full-width compact grid for mobile.

- [ ] **Step 1: Add structural test**

Append to `test/responsive-tailwind.test.cjs`:

```js
test('EpisodeSelector accepts sidebar and inline variants', () => {
  const src = read('src/components/episode-detail/EpisodeSelector.tsx');
  assert.match(src, /variant.*sidebar.*inline|inline.*sidebar/, 'should define both variants');
  assert.match(src, /grid-cols-8/, 'inline variant should use 8-column grid');
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
node --test test/responsive-tailwind.test.cjs
```

- [ ] **Step 3: Replace `src/components/episode-detail/EpisodeSelector.tsx` entirely**

```tsx
import React, { useState } from 'react';
import { tokens } from './tokens';
import type { Drama } from '../../types/drama';

interface EpisodeSelectorProps {
  drama: Drama;
  currentEpisode: number;
  onSelectEpisode: (episode: number) => void;
  onViewAll?: () => void;
  onCalendar?: () => void;
  variant?: 'sidebar' | 'inline';
}

const ChevronRightIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const PauseSmIcon = () => (
  <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
  </svg>
);

const PAGE_SIZE = 30;

const EpisodeSelector: React.FC<EpisodeSelectorProps> = ({
  drama,
  currentEpisode,
  onSelectEpisode,
  onViewAll,
  onCalendar,
  variant = 'sidebar',
}) => {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(drama.totalEpisodes / PAGE_SIZE);
  const start = page * PAGE_SIZE;
  const episodes = Array.from(
    { length: Math.min(PAGE_SIZE, drama.totalEpisodes - start) },
    (_, i) => start + i + 1
  );

  const episodeButton = (ep: number) => {
    const isActive = ep === currentEpisode;
    return (
      <button
        key={ep}
        onClick={() => onSelectEpisode(ep)}
        className="aspect-square flex flex-col items-center justify-center gap-0.5 rounded-sm"
        style={{
          background: isActive
            ? 'linear-gradient(135deg, rgba(201,145,42,0.25), rgba(201,145,42,0.15))'
            : 'rgba(240,237,232,0.04)',
          border: isActive
            ? '1px solid rgba(201,145,42,0.55)'
            : '1px solid rgba(240,237,232,0.08)',
          color: isActive ? tokens.accentAmber : tokens.textMuted,
          cursor: 'pointer',
          fontFamily: tokens.fontBody,
          fontSize: 13, fontWeight: isActive ? 500 : 300,
          letterSpacing: '0.04em',
        }}
      >
        {ep}
        {isActive && <PauseSmIcon />}
      </button>
    );
  };

  if (variant === 'inline') {
    return (
      <div
        className="w-full px-4 py-4"
        style={{ borderBottom: '1px solid rgba(240,237,232,0.07)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <span style={{
            fontFamily: tokens.fontCormorant,
            fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase',
            color: tokens.textPrimary,
          }}>
            选集
          </span>
          <button
            onClick={onViewAll}
            className="flex items-center gap-1"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: tokens.textMuted, fontFamily: tokens.fontBody,
              fontSize: 11, letterSpacing: '0.06em', padding: 0,
            }}
          >
            全{drama.totalEpisodes}集 <ChevronRightIcon />
          </button>
        </div>

        <div className="grid grid-cols-8 gap-1.5">
          {episodes.map(episodeButton)}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                style={{
                  width: 24, height: 24,
                  background: i === page ? 'rgba(201,145,42,0.2)' : 'transparent',
                  border: `1px solid ${i === page ? 'rgba(201,145,42,0.5)' : 'rgba(240,237,232,0.15)'}`,
                  color: i === page ? tokens.accentGold : tokens.textMuted,
                  fontSize: 10, cursor: 'pointer', borderRadius: 2,
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // sidebar variant (default)
  return (
    <div style={{
      width: 336, flexShrink: 0,
      background: tokens.cardBg,
      borderLeft: '1px solid rgba(240,237,232,0.07)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <div style={{ padding: '22px 20px 16px' }}>
        <h2 style={{
          fontFamily: tokens.fontDisplay,
          fontSize: 18, fontWeight: 400,
          color: tokens.textPrimary, letterSpacing: '0.05em',
          margin: '0 0 6px',
        }}>
          {drama.title}
        </h2>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontFamily: tokens.fontBody, fontSize: 11, color: tokens.textMuted, letterSpacing: '0.06em',
        }}>
          <span>共{drama.totalEpisodes}集</span>
          {drama.genres.map((g) => (
            <React.Fragment key={g}>
              <span style={{ color: 'rgba(240,237,232,0.18)' }}>·</span>
              <span>{g}</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      <div style={{
        padding: '0 20px 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid rgba(240,237,232,0.07)',
      }}>
        <span style={{
          fontFamily: tokens.fontCormorant,
          fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase',
          color: tokens.textPrimary,
        }}>
          选集
        </span>
        <button
          onClick={onViewAll}
          style={{
            display: 'flex', alignItems: 'center', gap: 3,
            background: 'none', border: 'none', cursor: 'pointer',
            color: tokens.textMuted, fontFamily: tokens.fontBody,
            fontSize: 11, letterSpacing: '0.06em', padding: 0,
          }}
        >
          全{drama.totalEpisodes}集 <ChevronRightIcon />
        </button>
      </div>

      <div style={{
        flex: 1, overflowY: 'auto',
        padding: '14px 14px 0',
        display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 6, alignContent: 'start',
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(201,145,42,0.2) transparent',
      }}>
        {episodes.map(episodeButton)}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '10px 0' }}>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              style={{
                width: 24, height: 24,
                background: i === page ? 'rgba(201,145,42,0.2)' : 'transparent',
                border: `1px solid ${i === page ? 'rgba(201,145,42,0.5)' : 'rgba(240,237,232,0.15)'}`,
                color: i === page ? tokens.accentGold : tokens.textMuted,
                fontSize: 10, cursor: 'pointer', borderRadius: 2,
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      <div style={{ padding: '14px 14px' }}>
        <button
          onClick={onCalendar}
          style={{
            width: '100%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 8,
            background: 'rgba(240,237,232,0.04)',
            border: '1px solid rgba(240,237,232,0.1)',
            color: tokens.textMuted, cursor: 'pointer',
            fontFamily: tokens.fontBody, fontSize: 12,
            letterSpacing: '0.12em', padding: '11px 0', borderRadius: 2,
          }}
        >
          <CalendarIcon />
          追剧日历
        </button>
      </div>
    </div>
  );
};

export default EpisodeSelector;
```

- [ ] **Step 4: Run all tests**

```bash
node --test test/*.test.cjs
```

Expected: all tests pass (including the pre-existing tests in other files).

- [ ] **Step 5: Verify build compiles cleanly**

```bash
npm run build
```

Expected: build succeeds with no TypeScript errors.

- [ ] **Step 6: Verify in browser**

- Desktop (1280px): right sidebar with episode grid
- Mobile (375px): episode grid appears as an 8-column strip below the video info section, no sidebar

- [ ] **Step 7: Commit**

```bash
git add src/components/episode-detail/EpisodeSelector.tsx test/responsive-tailwind.test.cjs
git commit -m "feat: EpisodeSelector variant prop for mobile inline and desktop sidebar"
```

---

### Task 6: EpisodeInfo, CastSection, Recommendations — Mobile Tweaks

**Files:**
- Modify: `src/components/episode-detail/EpisodeInfo.tsx`
- Modify: `src/components/episode-detail/CastSection.tsx`
- Modify: `src/components/episode-detail/Recommendations.tsx`

- [ ] **Step 1: Update `EpisodeInfo.tsx` — reflow action buttons on mobile**

Find the return statement. Replace only the layout structure (not the logic or state). The entire return block becomes:

```tsx
  return (
    <div className="py-5 flex-1">
      {/* Title + meta */}
      <div className="flex items-start justify-between mb-2.5">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <h1 style={{
              fontFamily: tokens.fontDisplay,
              fontSize: 22, fontWeight: 400,
              color: tokens.textPrimary, letterSpacing: '0.05em',
              margin: 0,
            }}>
              {drama.title}
            </h1>
            {drama.isVip && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: 'linear-gradient(135deg, #C9912A, #d8a24d)',
                color: '#1a0f00', fontSize: 9, fontWeight: 600,
                padding: '2px 8px', borderRadius: 2,
                fontFamily: tokens.fontBody, letterSpacing: '0.1em',
              }}>
                <CrownSmIcon />
                尊享会员·全集免费看
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5" style={{
            fontFamily: tokens.fontBody, fontSize: 12,
            color: tokens.textMuted, letterSpacing: '0.05em',
          }}>
            <span>共{drama.totalEpisodes}集</span>
            <span style={{ color: 'rgba(240,237,232,0.2)' }}>|</span>
            <span>每集{drama.episodeDuration}分钟</span>
            <span style={{ color: 'rgba(240,237,232,0.2)' }}>|</span>
            <span>{drama.year}</span>
            <span style={{ color: 'rgba(240,237,232,0.2)' }}>|</span>
            {drama.genres.map((g) => <span key={g}>{g}</span>)}
          </div>
        </div>
        {/* Action buttons vertical — desktop only */}
        <div className="hidden md:flex flex-col items-center gap-3.5">
          <ActionBtn icon={<StarIcon filled={collected} />} label="已收藏" onClick={handleCollect} active={collected} />
          <ActionBtn icon={<ThumbUpIcon />} label="点赞" onClick={onLike} />
          <ActionBtn icon={<ShareIcon />} label="分享" onClick={onShare} />
        </div>
      </div>

      {/* Action buttons horizontal — mobile only */}
      <div className="flex md:hidden items-center gap-5 mb-3">
        <ActionBtn icon={<StarIcon filled={collected} />} label="已收藏" onClick={handleCollect} active={collected} />
        <ActionBtn icon={<ThumbUpIcon />} label="点赞" onClick={onLike} />
        <ActionBtn icon={<ShareIcon />} label="分享" onClick={onShare} />
      </div>

      {/* Description */}
      <div className="pr-0 md:pr-[60px]">
        <p style={{
          fontFamily: tokens.fontBody, fontSize: 13, lineHeight: 2,
          color: 'rgba(240,237,232,0.65)', fontWeight: 300,
          letterSpacing: '0.04em', margin: 0,
          display: '-webkit-box',
          WebkitLineClamp: expanded ? 'unset' : 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          简介：{drama.description}
        </p>
        <button
          onClick={() => setExpanded((e) => !e)}
          className="inline-flex items-center gap-1 mt-2"
          style={{
            background: 'none', border: 'none',
            color: tokens.textMuted, cursor: 'pointer',
            fontFamily: tokens.fontBody, fontSize: 12,
            letterSpacing: '0.08em', padding: 0,
          }}
        >
          {expanded ? '收起' : '展开'}
          <span style={{
            display: 'inline-block',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease',
          }}>
            <ChevronDownIcon />
          </span>
        </button>
      </div>
    </div>
  );
```

- [ ] **Step 2: Update `CastSection.tsx` — remove fixed width**

Find:
```tsx
    <div style={{ minWidth: 0, flex: '0 0 auto', width: 300 }}>
```

Replace:
```tsx
    <div className="w-full min-w-0">
```

- [ ] **Step 3: Update `Recommendations.tsx` — hide arrows on mobile, responsive padding**

Find:
```tsx
  return (
    <section style={{ padding: '32px 0 40px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 18, paddingLeft: 20,
      }}>
```

Replace:
```tsx
  return (
    <section className="pt-6 pb-8 md:pt-8 md:pb-10">
      <div className="flex items-center justify-between mb-[18px] pl-4 md:pl-5">
```

Find the arrow controls div:
```tsx
        {/* Arrow controls */}
        <div style={{ display: 'flex', gap: 6, paddingRight: 20 }}>
```

Replace:
```tsx
        {/* Arrow controls — desktop only */}
        <div className="hidden md:flex gap-1.5 pr-5">
```

Find the scrollable row:
```tsx
      <div
        ref={scrollRef}
        style={{
          display: 'flex', gap: 12, overflowX: 'auto',
          scrollbarWidth: 'none', paddingLeft: 20, paddingRight: 20,
        }}
      >
```

Replace:
```tsx
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto px-4 md:px-5"
        style={{ scrollbarWidth: 'none' }}
      >
```

- [ ] **Step 4: Run all tests**

```bash
node --test test/*.test.cjs
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/episode-detail/EpisodeInfo.tsx src/components/episode-detail/CastSection.tsx src/components/episode-detail/Recommendations.tsx
git commit -m "feat: mobile-responsive EpisodeInfo, CastSection, Recommendations"
```

---

### Task 7: HomePage — Responsive Hero + Touch Swipe

**Files:**
- Modify: `src/components/HomePage.tsx`

- [ ] **Step 1: Add structural test**

Append to `test/responsive-tailwind.test.cjs`:

```js
test('HomePage has responsive hero with touch swipe support', () => {
  const src = read('src/components/HomePage.tsx');
  assert.match(src, /onTouchStart/, 'hero should support touch start');
  assert.match(src, /onTouchEnd/, 'hero should support touch end');
  assert.match(src, /hidden lg:flex/, 'arrows should be hidden on mobile');
  assert.match(src, /line-clamp-2/, 'description should clamp on mobile');
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
node --test test/responsive-tailwind.test.cjs
```

- [ ] **Step 3: Add `useRef` to the imports**

Find:
```tsx
import React, { useState, useEffect, useCallback } from 'react';
```

Replace:
```tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
```

- [ ] **Step 4: Add touch refs and handlers inside the `HomePage` component**

After `const hero = heroDramas[heroIndex];`, add:

```tsx
  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 50) delta < 0 ? next() : prev();
    touchStartX.current = null;
  };
```

- [ ] **Step 5: Add touch events to hero section**

Find:
```tsx
      <section style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
```

Replace:
```tsx
      <section
        className="relative h-screen overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
```

- [ ] **Step 6: Update hero content div positioning**

Find:
```tsx
        <div style={{
          position: 'absolute', left: 72, bottom: 120,
          opacity: isTransitioning ? 0 : 1,
          transform: isTransitioning ? 'translateY(12px)' : 'translateY(0)',
          transition: 'opacity 0.4s ease, transform 0.4s ease',
          maxWidth: 560,
        }}>
```

Replace:
```tsx
        <div
          className="absolute left-4 right-4 bottom-14 lg:left-[72px] lg:right-auto lg:bottom-[120px] lg:max-w-[560px]"
          style={{
            opacity: isTransitioning ? 0 : 1,
            transform: isTransitioning ? 'translateY(12px)' : 'translateY(0)',
            transition: 'opacity 0.4s ease, transform 0.4s ease',
          }}
        >
```

- [ ] **Step 7: Hide tagline on mobile**

Find the `{/* Tagline */}` comment block:
```tsx
          {/* Tagline */}
          <div style={{
            fontFamily: tokens.fontBody, fontSize: 13,
            color: 'rgba(240,237,232,0.55)', letterSpacing: '0.28em',
            marginBottom: 12, fontWeight: 300,
          }}>
```

Add `className="hidden lg:block"` to this div:
```tsx
          <div className="hidden lg:block" style={{
            fontFamily: tokens.fontBody, fontSize: 13,
            color: 'rgba(240,237,232,0.55)', letterSpacing: '0.28em',
            marginBottom: 12, fontWeight: 300,
          }}>
```

- [ ] **Step 8: Hide English title on mobile**

Find the `{/* English title */}` comment block div and add `className="hidden lg:block"`:
```tsx
          <div className="hidden lg:block" style={{
            fontFamily: tokens.fontCormorant, fontSize: 12,
            letterSpacing: '0.38em', color: 'rgba(240,237,232,0.45)',
            fontStyle: 'italic', textTransform: 'uppercase', marginBottom: 18,
          }}>
```

- [ ] **Step 9: Update title font size for mobile**

Find `fontSize: 'clamp(60px, 7vw, 96px)'` in the `<h1>` and change to:
```tsx
            fontSize: 'clamp(36px, 9vw, 96px)',
```

- [ ] **Step 10: Clamp description on mobile**

Find the description `<p>`:
```tsx
          <p style={{
            fontFamily: tokens.fontBody, fontSize: 13, lineHeight: 1.9,
            color: 'rgba(240,237,232,0.55)', fontWeight: 300,
            letterSpacing: '0.04em', marginBottom: 32,
            maxWidth: 420,
          }}>
```

Replace:
```tsx
          <p
            className="line-clamp-2 lg:line-clamp-none mb-6 lg:mb-8"
            style={{
              fontFamily: tokens.fontBody, fontSize: 13, lineHeight: 1.9,
              color: 'rgba(240,237,232,0.55)', fontWeight: 300,
              letterSpacing: '0.04em', maxWidth: 420,
            }}
          >
```

- [ ] **Step 11: Stack action buttons vertically on mobile**

Find:
```tsx
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
```

Replace:
```tsx
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 lg:gap-[14px]">
```

On the primary watch `<button>`, add `className="w-full lg:w-auto"` and change `display: 'inline-flex'` to use Tailwind. Find:
```tsx
            <button
              onClick={() => handlePlayDrama(hero)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                background: 'linear-gradient(135deg, #C9912A, #d8a24d)',
```

Replace:
```tsx
            <button
              onClick={() => handlePlayDrama(hero)}
              className="w-full lg:w-auto"
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                background: 'linear-gradient(135deg, #C9912A, #d8a24d)',
```

- [ ] **Step 12: Hide arrows on mobile**

Find:
```tsx
        <button onClick={prev} style={{ ...arrowBtnStyle, left: 20 }}><ChevronLeftIcon /></button>
        <button onClick={next} style={{ ...arrowBtnStyle, right: 20 }}><ChevronRightIcon /></button>
```

Replace:
```tsx
        <button onClick={prev} className="hidden lg:flex" style={{ ...arrowBtnStyle, left: 20 }}><ChevronLeftIcon /></button>
        <button onClick={next} className="hidden lg:flex" style={{ ...arrowBtnStyle, right: 20 }}><ChevronRightIcon /></button>
```

- [ ] **Step 13: Update recommendations section padding**

Find:
```tsx
      <section style={{ padding: '48px 60px 80px' }}>
```

Replace:
```tsx
      <section className="px-4 pt-8 pb-12 lg:px-[60px] lg:pt-12 lg:pb-20">
```

- [ ] **Step 14: Run all tests**

```bash
node --test test/*.test.cjs
```

Expected: all tests pass.

- [ ] **Step 15: Verify in browser**

- Desktop (1280px): hero unchanged; arrows visible
- Mobile (375px): content flows from left-4, title ~40px, description 2 lines, buttons stack full-width, no arrows; swipe left/right changes hero card

- [ ] **Step 16: Commit**

```bash
git add src/components/HomePage.tsx test/responsive-tailwind.test.cjs
git commit -m "feat: responsive HomePage hero with touch swipe and mobile layout"
```

---

### Task 8: InnerPage — Responsive Padding

**Files:**
- Modify: `src/components/pages/InnerPage.tsx`

Fixes About, Business, and Contact pages simultaneously (they all use `InnerPage` as layout wrapper).

- [ ] **Step 1: Update `InnerPage` component — replace `innerPageStyle`**

Find:
```tsx
export const InnerPage: React.FC<InnerPageProps> = ({ label, title, children }) => (
  <div style={pageBackgroundStyle}>
    <main style={innerPageStyle}>
```

Replace:
```tsx
export const InnerPage: React.FC<InnerPageProps> = ({ label, title, children }) => (
  <div style={pageBackgroundStyle}>
    <main className="min-h-[calc(100vh-105px)] pt-[130px] pb-[100px] px-4 md:px-[60px] max-w-[860px] mx-auto">
```

- [ ] **Step 2: Update footer — replace `footerStyle`**

Find:
```tsx
    <footer style={footerStyle}>
```

Replace:
```tsx
    <footer
      className="py-10 px-4 md:px-[60px] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 max-w-[860px] mx-auto"
      style={{ borderTop: '1px solid rgba(240,236,228,0.07)' }}
    >
```

- [ ] **Step 3: Update `InfoRow` — replace `infoRowStyle`**

Find:
```tsx
  <div style={infoRowStyle}>
```

Replace:
```tsx
  <div className="flex gap-5 mb-3.5 text-sm leading-[1.9] items-baseline" style={{ color: 'rgba(240,236,228,0.72)' }}>
```

- [ ] **Step 4: Remove unused style constants**

Delete the following constants from the file (they are no longer referenced):
- `innerPageStyle`
- `footerStyle`
- `infoRowStyle`

- [ ] **Step 5: Run all tests**

```bash
node --test test/*.test.cjs
```

Expected: all tests pass. The `react-pages.test.cjs` checks text content (unchanged), so it should still pass.

- [ ] **Step 6: Verify in browser**

Open About page at 375px: content has 16px left/right padding, no overflow, footer wraps gracefully.

- [ ] **Step 7: Commit**

```bash
git add src/components/pages/InnerPage.tsx
git commit -m "feat: responsive InnerPage for About/Business/Contact pages"
```

---

### Task 9: Modal Components — Responsive Width

**Files:**
- Modify: `src/components/LoginModal.tsx`
- Modify: `src/components/VipModal.tsx`
- Modify: `src/components/PaymentModal.tsx`

On mobile, modals should have `mx-4` margins rather than overflowing the screen. Remove `width: 420` from the inline style; add `className="w-full max-w-[420px] mx-4 md:mx-0"`.

- [ ] **Step 1: Update `LoginModal.tsx` — the inner panel div**

Find:
```tsx
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: 420, borderRadius: 8,
```

Replace:
```tsx
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-[420px] mx-4 md:mx-0"
          style={{
            borderRadius: 8,
```

- [ ] **Step 2: Update `VipModal.tsx` — find and fix the same pattern**

Open `src/components/VipModal.tsx`. Find the inner panel div that has `onClick={(e) => e.stopPropagation()}` and a `width` property in its inline style. Apply the same change: add `className="w-full max-w-[480px] mx-4 md:mx-0"` (VipModal is wider; adjust `max-w` to match its current width) and remove `width` from the inline style.

- [ ] **Step 3: Update `PaymentModal.tsx` — same pattern**

Open `src/components/PaymentModal.tsx`. Find the inner panel div, add `className="w-full max-w-[440px] mx-4 md:mx-0"`, remove `width` from the inline style.

- [ ] **Step 4: Run all tests**

```bash
node --test test/*.test.cjs
```

Expected: all tests pass.

- [ ] **Step 5: Run a final full build**

```bash
npm run build
```

Expected: clean build with no TypeScript errors.

- [ ] **Step 6: Verify in browser**

- Desktop (1280px): all modals centered as before
- Mobile (375px): modals have 16px margins on each side; no horizontal overflow

- [ ] **Step 7: Commit**

```bash
git add src/components/LoginModal.tsx src/components/VipModal.tsx src/components/PaymentModal.tsx
git commit -m "feat: responsive modals with full-width layout on mobile"
```

---

## Self-Review

### Spec coverage

| Spec Requirement | Task |
|-----------------|------|
| Tailwind v3 install + postcss config | 1 |
| Custom brand colors + font vars in tailwind.config.ts | 1 |
| Navbar hamburger on mobile, hide nav links | 2 |
| VideoPlayer 9:16 aspect ratio | 3 |
| VideoPlayer simplified controls on mobile | 3 |
| EpisodeDetailPage flex-col mobile / flex-row desktop | 4 |
| Video max-w-[400px] centered on desktop | 4 |
| EpisodeSelector sidebar on desktop only | 4 + 5 |
| EpisodeSelector inline variant on mobile | 5 |
| EpisodeInfo mobile action buttons reflow to horizontal | 6 |
| CastSection w-full (remove fixed width) | 6 |
| Recommendations hide scroll arrows on mobile | 6 |
| HomePage hero responsive positioning | 7 |
| Hero touch swipe left/right | 7 |
| Hero tagline/English title hidden on mobile | 7 |
| Hero description line-clamp-2 on mobile | 7 |
| Hero buttons vertical stack on mobile | 7 |
| Arrows hidden on mobile | 7 |
| InnerPage responsive padding | 8 |
| About/Business/Contact responsive (via InnerPage) | 8 |
| Modals responsive width on mobile | 9 |

All spec requirements covered. ✓

### Placeholder check

No TBD/TODO found. All code blocks contain complete implementations. ✓

### Type consistency

- `variant` prop typed as `'sidebar' | 'inline'` in `EpisodeSelector` (Task 5)
- Used as `variant="sidebar"` and `variant="inline"` in `EpisodeDetailPage` (Task 4) ✓
- `handleTouchStart` / `handleTouchEnd` both defined before use in `HomePage` (Task 7) ✓
