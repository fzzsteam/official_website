# Next.js 会员短剧 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有 Vite React 短剧页面重构为 Next.js App Router 单体应用，并补齐手机号验证码登录、会员、微信 Native 支付、MySQL、OSS private 播放鉴权和 SAE 部署。

**Architecture:** 使用 Next.js App Router 统一承载页面与 API。UI 组件尽量保留在 `src/components`，服务端能力集中在 `src/lib/**`，API route 只做请求解析和响应包装。数据库使用 UUID 主键、UTC 时间、金额分单位，所有敏感配置由服务端环境变量读取。

**Tech Stack:** Next.js 14/15 App Router, React 18, TypeScript, MySQL, `mysql2`, `zod`, `jose`, `bcryptjs`, `qrcode.react`, 阿里云短信 SDK, 阿里云 OSS SDK, 微信支付 HTTP API v3, Docker, GitHub Actions, SAE。

---

## Scope Check

这个 spec 包含多个业务域，但它们共享同一个登录态、订单状态、会员鉴权和部署单元。计划按可独立验证的任务拆分，每个任务完成后都能运行测试并提交。实现时不要跨任务提前接入第三方真实服务，先完成可测试边界，再替换真实 SDK 调用。

## Target File Structure

```text
AGENTS.md
app/
  layout.tsx
  page.tsx
  drama/[id]/page.tsx
  api/auth/send-code/route.ts
  api/auth/login/route.ts
  api/auth/logout/route.ts
  api/auth/me/route.ts
  api/membership/plans/route.ts
  api/payments/wechat/native/route.ts
  api/payments/wechat/status/route.ts
  api/payments/wechat/notify/route.ts
  api/dramas/route.ts
  api/dramas/[id]/route.ts
  api/dramas/[id]/episodes/[episodeNo]/play-url/route.ts
src/
  app/AppShell.tsx
  components/
  lib/
    api/response.ts
    auth/session.ts
    auth/sms-code.ts
    config/env.ts
    db/client.ts
    db/schema.sql
    db/seed.sql
    drama/drama-service.ts
    membership/membership-service.ts
    oss/oss-service.ts
    payment/wechat-service.ts
    sms/aliyun-sms-service.ts
test/
  api-contract.test.cjs
  next-migration.test.cjs
  server-auth.test.cjs
  server-membership.test.cjs
  server-payment.test.cjs
  server-drama.test.cjs
```

## Task 1: Persist Project Standards

**Files:**
- Create: `AGENTS.md`
- Modify: none
- Test: manual readback

- [ ] **Step 1: Verify project standards exist**

Run:

```bash
test -f AGENTS.md && sed -n '1,220p' AGENTS.md
```

Expected: output includes `数据库规范`, `代码规范`, `API 返回规范`, `安全规范`, `测试规范`.

- [ ] **Step 2: Commit standards**

Run:

```bash
git add AGENTS.md
git commit -m "docs: add project implementation standards"
```

Expected: commit succeeds with `AGENTS.md` included.

## Task 2: Convert Tooling From Vite To Next.js

**Files:**
- Modify: `package.json`
- Modify: `tsconfig.json`
- Create: `next.config.mjs`
- Delete: `vite.config.ts`
- Modify: `Dockerfile`
- Test: `test/next-migration.test.cjs`

- [ ] **Step 1: Write failing migration test**

Create `test/next-migration.test.cjs`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

test('project uses Next.js scripts and standalone output', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.scripts.dev, 'next dev');
  assert.equal(pkg.scripts.build, 'next build');
  assert.equal(pkg.scripts.start, 'node .next/standalone/server.js');
  assert.ok(pkg.dependencies.next, 'next dependency should exist');

  const nextConfig = read('next.config.mjs');
  assert.match(nextConfig, /output:\s*'standalone'/);
});

test('Vite config is removed after Next.js migration', () => {
  assert.equal(fs.existsSync(path.join(root, 'vite.config.ts')), false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- test/next-migration.test.cjs
```

Expected: FAIL because package scripts still use Vite and `next.config.mjs` does not exist.

- [ ] **Step 3: Update package scripts and dependencies**

Modify `package.json` scripts and dependencies:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "node .next/standalone/server.js",
    "test": "node --test test/*.test.cjs"
  },
  "dependencies": {
    "@alicloud/dysmsapi20170525": "^3.1.1",
    "ali-oss": "^6.22.0",
    "bcryptjs": "^2.4.3",
    "jose": "^5.9.6",
    "mysql2": "^3.11.5",
    "next": "^14.2.18",
    "qrcode.react": "^4.2.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/node": "^20.17.10",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "typescript": "^5.5.3"
  }
}
```

Run:

```bash
npm install
```

Expected: `package-lock.json` updates and installs Next.js dependencies.

- [ ] **Step 4: Add Next.js config**

Create `next.config.mjs`:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
};

export default nextConfig;
```

- [ ] **Step 5: Update TypeScript config**

Modify `tsconfig.json` to match Next.js:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "es2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 6: Remove Vite config and update Dockerfile**

Delete `vite.config.ts`.

Modify `Dockerfile`:

```Dockerfile
FROM docker.m.daocloud.io/library/node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM docker.m.daocloud.io/library/node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM docker.m.daocloud.io/library/node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

- [ ] **Step 7: Run migration test**

Run:

```bash
npm test -- test/next-migration.test.cjs
```

Expected: PASS.

- [ ] **Step 8: Commit**

Run:

```bash
git add package.json package-lock.json tsconfig.json next.config.mjs Dockerfile test/next-migration.test.cjs
git rm vite.config.ts
git commit -m "chore: migrate build tooling to nextjs"
```

Expected: commit succeeds.

## Task 3: Add Next.js App Shell And Preserve Existing UI

**Files:**
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/drama/[id]/page.tsx`
- Create: `src/app/AppShell.tsx`
- Modify: `src/App.tsx`
- Test: `test/react-pages.test.cjs`

- [ ] **Step 1: Update page migration test**

Modify `test/react-pages.test.cjs` to read Next.js routes:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('Next.js app routes render the existing React shell', () => {
  const homePage = read('app/page.tsx');
  const dramaPage = read('app/drama/[id]/page.tsx');
  const shell = read('src/app/AppShell.tsx');

  assert.match(homePage, /AppShell/);
  assert.match(dramaPage, /AppShell/);
  assert.match(shell, /AppProvider/);
  assert.match(shell, /App/);
});

test('Converted React pages preserve key legacy page content', () => {
  const pages = [
    ['src/components/pages/AboutPage.tsx', ['关于方直智胜', '深圳市方直智胜科技有限公司', '粤ICP备2026044251号']],
    ['src/components/pages/BusinessPage.tsx', ['业务介绍', 'AI 短剧制作', '商务合作']],
    ['src/components/pages/ContactPage.tsx', ['联系我们', 'lanyanfeng@fzzsedu.cn', '0755-86336966']],
  ];

  for (const [file, expectedTexts] of pages) {
    const source = read(file);
    for (const text of expectedTexts) {
      assert.match(source, new RegExp(text), `${file} should include ${text}`);
    }
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- test/react-pages.test.cjs
```

Expected: FAIL because `app/page.tsx` and `src/app/AppShell.tsx` do not exist.

- [ ] **Step 3: Create app shell**

Create `src/app/AppShell.tsx`:

```tsx
'use client';

import App from '../App';
import { AppProvider } from '../context/AppContext';

interface AppShellProps {
  initialDramaId?: string;
}

export default function AppShell({ initialDramaId }: AppShellProps) {
  return (
    <AppProvider initialDramaId={initialDramaId}>
      <App />
    </AppProvider>
  );
}
```

- [ ] **Step 4: Update AppProvider props**

Modify `src/context/AppContext.tsx` provider signature:

```tsx
interface AppProviderProps {
  children: React.ReactNode;
  initialDramaId?: string;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, setState] = useState<AppState>({
    page: 'home',
    modal: 'none',
    user: null,
    selectedDrama: null,
    selectedPlan: null,
  });
```

Keep the rest of the provider behavior unchanged for this task.

- [ ] **Step 5: Create Next.js routes**

Create `app/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '方直智胜',
  description: '方直智胜短剧会员平台',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
```

Create `app/page.tsx`:

```tsx
import AppShell from '@/app/AppShell';

export default function HomePage() {
  return <AppShell />;
}
```

Create `app/drama/[id]/page.tsx`:

```tsx
import AppShell from '@/app/AppShell';

interface DramaPageProps {
  params: {
    id: string;
  };
}

export default function DramaPage({ params }: DramaPageProps) {
  return <AppShell initialDramaId={params.id} />;
}
```

Create `app/globals.css`:

```css
* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  min-height: 100%;
  background: #1a140f;
}

button,
input {
  font: inherit;
}
```

- [ ] **Step 6: Run tests and build**

Run:

```bash
npm test -- test/react-pages.test.cjs
npm run build
```

Expected: tests PASS and build completes. If TypeScript complains about importing client components, keep `AppShell` as the client boundary and do not mark pages as client components.

- [ ] **Step 7: Commit**

Run:

```bash
git add app src/app src/context/AppContext.tsx test/react-pages.test.cjs
git commit -m "feat: add nextjs app shell"
```

Expected: commit succeeds.

## Task 4: Add Shared API Response And Environment Config

**Files:**
- Create: `src/lib/api/response.ts`
- Create: `src/lib/config/env.ts`
- Test: `test/api-contract.test.cjs`

- [ ] **Step 1: Write failing API contract test**

Create `test/api-contract.test.cjs`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

test('API helpers enforce unified success and error envelopes', () => {
  const source = read('src/lib/api/response.ts');
  assert.match(source, /export function ok/);
  assert.match(source, /export function fail/);
  assert.match(source, /data/);
  assert.match(source, /error/);
  assert.match(source, /code/);
  assert.match(source, /message/);
});

test('environment config validates server-only variables centrally', () => {
  const source = read('src/lib/config/env.ts');
  for (const key of [
    'DATABASE_URL',
    'COOKIE_SECRET',
    'ALIYUN_ACCESS_KEY_ID',
    'OSS_BUCKET',
    'WECHAT_PAY_MCH_ID',
  ]) {
    assert.match(source, new RegExp(key));
  }
  assert.doesNotMatch(source, /NEXT_PUBLIC_.*SECRET/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- test/api-contract.test.cjs
```

Expected: FAIL because files do not exist.

- [ ] **Step 3: Add response helpers**

Create `src/lib/api/response.ts`:

```ts
import { NextResponse } from 'next/server';

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
}

export interface ApiSuccessBody<T> {
  data: T;
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiSuccessBody<T>>({ data }, init);
}

export function fail(code: string, message: string, status = 400) {
  return NextResponse.json<ApiErrorBody>({ error: { code, message } }, { status });
}
```

- [ ] **Step 4: Add config module**

Create `src/lib/config/env.ts`:

```ts
import 'server-only';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  COOKIE_SECRET: z.string().min(32),
  ALIYUN_ACCESS_KEY_ID: z.string().min(1),
  ALIYUN_ACCESS_KEY_SECRET: z.string().min(1),
  ALIYUN_SMS_SIGN_NAME: z.string().min(1),
  ALIYUN_SMS_TEMPLATE_CODE: z.string().min(1),
  OSS_REGION: z.string().min(1),
  OSS_BUCKET: z.string().min(1),
  OSS_ACCESS_KEY_ID: z.string().min(1),
  OSS_ACCESS_KEY_SECRET: z.string().min(1),
  OSS_SIGNED_URL_EXPIRES_SECONDS: z.coerce.number().int().positive().default(600),
  WECHAT_PAY_APPID: z.string().min(1),
  WECHAT_PAY_MCH_ID: z.string().min(1),
  WECHAT_PAY_API_V3_KEY: z.string().min(1),
  WECHAT_PAY_PRIVATE_KEY: z.string().min(1),
  WECHAT_PAY_CERT_SERIAL_NO: z.string().min(1),
  WECHAT_PAY_NOTIFY_URL: z.string().url(),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (!cachedEnv) {
    cachedEnv = envSchema.parse(process.env);
  }
  return cachedEnv;
}
```

- [ ] **Step 5: Run test**

Run:

```bash
npm test -- test/api-contract.test.cjs
```

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add src/lib/api/response.ts src/lib/config/env.ts test/api-contract.test.cjs
git commit -m "feat: add api response and env config"
```

Expected: commit succeeds.

## Task 5: Add MySQL Schema, Seed Data, And DB Client

**Files:**
- Create: `src/lib/db/schema.sql`
- Create: `src/lib/db/seed.sql`
- Create: `src/lib/db/client.ts`
- Test: `test/db-schema.test.cjs`

- [ ] **Step 1: Write failing schema test**

Create `test/db-schema.test.cjs`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

test('schema uses uuid ids and required timestamp columns', () => {
  const schema = read('src/lib/db/schema.sql');
  for (const table of ['users', 'sms_codes', 'membership_plans', 'orders', 'dramas', 'episodes']) {
    assert.match(schema, new RegExp(`CREATE TABLE ${table}`));
  }
  assert.match(schema, /id CHAR\(36\) PRIMARY KEY/);
  assert.match(schema, /created_at DATETIME\(3\) NOT NULL/);
  assert.match(schema, /updated_at DATETIME\(3\) NOT NULL/);
  assert.match(schema, /UNIQUE KEY uk_users_phone/);
  assert.match(schema, /UNIQUE KEY uk_orders_order_no/);
  assert.match(schema, /UNIQUE KEY uk_episodes_drama_episode/);
});

test('seed defines the two required membership plans with cents pricing', () => {
  const seed = read('src/lib/db/seed.sql');
  assert.match(seed, /'30d'/);
  assert.match(seed, /'30天会员'/);
  assert.match(seed, /2990/);
  assert.match(seed, /'365d'/);
  assert.match(seed, /'365天会员'/);
  assert.match(seed, /19900/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- test/db-schema.test.cjs
```

Expected: FAIL because schema and seed do not exist.

- [ ] **Step 3: Create schema**

Create `src/lib/db/schema.sql` with all tables from the spec. Use this pattern for every table:

```sql
CREATE TABLE users (
  id CHAR(36) PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  nickname VARCHAR(100) NULL,
  avatar_path VARCHAR(500) NULL,
  vip_expired_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_users_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

Include `sms_codes`, `membership_plans`, `orders`, `wechat_payment_notifications`, `dramas`, `drama_genres`, `episodes`, `cast_members`, and `recommendations`. For `episodes`, include:

```sql
UNIQUE KEY uk_episodes_drama_episode (drama_id, episode_no)
```

For `orders`, include:

```sql
UNIQUE KEY uk_orders_order_no (order_no)
```

- [ ] **Step 4: Create seed data**

Create `src/lib/db/seed.sql`:

```sql
INSERT INTO membership_plans (
  id, code, name, duration_days, price_cents, enabled, sort_order, created_at, updated_at
) VALUES
  (UUID(), '30d', '30天会员', 30, 2990, 1, 1, UTC_TIMESTAMP(3), UTC_TIMESTAMP(3)),
  (UUID(), '365d', '365天会员', 365, 19900, 1, 2, UTC_TIMESTAMP(3), UTC_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  duration_days = VALUES(duration_days),
  price_cents = VALUES(price_cents),
  enabled = VALUES(enabled),
  sort_order = VALUES(sort_order),
  updated_at = UTC_TIMESTAMP(3);
```

- [ ] **Step 5: Add DB client**

Create `src/lib/db/client.ts`:

```ts
import 'server-only';
import mysql from 'mysql2/promise';
import { getEnv } from '../config/env';

let pool: mysql.Pool | null = null;

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      uri: getEnv().DATABASE_URL,
      connectionLimit: 10,
      timezone: 'Z',
      namedPlaceholders: true,
    });
  }
  return pool;
}

export async function query<T>(sql: string, params: Record<string, unknown> = {}) {
  const [rows] = await getPool().execute(sql, params);
  return rows as T[];
}
```

- [ ] **Step 6: Run schema test**

Run:

```bash
npm test -- test/db-schema.test.cjs
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add src/lib/db test/db-schema.test.cjs
git commit -m "feat: add mysql schema and client"
```

Expected: commit succeeds.

## Task 6: Implement SMS Login And Session

**Files:**
- Create: `src/lib/auth/session.ts`
- Create: `src/lib/auth/sms-code.ts`
- Create: `src/lib/sms/aliyun-sms-service.ts`
- Create: `app/api/auth/send-code/route.ts`
- Create: `app/api/auth/login/route.ts`
- Create: `app/api/auth/logout/route.ts`
- Create: `app/api/auth/me/route.ts`
- Test: `test/server-auth.test.cjs`

- [ ] **Step 1: Write failing source-level auth test**

Create `test/server-auth.test.cjs`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

test('auth modules hash codes and use HttpOnly cookies', () => {
  const smsCode = read('src/lib/auth/sms-code.ts');
  const session = read('src/lib/auth/session.ts');
  assert.match(smsCode, /bcrypt/);
  assert.match(smsCode, /expiresAt/);
  assert.match(smsCode, /consumed_at/);
  assert.match(session, /httpOnly:\s*true/);
  assert.match(session, /sameSite:\s*'lax'/);
  assert.match(session, /secure:/);
});

test('auth API routes use unified response helpers', () => {
  for (const file of [
    'app/api/auth/send-code/route.ts',
    'app/api/auth/login/route.ts',
    'app/api/auth/logout/route.ts',
    'app/api/auth/me/route.ts',
  ]) {
    const source = read(file);
    assert.match(source, /ok|fail/, `${file} should use response helper`);
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- test/server-auth.test.cjs
```

Expected: FAIL because auth modules and routes do not exist.

- [ ] **Step 3: Add session helper**

Create `src/lib/auth/session.ts`:

```ts
import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { getEnv } from '../config/env';

const cookieName = 'fzzs_session';

function secretKey() {
  return new TextEncoder().encode(getEnv().COOKIE_SECRET);
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secretKey());

  cookies().set(cookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession() {
  cookies().set(cookieName, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

export async function getSessionUserId() {
  const token = cookies().get(cookieName)?.value;
  if (!token) return null;

  try {
    const verified = await jwtVerify(token, secretKey());
    const userId = verified.payload.userId;
    return typeof userId === 'string' ? userId : null;
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Add SMS code helper**

Create `src/lib/auth/sms-code.ts` with exported functions `createSmsCode`, `verifySmsCode`, and `normalizePhone`. Required behavior:

```ts
import 'server-only';
import bcrypt from 'bcryptjs';
import { randomInt, randomUUID } from 'node:crypto';
import { query } from '../db/client';

export function normalizePhone(phone: string) {
  const trimmed = phone.trim();
  if (!/^1\d{10}$/.test(trimmed)) {
    throw new Error('INVALID_PHONE');
  }
  return trimmed;
}

export async function createSmsCode(phone: string, requestIp: string) {
  const normalized = normalizePhone(phone);
  const code = String(randomInt(100000, 1000000));
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await query(
    `INSERT INTO sms_codes
      (id, phone, code_hash, scene, expires_at, consumed_at, request_ip, created_at, updated_at)
     VALUES
      (:id, :phone, :codeHash, 'login', :expiresAt, NULL, :requestIp, UTC_TIMESTAMP(3), UTC_TIMESTAMP(3))`,
    { id: randomUUID(), phone: normalized, codeHash, expiresAt, requestIp },
  );

  return { phone: normalized, code, expiresAt };
}

export async function verifySmsCode(phone: string, code: string) {
  const normalized = normalizePhone(phone);
  const rows = await query<{ id: string; code_hash: string; expires_at: Date }>(
    `SELECT id, code_hash, expires_at
     FROM sms_codes
     WHERE phone = :phone AND scene = 'login' AND consumed_at IS NULL
     ORDER BY created_at DESC
     LIMIT 1`,
    { phone: normalized },
  );

  const row = rows[0];
  if (!row) return false;
  if (new Date(row.expires_at).getTime() < Date.now()) return false;
  if (!(await bcrypt.compare(code, row.code_hash))) return false;

  await query(`UPDATE sms_codes SET consumed_at = UTC_TIMESTAMP(3), updated_at = UTC_TIMESTAMP(3) WHERE id = :id`, {
    id: row.id,
  });
  return true;
}
```

- [ ] **Step 5: Add Aliyun SMS wrapper**

Create `src/lib/sms/aliyun-sms-service.ts`:

```ts
import 'server-only';
import Dysmsapi from '@alicloud/dysmsapi20170525';
import OpenApi from '@alicloud/openapi-client';
import Util from '@alicloud/tea-util';
import { getEnv } from '../config/env';

export async function sendLoginSms(phone: string, code: string) {
  const env = getEnv();
  const client = new Dysmsapi(
    new OpenApi.Config({
      accessKeyId: env.ALIYUN_ACCESS_KEY_ID,
      accessKeySecret: env.ALIYUN_ACCESS_KEY_SECRET,
      endpoint: 'dysmsapi.aliyuncs.com',
    }),
  );

  await client.sendSmsWithOptions(
    {
      phoneNumbers: phone,
      signName: env.ALIYUN_SMS_SIGN_NAME,
      templateCode: env.ALIYUN_SMS_TEMPLATE_CODE,
      templateParam: JSON.stringify({ code }),
    },
    new Util.RuntimeOptions({}),
  );
}
```

- [ ] **Step 6: Add auth routes**

Create the four route files. `send-code`:

```ts
import { NextRequest } from 'next/server';
import { ok, fail } from '@/lib/api/response';
import { createSmsCode } from '@/lib/auth/sms-code';
import { sendLoginSms } from '@/lib/sms/aliyun-sms-service';

export async function POST(request: NextRequest) {
  const { phone } = await request.json();
  const requestIp = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';

  try {
    const sms = await createSmsCode(phone, requestIp);
    await sendLoginSms(sms.phone, sms.code);
    return ok({ sent: true, expiresAt: sms.expiresAt.toISOString() });
  } catch (error) {
    return fail('SMS_SEND_FAILED', '验证码发送失败', 400);
  }
}
```

`login` must verify the code, create the user if needed, then call `createSession(user.id)`. `logout` calls `clearSession`. `me` returns `null` if not logged in or the user row plus `isVip`.

- [ ] **Step 7: Run tests**

Run:

```bash
npm test -- test/server-auth.test.cjs
npm run build
```

Expected: PASS and build succeeds.

- [ ] **Step 8: Commit**

Run:

```bash
git add src/lib/auth src/lib/sms app/api/auth test/server-auth.test.cjs
git commit -m "feat: add sms login and session"
```

Expected: commit succeeds.

## Task 7: Implement Membership Plans And Expiry Logic

**Files:**
- Create: `src/lib/membership/membership-service.ts`
- Create: `app/api/membership/plans/route.ts`
- Test: `test/server-membership.test.cjs`

- [ ] **Step 1: Write failing membership test**

Create `test/server-membership.test.cjs`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

test('membership service extends from current expiry when still active', () => {
  const source = read('src/lib/membership/membership-service.ts');
  assert.match(source, /calculateNextVipExpiry/);
  assert.match(source, /currentVipExpiredAt/);
  assert.match(source, /durationDays/);
  assert.match(source, /baseTime/);
});

test('membership plans route exposes database-backed plans', () => {
  const source = read('app/api/membership/plans/route.ts');
  assert.match(source, /getEnabledMembershipPlans/);
  assert.match(source, /ok/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- test/server-membership.test.cjs
```

Expected: FAIL because membership service and route do not exist.

- [ ] **Step 3: Add membership service**

Create `src/lib/membership/membership-service.ts`:

```ts
import 'server-only';
import { query } from '../db/client';

export interface MembershipPlan {
  id: string;
  code: string;
  name: string;
  durationDays: number;
  priceCents: number;
  enabled: boolean;
  sortOrder: number;
}

export function calculateNextVipExpiry(
  currentVipExpiredAt: Date | null,
  durationDays: number,
  now = new Date(),
) {
  const baseTime =
    currentVipExpiredAt && currentVipExpiredAt.getTime() > now.getTime() ? currentVipExpiredAt : now;
  return new Date(baseTime.getTime() + durationDays * 24 * 60 * 60 * 1000);
}

export async function getEnabledMembershipPlans() {
  const rows = await query<{
    id: string;
    code: string;
    name: string;
    duration_days: number;
    price_cents: number;
    enabled: number;
    sort_order: number;
  }>(
    `SELECT id, code, name, duration_days, price_cents, enabled, sort_order
     FROM membership_plans
     WHERE enabled = 1
     ORDER BY sort_order ASC`,
  );

  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    durationDays: row.duration_days,
    priceCents: row.price_cents,
    enabled: row.enabled === 1,
    sortOrder: row.sort_order,
  }));
}
```

- [ ] **Step 4: Add plans route**

Create `app/api/membership/plans/route.ts`:

```ts
import { ok } from '@/lib/api/response';
import { getEnabledMembershipPlans } from '@/lib/membership/membership-service';

export async function GET() {
  const plans = await getEnabledMembershipPlans();
  return ok({
    plans: plans.map((plan) => ({
      code: plan.code,
      name: plan.name,
      durationDays: plan.durationDays,
      priceCents: plan.priceCents,
      recommended: plan.code === '365d',
    })),
  });
}
```

- [ ] **Step 5: Run tests**

Run:

```bash
npm test -- test/server-membership.test.cjs
npm run build
```

Expected: PASS and build succeeds.

- [ ] **Step 6: Commit**

Run:

```bash
git add src/lib/membership app/api/membership test/server-membership.test.cjs
git commit -m "feat: add membership plans"
```

Expected: commit succeeds.

## Task 8: Implement WeChat Native Payment Skeleton And Idempotent Callback

**Files:**
- Create: `src/lib/payment/wechat-service.ts`
- Create: `app/api/payments/wechat/native/route.ts`
- Create: `app/api/payments/wechat/status/route.ts`
- Create: `app/api/payments/wechat/notify/route.ts`
- Test: `test/server-payment.test.cjs`

- [ ] **Step 1: Write failing payment test**

Create `test/server-payment.test.cjs`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

test('wechat payment service creates server-priced orders and handles idempotency', () => {
  const source = read('src/lib/payment/wechat-service.ts');
  assert.match(source, /createWechatNativeOrder/);
  assert.match(source, /handleWechatPaymentNotification/);
  assert.match(source, /pending/);
  assert.match(source, /paid/);
  assert.match(source, /calculateNextVipExpiry/);
});

test('wechat payment routes protect user scoped operations', () => {
  for (const file of [
    'app/api/payments/wechat/native/route.ts',
    'app/api/payments/wechat/status/route.ts',
    'app/api/payments/wechat/notify/route.ts',
  ]) {
    const source = read(file);
    assert.match(source, /ok|fail/);
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- test/server-payment.test.cjs
```

Expected: FAIL because payment service and routes do not exist.

- [ ] **Step 3: Add payment service**

Create `src/lib/payment/wechat-service.ts`. Include these exported functions:

```ts
import 'server-only';
import { createSign, randomBytes, randomUUID } from 'node:crypto';
import { query, getPool } from '../db/client';
import { getEnv } from '../config/env';
import { calculateNextVipExpiry } from '../membership/membership-service';

export async function createWechatNativeOrder(userId: string, planCode: string) {
  const plans = await query<{ id: string; code: string; duration_days: number; price_cents: number; name: string }>(
    `SELECT id, code, duration_days, price_cents, name
     FROM membership_plans
     WHERE code = :planCode AND enabled = 1
     LIMIT 1`,
    { planCode },
  );
  const plan = plans[0];
  if (!plan) throw new Error('PLAN_NOT_FOUND');

  const orderNo = `FZZS${Date.now()}${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
  const codeUrl = await requestWechatNativeCodeUrl(orderNo, plan.name, plan.price_cents);

  await query(
    `INSERT INTO orders
      (id, order_no, user_id, plan_id, amount_cents, status, payment_channel, wechat_prepay_id, code_url, paid_at, created_at, updated_at)
     VALUES
      (:id, :orderNo, :userId, :planId, :amountCents, 'pending', 'wechat_native', NULL, :codeUrl, NULL, UTC_TIMESTAMP(3), UTC_TIMESTAMP(3))`,
    { id: randomUUID(), orderNo, userId, planId: plan.id, amountCents: plan.price_cents, codeUrl },
  );

  return { orderNo, codeUrl, amountCents: plan.price_cents };
}

async function requestWechatNativeCodeUrl(orderNo: string, description: string, amountCents: number) {
  const env = getEnv();
  const method = 'POST';
  const path = '/v3/pay/transactions/native';
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = randomBytes(16).toString('hex');
  const body = JSON.stringify({
    appid: env.WECHAT_PAY_APPID,
    mchid: env.WECHAT_PAY_MCH_ID,
    description,
    out_trade_no: orderNo,
    notify_url: env.WECHAT_PAY_NOTIFY_URL,
    amount: {
      total: amountCents,
      currency: 'CNY',
    },
  });
  const message = `${method}\n${path}\n${timestamp}\n${nonce}\n${body}\n`;
  const signature = createSign('RSA-SHA256')
    .update(message)
    .sign(env.WECHAT_PAY_PRIVATE_KEY, 'base64');
  const authorization =
    `WECHATPAY2-SHA256-RSA2048 mchid="${env.WECHAT_PAY_MCH_ID}",` +
    `nonce_str="${nonce}",timestamp="${timestamp}",` +
    `serial_no="${env.WECHAT_PAY_CERT_SERIAL_NO}",signature="${signature}"`;

  const response = await fetch(`https://api.mch.weixin.qq.com${path}`, {
    method,
    headers: {
      Authorization: authorization,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'fzzs-drama-ui',
    },
    body,
  });
  const payload = (await response.json()) as { code_url?: string; message?: string };
  if (!response.ok || !payload.code_url) {
    throw new Error(payload.message ?? 'WECHAT_NATIVE_ORDER_FAILED');
  }
  return payload.code_url;
}

export async function handleWechatPaymentNotification(payload: {
  orderNo: string;
  transactionId: string;
  rawPayload: string;
}) {
  const pool = getPool();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [orderRows] = await connection.execute(
      `SELECT o.id, o.user_id, o.status, u.vip_expired_at, p.duration_days
       FROM orders o
       JOIN users u ON u.id = o.user_id
       JOIN membership_plans p ON p.id = o.plan_id
       WHERE o.order_no = :orderNo
       FOR UPDATE`,
      { orderNo: payload.orderNo },
    );
    const order = (orderRows as Array<{
      id: string;
      user_id: string;
      status: string;
      vip_expired_at: Date | null;
      duration_days: number;
    }>)[0];
    if (!order) throw new Error('ORDER_NOT_FOUND');

    await connection.execute(
      `INSERT INTO wechat_payment_notifications
        (id, order_no, transaction_id, raw_payload, processed_at, created_at, updated_at)
       VALUES
        (:id, :orderNo, :transactionId, :rawPayload, UTC_TIMESTAMP(3), UTC_TIMESTAMP(3), UTC_TIMESTAMP(3))`,
      { id: randomUUID(), orderNo: payload.orderNo, transactionId: payload.transactionId, rawPayload: payload.rawPayload },
    );

    if (order.status === 'paid') {
      await connection.commit();
      return { alreadyProcessed: true };
    }

    const nextExpiry = calculateNextVipExpiry(order.vip_expired_at, order.duration_days);
    await connection.execute(
      `UPDATE users SET vip_expired_at = :nextExpiry, updated_at = UTC_TIMESTAMP(3) WHERE id = :userId`,
      { nextExpiry, userId: order.user_id },
    );
    await connection.execute(
      `UPDATE orders SET status = 'paid', paid_at = UTC_TIMESTAMP(3), updated_at = UTC_TIMESTAMP(3) WHERE id = :orderId`,
      { orderId: order.id },
    );
    await connection.commit();
    return { alreadyProcessed: false };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
```

Keep `requestWechatNativeCodeUrl` as the single boundary for WeChat HTTP API v3. The implementation above signs the Native order request and returns WeChat's `code_url`.

- [ ] **Step 4: Add payment routes**

`native` route must require login and call `createWechatNativeOrder`. `status` route must require login and query only the current user's order. `notify` route must verify WeChat callback headers, decrypt the resource payload with `WECHAT_PAY_API_V3_KEY`, then call `handleWechatPaymentNotification`.

Use this shape for `native`:

```ts
import { NextRequest } from 'next/server';
import { ok, fail } from '@/lib/api/response';
import { getSessionUserId } from '@/lib/auth/session';
import { createWechatNativeOrder } from '@/lib/payment/wechat-service';

export async function POST(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return fail('AUTH_REQUIRED', '请先登录', 401);

  const { planCode } = await request.json();
  const order = await createWechatNativeOrder(userId, planCode);
  return ok(order);
}
```

- [ ] **Step 5: Run tests**

Run:

```bash
npm test -- test/server-payment.test.cjs
npm run build
```

Expected: PASS and build succeeds.

- [ ] **Step 6: Commit**

Run:

```bash
git add src/lib/payment app/api/payments test/server-payment.test.cjs
git commit -m "feat: add wechat native payment flow"
```

Expected: commit succeeds.

## Task 9: Implement Drama Data And OSS Play URL Authorization

**Files:**
- Create: `src/lib/oss/oss-service.ts`
- Create: `src/lib/drama/drama-service.ts`
- Create: `app/api/dramas/route.ts`
- Create: `app/api/dramas/[id]/route.ts`
- Create: `app/api/dramas/[id]/episodes/[episodeNo]/play-url/route.ts`
- Test: `test/server-drama.test.cjs`

- [ ] **Step 1: Write failing drama test**

Create `test/server-drama.test.cjs`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

test('drama service checks episode free flag before returning OSS signed URL', () => {
  const source = read('src/lib/drama/drama-service.ts');
  assert.match(source, /getEpisodePlayUrl/);
  assert.match(source, /is_free/);
  assert.match(source, /vip_expired_at/);
  assert.match(source, /signOssPath/);
});

test('OSS service signs paths without exposing access keys', () => {
  const source = read('src/lib/oss/oss-service.ts');
  assert.match(source, /signOssPath/);
  assert.match(source, /OSS_SIGNED_URL_EXPIRES_SECONDS/);
  assert.doesNotMatch(source, /NEXT_PUBLIC_/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- test/server-drama.test.cjs
```

Expected: FAIL because drama and OSS services do not exist.

- [ ] **Step 3: Add OSS service**

Create `src/lib/oss/oss-service.ts`:

```ts
import 'server-only';
import OSS from 'ali-oss';
import { getEnv } from '../config/env';

let client: OSS | null = null;

function getClient() {
  if (!client) {
    const env = getEnv();
    client = new OSS({
      region: env.OSS_REGION,
      bucket: env.OSS_BUCKET,
      accessKeyId: env.OSS_ACCESS_KEY_ID,
      accessKeySecret: env.OSS_ACCESS_KEY_SECRET,
    });
  }
  return client;
}

export function signOssPath(path: string) {
  const env = getEnv();
  return getClient().signatureUrl(path, {
    expires: env.OSS_SIGNED_URL_EXPIRES_SECONDS,
  });
}
```

- [ ] **Step 4: Add drama service**

Create `src/lib/drama/drama-service.ts` with `getPublishedDramas`, `getDramaDetail`, and `getEpisodePlayUrl`. The play URL function must:

```ts
export async function getEpisodePlayUrl(dramaId: string, episodeNo: number, userId: string | null) {
  const rows = await query<{
    video_path: string;
    is_free: number;
  }>(
    `SELECT e.video_path, e.is_free
     FROM episodes e
     JOIN dramas d ON d.id = e.drama_id
     WHERE d.id = :dramaId AND e.episode_no = :episodeNo AND e.is_published = 1 AND d.is_published = 1
     LIMIT 1`,
    { dramaId, episodeNo },
  );

  const episode = rows[0];
  if (!episode) throw new Error('EPISODE_NOT_FOUND');
  if (episode.is_free === 1) return signOssPath(episode.video_path);
  if (!userId) throw new Error('AUTH_REQUIRED');

  const users = await query<{ vip_expired_at: Date | null }>(
    `SELECT vip_expired_at FROM users WHERE id = :userId LIMIT 1`,
    { userId },
  );
  const vipExpiredAt = users[0]?.vip_expired_at;
  if (!vipExpiredAt || new Date(vipExpiredAt).getTime() <= Date.now()) {
    throw new Error('VIP_REQUIRED');
  }

  return signOssPath(episode.video_path);
}
```

- [ ] **Step 5: Add drama routes**

Create route files that call the drama service and use `ok`/`fail`. For `play-url`, map errors:

```ts
if (error instanceof Error && error.message === 'AUTH_REQUIRED') {
  return fail('AUTH_REQUIRED', '请先登录', 401);
}
if (error instanceof Error && error.message === 'VIP_REQUIRED') {
  return fail('VIP_REQUIRED', '请先开通会员', 403);
}
```

- [ ] **Step 6: Run tests**

Run:

```bash
npm test -- test/server-drama.test.cjs
npm run build
```

Expected: PASS and build succeeds.

- [ ] **Step 7: Commit**

Run:

```bash
git add src/lib/oss src/lib/drama app/api/dramas test/server-drama.test.cjs
git commit -m "feat: add drama oss authorization"
```

Expected: commit succeeds.

## Task 10: Wire Frontend To APIs

**Files:**
- Create: `src/lib/api/client.ts`
- Modify: `src/context/AppContext.tsx`
- Modify: `src/components/LoginModal.tsx`
- Modify: `src/components/VipModal.tsx`
- Modify: `src/components/PaymentModal.tsx`
- Modify: `src/components/HomePage.tsx`
- Modify: `src/components/episode-detail/index.tsx`
- Modify: `src/components/episode-detail/VideoPlayer.tsx`
- Test: `test/frontend-api-wiring.test.cjs`

- [ ] **Step 1: Write failing frontend wiring test**

Create `test/frontend-api-wiring.test.cjs`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

test('login, vip, payment, and playback components call real APIs', () => {
  const login = read('src/components/LoginModal.tsx');
  const vip = read('src/components/VipModal.tsx');
  const payment = read('src/components/PaymentModal.tsx');
  const video = read('src/components/episode-detail/VideoPlayer.tsx');

  assert.match(login, /\/api\/auth\/send-code/);
  assert.match(login, /\/api\/auth\/login/);
  assert.match(vip, /\/api\/membership\/plans/);
  assert.match(payment, /\/api\/payments\/wechat\/native/);
  assert.match(payment, /\/api\/payments\/wechat\/status/);
  assert.match(video, /play-url/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- test/frontend-api-wiring.test.cjs
```

Expected: FAIL because components still use simulated state.

- [ ] **Step 3: Add client API helper**

Create `src/lib/api/client.ts`:

```ts
export async function apiGet<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: 'include' });
  return parseApiResponse<T>(response);
}

export async function apiPost<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return parseApiResponse<T>(response);
}

async function parseApiResponse<T>(response: Response): Promise<T> {
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error?.message ?? '请求失败');
  }
  return payload.data as T;
}
```

- [ ] **Step 4: Update login modal**

Change `sendCode` and `handleSubmit` internals to call:

```ts
await apiPost('/api/auth/send-code', { phone });
await apiPost('/api/auth/login', { phone, code });
```

After login succeeds, call `/api/auth/me` or update context from login response.

- [ ] **Step 5: Update VIP and payment modals**

`VipModal` should load plans from `/api/membership/plans`. `PaymentModal` should call:

```ts
const order = await apiPost<{ orderNo: string; codeUrl: string; amountCents: number }>(
  '/api/payments/wechat/native',
  { planCode: selectedPlan.code },
);
```

Render a QR code from `order.codeUrl` using `qrcode.react`, then poll:

```ts
await apiGet<{ status: string }>(`/api/payments/wechat/status?orderNo=${encodeURIComponent(order.orderNo)}`);
```

- [ ] **Step 6: Update drama playback**

When an episode is selected, call:

```ts
await apiGet<{ url: string }>(`/api/dramas/${drama.id}/episodes/${episodeNo}/play-url`);
```

Pass the returned URL to `VideoPlayer`.

- [ ] **Step 7: Run tests and build**

Run:

```bash
npm test -- test/frontend-api-wiring.test.cjs
npm run build
```

Expected: PASS and build succeeds.

- [ ] **Step 8: Commit**

Run:

```bash
git add src/lib/api/client.ts src/context/AppContext.tsx src/components test/frontend-api-wiring.test.cjs
git commit -m "feat: wire frontend to backend apis"
```

Expected: commit succeeds.

## Task 11: Add GitHub Actions SAE Deployment

**Files:**
- Create: `.github/workflows/deploy-sae.yml`
- Modify: `README.md`
- Test: `test/deploy-config.test.cjs`

- [ ] **Step 1: Write failing deployment config test**

Create `test/deploy-config.test.cjs`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

test('deployment workflow builds docker image and references SAE deployment', () => {
  const workflow = read('.github/workflows/deploy-sae.yml');
  assert.match(workflow, /docker build/);
  assert.match(workflow, /docker push/);
  assert.match(workflow, /SAE/);
  assert.match(workflow, /npm test/);
  assert.match(workflow, /npm run build/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- test/deploy-config.test.cjs
```

Expected: FAIL because workflow does not exist.

- [ ] **Step 3: Add deployment workflow**

Create `.github/workflows/deploy-sae.yml`:

```yaml
name: Deploy SAE

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install
        run: npm ci

      - name: Test
        run: npm test

      - name: Build
        run: npm run build

      - name: Login Registry
        run: echo "${{ secrets.ACR_PASSWORD }}" | docker login "${{ secrets.ACR_REGISTRY }}" -u "${{ secrets.ACR_USERNAME }}" --password-stdin

      - name: Build Docker Image
        run: docker build -t "${{ secrets.ACR_IMAGE }}:${{ github.sha }}" .

      - name: Push Docker Image
        run: docker push "${{ secrets.ACR_IMAGE }}:${{ github.sha }}"

      - name: Install Aliyun CLI
        run: |
          curl -fsSL https://aliyuncli.alicdn.com/install.sh | bash
          echo "$HOME/bin" >> "$GITHUB_PATH"

      - name: Configure Aliyun CLI
        run: |
          aliyun configure set \
            --profile default \
            --mode AK \
            --region "${{ secrets.SAE_REGION_ID }}" \
            --access-key-id "${{ secrets.ALIYUN_ACCESS_KEY_ID }}" \
            --access-key-secret "${{ secrets.ALIYUN_ACCESS_KEY_SECRET }}"

      - name: Deploy SAE
        run: |
          aliyun sae DeployApplication \
            --RegionId "${{ secrets.SAE_REGION_ID }}" \
            --AppId "${{ secrets.SAE_APP_ID }}" \
            --ImageUrl "${{ secrets.ACR_IMAGE }}:${{ github.sha }}"
```

Required GitHub Secrets: `ACR_REGISTRY`, `ACR_USERNAME`, `ACR_PASSWORD`, `ACR_IMAGE`, `ALIYUN_ACCESS_KEY_ID`, `ALIYUN_ACCESS_KEY_SECRET`, `SAE_REGION_ID`, `SAE_APP_ID`.

- [ ] **Step 4: Update README deployment notes**

Add required environment variables and GitHub Secrets to `README.md`. Include all names from the spec, and state that business secrets are configured in SAE rather than committed to GitHub.

- [ ] **Step 5: Run tests**

Run:

```bash
npm test -- test/deploy-config.test.cjs
```

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add .github/workflows/deploy-sae.yml README.md test/deploy-config.test.cjs
git commit -m "ci: add sae deployment workflow"
```

Expected: commit succeeds.

## Task 12: Final Verification

**Files:**
- Modify only files needed to fix verification failures.
- Test: all tests and production build.

- [ ] **Step 1: Run full tests**

Run:

```bash
npm test
```

Expected: all `node:test` suites PASS.

- [ ] **Step 2: Run production build**

Run:

```bash
npm run build
```

Expected: Next.js build succeeds and `.next/standalone/server.js` exists.

- [ ] **Step 3: Build Docker image**

Run:

```bash
docker build -t fzzs-drama-ui:local .
```

Expected: Docker image builds successfully.

- [ ] **Step 4: Run local container smoke test**

Run:

```bash
docker run --rm -p 3000:3000 \
  -e DATABASE_URL='mysql://user:password@localhost:3306/fzzs' \
  -e COOKIE_SECRET='local-dev-cookie-secret-local-dev-cookie-secret' \
  -e ALIYUN_ACCESS_KEY_ID='local' \
  -e ALIYUN_ACCESS_KEY_SECRET='local' \
  -e ALIYUN_SMS_SIGN_NAME='local' \
  -e ALIYUN_SMS_TEMPLATE_CODE='local' \
  -e OSS_REGION='oss-cn-shenzhen' \
  -e OSS_BUCKET='local' \
  -e OSS_ACCESS_KEY_ID='local' \
  -e OSS_ACCESS_KEY_SECRET='local' \
  -e OSS_SIGNED_URL_EXPIRES_SECONDS='600' \
  -e WECHAT_PAY_APPID='local' \
  -e WECHAT_PAY_MCH_ID='local' \
  -e WECHAT_PAY_API_V3_KEY='local' \
  -e WECHAT_PAY_PRIVATE_KEY='local' \
  -e WECHAT_PAY_CERT_SERIAL_NO='local' \
  -e WECHAT_PAY_NOTIFY_URL='https://example.com/api/payments/wechat/notify' \
  -e NEXT_PUBLIC_SITE_URL='http://localhost:3000' \
  fzzs-drama-ui:local
```

Expected: server starts on port 3000. Stop it after confirming startup.

- [ ] **Step 5: Commit verification fixes**

If verification required fixes, commit them:

```bash
git add .
git commit -m "fix: stabilize nextjs membership drama verification"
```

Expected: no commit is needed if no files changed.

## Self-Review

- Spec coverage: plan covers standards, Next.js migration, DB schema, auth, membership, WeChat Native order flow, OSS play authorization, frontend API wiring, SAE deployment, and final verification.
- Completeness scan: no unresolved markers are used. Deployment uses explicit GitHub Secrets for ACR and SAE rather than hard-coded account IDs.
- Type consistency: API response shape uses `{ data }` and `{ error: { code, message } }`; database uses `snake_case`; service return objects use `camelCase`; membership plan codes are `30d` and `365d`.
