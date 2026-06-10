# Admin Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an admin backend for administrator and organization accounts, organization review, direct-to-OSS uploads, and drama publishing review.

**Architecture:** Keep the project as one Next.js App Router application. Add an isolated admin account/session domain, place backend business logic under `src/lib/admin-*`, expose admin APIs under `app/api/admin/**`, and add `/admin` pages using Tailwind plus shadcn-style components customized with the existing `brand.*` theme colors.

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript, Prisma 7, MariaDB/MySQL, Tailwind CSS, bcryptjs, jose, zod, ali-oss, node:test.

---

## File Map

- Create `prisma/migrations/0002_admin_backend/migration.sql`: SQL migration for admin accounts, organizations, and drama ownership/review fields.
- Modify `prisma/schema.prisma`: Prisma models and relations for the new tables and drama fields.
- Modify `prisma/seed.ts`: create default admin and assign existing seed dramas to that admin.
- Modify `src/lib/config/env.ts`: add default admin and optional upload-related env validation.
- Create `src/lib/admin-auth/session.ts`: admin JWT cookie helpers.
- Create `src/lib/admin-auth/password.ts`: password hashing and verification.
- Create `src/lib/admin-auth/service.ts`: admin login and current admin lookup.
- Create `src/lib/admin-auth/require-admin.ts`: API guard helpers for admin and organization roles.
- Create `src/lib/admin/organization-service.ts`: organization registration, admin creation, review, and access checks.
- Create `src/lib/admin/drama-admin-service.ts`: admin drama CRUD, submit, approve, reject, and ownership checks.
- Create `src/lib/admin/episode-admin-service.ts`: episode CRUD under a drama ownership boundary.
- Create `src/lib/admin-upload/upload-service.ts`: OSS upload policy generation and path-prefix validation.
- Create `app/api/admin/auth/login/route.ts`, `app/api/admin/auth/logout/route.ts`, `app/api/admin/auth/me/route.ts`: admin auth APIs.
- Create `app/api/admin/register/route.ts`: organization self-registration API.
- Create `app/api/admin/organizations/route.ts`, `app/api/admin/organizations/[id]/route.ts`, `app/api/admin/organizations/[id]/review/route.ts`: organization APIs.
- Create `app/api/admin/uploads/policy/route.ts`: upload authorization API.
- Create `app/api/admin/dramas/route.ts`, `app/api/admin/dramas/[id]/route.ts`, `app/api/admin/dramas/[id]/submit/route.ts`, `app/api/admin/dramas/[id]/review/route.ts`: drama admin APIs.
- Create `app/api/admin/dramas/[id]/episodes/route.ts`, `app/api/admin/dramas/[id]/episodes/[episodeId]/route.ts`: episode admin APIs.
- Create `src/lib/admin-ui/api.ts`: client helpers for admin pages.
- Create `src/components/admin/*`: admin layout, sidebar, status badge, form field, data table, upload field, review panel.
- Create `app/admin/layout.tsx`, `app/admin/login/page.tsx`, `app/admin/register/page.tsx`, `app/admin/page.tsx`, `app/admin/organizations/page.tsx`, `app/admin/organizations/[id]/page.tsx`, `app/admin/dramas/page.tsx`, `app/admin/dramas/new/page.tsx`, `app/admin/dramas/[id]/page.tsx`, `app/admin/dramas/[id]/episodes/page.tsx`: admin UI pages.
- Create or modify tests under `test/*.test.cjs`: schema, seed, auth, organization, upload, drama admin, UI wiring, and API contract coverage.

---

## Task 1: Database Schema And Seed

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/0002_admin_backend/migration.sql`
- Modify: `prisma/seed.ts`
- Modify: `src/lib/config/env.ts`
- Modify: `test/db-schema.test.cjs`
- Create: `test/admin-seed.test.cjs`

- [ ] **Step 1: Add failing schema tests**

Add these tests to `test/db-schema.test.cjs`:

```js
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
```

- [ ] **Step 2: Add failing seed tests**

Create `test/admin-seed.test.cjs`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

test('seed creates the default admin account with a hashed password', () => {
  const source = read('prisma/seed.ts');

  assert.match(source, /DEFAULT_ADMIN_ID/);
  assert.match(source, /adminUser\.upsert/);
  assert.match(source, /hashAdminPassword/);
  assert.doesNotMatch(source, /passwordHash:\s*['"][^'"]+['"]/);
});

test('seed assigns existing dramas to the default admin', () => {
  const source = read('prisma/seed.ts');

  assert.match(source, /ownerType:\s*'admin'/);
  assert.match(source, /ownerAdminUserId:\s*DEFAULT_ADMIN_ID/);
  assert.match(source, /reviewStatus:\s*'approved'/);
});
```

- [ ] **Step 3: Run tests and verify failure**

Run:

```bash
npm test -- test/db-schema.test.cjs test/admin-seed.test.cjs
```

Expected: fail because models, migration, and seed admin do not exist.

- [ ] **Step 4: Update Prisma schema**

Add these models and fields to `prisma/schema.prisma`:

```prisma
model AdminUser {
  id             String        @id @db.Char(36)
  phone          String        @unique @db.VarChar(32)
  passwordHash   String        @map("password_hash") @db.VarChar(255)
  role           String        @db.VarChar(32)
  displayName    String        @map("display_name") @db.VarChar(100)
  organizationId String?       @map("organization_id") @db.Char(36)
  status         String        @default("active") @db.VarChar(32)
  lastLoginAt    DateTime?     @map("last_login_at") @db.DateTime(3)
  createdAt      DateTime      @default(now()) @map("created_at") @db.DateTime(3)
  updatedAt      DateTime      @updatedAt @map("updated_at") @db.DateTime(3)
  organization   Organization? @relation(fields: [organizationId], references: [id])
  reviewedOrganizations Organization[] @relation("OrganizationReviewer")
  reviewedDramas Drama[] @relation("DramaReviewer")
  ownedDramas    Drama[] @relation("DramaOwnerAdmin")

  @@index([organizationId], name: "idx_admin_users_organization_id")
  @@map("admin_users")
}

model Organization {
  id                  String      @id @db.Char(36)
  name                String      @db.VarChar(150)
  contactName         String      @map("contact_name") @db.VarChar(100)
  contactPhone        String      @map("contact_phone") @db.VarChar(32)
  email               String?     @db.VarChar(150)
  creditCode          String      @unique @map("credit_code") @db.VarChar(64)
  address             String?     @db.VarChar(255)
  description         String?     @db.Text
  businessLicensePath String      @map("business_license_path") @db.VarChar(255)
  status              String      @default("pending") @db.VarChar(32)
  reviewedByAdminUserId String?   @map("reviewed_by_admin_user_id") @db.Char(36)
  reviewedAt          DateTime?   @map("reviewed_at") @db.DateTime(3)
  rejectReason        String?     @map("reject_reason") @db.VarChar(500)
  createdAt           DateTime    @default(now()) @map("created_at") @db.DateTime(3)
  updatedAt           DateTime    @updatedAt @map("updated_at") @db.DateTime(3)
  accounts            AdminUser[]
  dramas              Drama[]
  reviewedBy          AdminUser?  @relation("OrganizationReviewer", fields: [reviewedByAdminUserId], references: [id])

  @@index([status], name: "idx_organizations_status")
  @@index([reviewedByAdminUserId], name: "idx_organizations_reviewed_by")
  @@map("organizations")
}
```

Extend `Drama` with these fields and relations:

```prisma
  ownerType             String        @default("admin") @map("owner_type") @db.VarChar(32)
  ownerAdminUserId      String?       @map("owner_admin_user_id") @db.Char(36)
  organizationId        String?       @map("organization_id") @db.Char(36)
  reviewStatus          String        @default("draft") @map("review_status") @db.VarChar(32)
  submittedAt           DateTime?     @map("submitted_at") @db.DateTime(3)
  reviewedByAdminUserId String?       @map("reviewed_by_admin_user_id") @db.Char(36)
  reviewedAt            DateTime?     @map("reviewed_at") @db.DateTime(3)
  reviewRejectReason    String?       @map("review_reject_reason") @db.VarChar(500)
  ownerAdmin            AdminUser?    @relation("DramaOwnerAdmin", fields: [ownerAdminUserId], references: [id])
  organization          Organization? @relation(fields: [organizationId], references: [id])
  reviewedBy            AdminUser?    @relation("DramaReviewer", fields: [reviewedByAdminUserId], references: [id])
```

Add `@@index` entries in `Drama`:

```prisma
  @@index([ownerAdminUserId], name: "idx_dramas_owner_admin_user_id")
  @@index([organizationId], name: "idx_dramas_organization_id")
  @@index([reviewStatus], name: "idx_dramas_review_status")
```

- [ ] **Step 5: Create SQL migration**

Create `prisma/migrations/0002_admin_backend/migration.sql`:

```sql
CREATE TABLE IF NOT EXISTS `organizations` (
  `id` CHAR(36) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `contact_name` VARCHAR(100) NOT NULL,
  `contact_phone` VARCHAR(32) NOT NULL,
  `email` VARCHAR(150) NULL,
  `credit_code` VARCHAR(64) NOT NULL,
  `address` VARCHAR(255) NULL,
  `description` TEXT NULL,
  `business_license_path` VARCHAR(255) NOT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'pending',
  `reviewed_by_admin_user_id` CHAR(36) NULL,
  `reviewed_at` DATETIME(3) NULL,
  `reject_reason` VARCHAR(500) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_organizations_credit_code` (`credit_code`),
  KEY `idx_organizations_status` (`status`),
  KEY `idx_organizations_reviewed_by` (`reviewed_by_admin_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `admin_users` (
  `id` CHAR(36) NOT NULL,
  `phone` VARCHAR(32) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` VARCHAR(32) NOT NULL,
  `display_name` VARCHAR(100) NOT NULL,
  `organization_id` CHAR(36) NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'active',
  `last_login_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_admin_users_phone` (`phone`),
  KEY `idx_admin_users_organization_id` (`organization_id`),
  CONSTRAINT `fk_admin_users_organization_id` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `organizations`
  ADD CONSTRAINT `fk_organizations_reviewed_by`
  FOREIGN KEY (`reviewed_by_admin_user_id`) REFERENCES `admin_users` (`id`);

ALTER TABLE `dramas`
  ADD COLUMN `owner_type` VARCHAR(32) NOT NULL DEFAULT 'admin',
  ADD COLUMN `owner_admin_user_id` CHAR(36) NULL,
  ADD COLUMN `organization_id` CHAR(36) NULL,
  ADD COLUMN `review_status` VARCHAR(32) NOT NULL DEFAULT 'draft',
  ADD COLUMN `submitted_at` DATETIME(3) NULL,
  ADD COLUMN `reviewed_by_admin_user_id` CHAR(36) NULL,
  ADD COLUMN `reviewed_at` DATETIME(3) NULL,
  ADD COLUMN `review_reject_reason` VARCHAR(500) NULL,
  ADD KEY `idx_dramas_owner_admin_user_id` (`owner_admin_user_id`),
  ADD KEY `idx_dramas_organization_id` (`organization_id`),
  ADD KEY `idx_dramas_review_status` (`review_status`),
  ADD CONSTRAINT `fk_dramas_owner_admin_user_id` FOREIGN KEY (`owner_admin_user_id`) REFERENCES `admin_users` (`id`),
  ADD CONSTRAINT `fk_dramas_organization_id` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
  ADD CONSTRAINT `fk_dramas_reviewed_by_admin_user_id` FOREIGN KEY (`reviewed_by_admin_user_id`) REFERENCES `admin_users` (`id`);
```

- [ ] **Step 6: Add default admin env fields**

In `src/lib/config/env.ts`, add these fields:

```ts
  DEFAULT_ADMIN_PHONE: z.string().min(1).default('13800000000'),
  DEFAULT_ADMIN_PASSWORD: z.string().min(8).default('Admin123456'),
  DEFAULT_ADMIN_DISPLAY_NAME: z.string().min(1).default('系统管理员'),
```

- [ ] **Step 7: Update seed**

In `prisma/seed.ts`, import `bcryptjs`, define constants, and seed the admin:

```ts
import bcrypt from 'bcryptjs';

const DEFAULT_ADMIN_ID = '00000000-0000-4000-8000-000000000001';

async function hashAdminPassword(password: string) {
  return bcrypt.hash(password, 10);
}
```

At the start of `main()`:

```ts
  const defaultAdminPhone = process.env.DEFAULT_ADMIN_PHONE || '13800000000';
  const defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin123456';
  const defaultAdminDisplayName = process.env.DEFAULT_ADMIN_DISPLAY_NAME || '系统管理员';
  const defaultAdminPasswordHash = await hashAdminPassword(defaultAdminPassword);

  await prisma.adminUser.upsert({
    where: { phone: defaultAdminPhone },
    create: {
      id: DEFAULT_ADMIN_ID,
      phone: defaultAdminPhone,
      passwordHash: defaultAdminPasswordHash,
      role: 'admin',
      displayName: defaultAdminDisplayName,
      status: 'active',
    },
    update: {
      displayName: defaultAdminDisplayName,
      role: 'admin',
      status: 'active',
    },
  });
```

For each existing `prisma.drama.upsert({ create: ... })`, add:

```ts
ownerType: 'admin',
ownerAdminUserId: DEFAULT_ADMIN_ID,
reviewStatus: 'approved',
reviewedByAdminUserId: DEFAULT_ADMIN_ID,
reviewedAt: new Date(),
```

For each existing `update` object, add:

```ts
ownerType: 'admin',
ownerAdminUserId: DEFAULT_ADMIN_ID,
reviewStatus: 'approved',
```

- [ ] **Step 8: Verify tests pass**

Run:

```bash
npm test -- test/db-schema.test.cjs test/admin-seed.test.cjs
```

Expected: pass.

- [ ] **Step 9: Generate Prisma client**

Run:

```bash
npx prisma generate
```

Expected: Prisma client generation succeeds.

- [ ] **Step 10: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/0002_admin_backend/migration.sql prisma/seed.ts src/lib/config/env.ts test/db-schema.test.cjs test/admin-seed.test.cjs
git commit -m "feat: add admin backend schema"
```

---

## Task 2: Admin Auth Services And APIs

**Files:**
- Create: `src/lib/admin-auth/password.ts`
- Create: `src/lib/admin-auth/session.ts`
- Create: `src/lib/admin-auth/service.ts`
- Create: `src/lib/admin-auth/require-admin.ts`
- Create: `app/api/admin/auth/login/route.ts`
- Create: `app/api/admin/auth/logout/route.ts`
- Create: `app/api/admin/auth/me/route.ts`
- Create: `test/admin-auth.test.cjs`
- Modify: `test/api-contract.test.cjs`

- [ ] **Step 1: Write failing auth tests**

Create `test/admin-auth.test.cjs`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

test('admin password helper hashes and verifies passwords', () => {
  const source = read('src/lib/admin-auth/password.ts');

  assert.match(source, /bcrypt/);
  assert.match(source, /hashAdminPassword/);
  assert.match(source, /verifyAdminPassword/);
});

test('admin session uses a separate httpOnly cookie', () => {
  const source = read('src/lib/admin-auth/session.ts');

  assert.match(source, /ADMIN_SESSION_COOKIE_NAME\s*=\s*'fzzs_admin_session'/);
  assert.match(source, /httpOnly:\s*true/);
  assert.match(source, /sameSite:\s*'lax'/);
});

test('admin auth routes use unified response helpers', () => {
  for (const file of [
    'app/api/admin/auth/login/route.ts',
    'app/api/admin/auth/logout/route.ts',
    'app/api/admin/auth/me/route.ts',
  ]) {
    const source = read(file);
    assert.match(source, /\bok\s*\(/);
    assert.match(source, /\bfail\s*\(/);
  }
});

test('admin guard distinguishes admin role and organization role', () => {
  const source = read('src/lib/admin-auth/require-admin.ts');

  assert.match(source, /requireAdminSession/);
  assert.match(source, /requireAdminRole/);
  assert.match(source, /requireOrganizationRole/);
  assert.match(source, /ADMIN_FORBIDDEN/);
});
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
npm test -- test/admin-auth.test.cjs
```

Expected: fail because files do not exist.

- [ ] **Step 3: Implement password helper**

Create `src/lib/admin-auth/password.ts`:

```ts
import 'server-only';

import bcrypt from 'bcryptjs';

const ADMIN_PASSWORD_SALT_ROUNDS = 10;

export async function hashAdminPassword(password: string) {
  return bcrypt.hash(password, ADMIN_PASSWORD_SALT_ROUNDS);
}

export async function verifyAdminPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}
```

- [ ] **Step 4: Implement admin session helper**

Create `src/lib/admin-auth/session.ts`:

```ts
import 'server-only';

import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { getEnv } from '@/lib/config/env';

export const ADMIN_SESSION_COOKIE_NAME = 'fzzs_admin_session';
const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function getSessionSecret() {
  return new TextEncoder().encode(getEnv().COOKIE_SECRET);
}

export async function createAdminSession(adminUserId: string) {
  const token = await new SignJWT({ scope: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(adminUserId)
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_SESSION_MAX_AGE}s`)
    .sign(getSessionSecret());

  cookies().set(ADMIN_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ADMIN_SESSION_MAX_AGE,
  });
}

export function clearAdminSession() {
  cookies().set(ADMIN_SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

export async function getAdminSessionUserId() {
  const token = cookies().get(ADMIN_SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSessionSecret());
    return payload.scope === 'admin' && typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}
```

- [ ] **Step 5: Implement auth service**

Create `src/lib/admin-auth/service.ts`:

```ts
import 'server-only';

import { prisma } from '@/lib/db/prisma';
import { verifyAdminPassword } from '@/lib/admin-auth/password';
import { getAdminSessionUserId } from '@/lib/admin-auth/session';

export interface CurrentAdminUser {
  id: string;
  phone: string;
  role: string;
  displayName: string;
  organizationId: string | null;
  status: string;
  organizationStatus: string | null;
}

export async function authenticateAdmin(phone: string, password: string) {
  const account = await prisma.adminUser.findUnique({
    where: { phone },
    include: { organization: true },
  });

  if (!account) return null;

  const passwordOk = await verifyAdminPassword(password, account.passwordHash);
  if (!passwordOk) return null;
  if (account.status === 'disabled') return null;

  await prisma.adminUser.update({
    where: { id: account.id },
    data: { lastLoginAt: new Date() },
  });

  return mapCurrentAdminUser(account);
}

export async function getCurrentAdminUser(): Promise<CurrentAdminUser | null> {
  const id = await getAdminSessionUserId();
  if (!id) return null;

  const account = await prisma.adminUser.findUnique({
    where: { id },
    include: { organization: true },
  });

  if (!account || account.status === 'disabled') return null;

  return mapCurrentAdminUser(account);
}

function mapCurrentAdminUser(account: {
  id: string;
  phone: string;
  role: string;
  displayName: string;
  organizationId: string | null;
  status: string;
  organization: { status: string } | null;
}): CurrentAdminUser {
  return {
    id: account.id,
    phone: account.phone,
    role: account.role,
    displayName: account.displayName,
    organizationId: account.organizationId,
    status: account.status,
    organizationStatus: account.organization?.status || null,
  };
}
```

- [ ] **Step 6: Implement guard helpers**

Create `src/lib/admin-auth/require-admin.ts`:

```ts
import 'server-only';

import { getCurrentAdminUser, type CurrentAdminUser } from '@/lib/admin-auth/service';

export function createAdminAuthError(code: string, message: string, status = 401) {
  const error = new Error(message) as Error & { code: string; status: number };
  error.code = code;
  error.status = status;
  return error;
}

export async function requireAdminSession(): Promise<CurrentAdminUser> {
  const user = await getCurrentAdminUser();
  if (!user) {
    throw createAdminAuthError('ADMIN_AUTH_REQUIRED', '请先登录后台', 401);
  }
  return user;
}

export async function requireAdminRole() {
  const user = await requireAdminSession();
  if (user.role !== 'admin') {
    throw createAdminAuthError('ADMIN_FORBIDDEN', '无权执行该操作', 403);
  }
  return user;
}

export async function requireOrganizationRole() {
  const user = await requireAdminSession();
  if (user.role !== 'organization') {
    throw createAdminAuthError('ADMIN_FORBIDDEN', '无权执行该操作', 403);
  }
  return user;
}

export function assertApprovedOrganization(user: CurrentAdminUser) {
  if (user.role === 'organization' && user.organizationStatus !== 'approved') {
    throw createAdminAuthError('ORGANIZATION_PENDING_REVIEW', '机构尚未审核通过', 403);
  }
}
```

- [ ] **Step 7: Implement auth routes**

Create `app/api/admin/auth/login/route.ts`:

```ts
import { z } from 'zod';
import { ok, fail } from '@/lib/api/response';
import { authenticateAdmin } from '@/lib/admin-auth/service';
import { createAdminSession } from '@/lib/admin-auth/session';

const loginSchema = z.object({
  phone: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const input = loginSchema.parse(await request.json());
    const user = await authenticateAdmin(input.phone, input.password);

    if (!user) {
      return fail('ADMIN_INVALID_CREDENTIALS', '手机号或密码错误', 401);
    }

    await createAdminSession(user.id);
    return ok({ user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail('INVALID_REQUEST', '请求参数错误', 400);
    }
    return fail('ADMIN_LOGIN_FAILED', '后台登录失败', 500, error);
  }
}
```

Create `app/api/admin/auth/logout/route.ts`:

```ts
import { ok } from '@/lib/api/response';
import { clearAdminSession } from '@/lib/admin-auth/session';

export async function POST() {
  clearAdminSession();
  return ok({ success: true });
}
```

Create `app/api/admin/auth/me/route.ts`:

```ts
import { ok, fail } from '@/lib/api/response';
import { getCurrentAdminUser } from '@/lib/admin-auth/service';

export async function GET() {
  const user = await getCurrentAdminUser();
  if (!user) {
    return fail('ADMIN_AUTH_REQUIRED', '请先登录后台', 401);
  }
  return ok({ user });
}
```

- [ ] **Step 8: Verify tests pass**

Run:

```bash
npm test -- test/admin-auth.test.cjs
```

Expected: pass.

- [ ] **Step 9: Commit**

```bash
git add src/lib/admin-auth app/api/admin/auth test/admin-auth.test.cjs test/api-contract.test.cjs
git commit -m "feat: add admin authentication"
```

---

## Task 3: Organization Registration And Review

**Files:**
- Create: `src/lib/admin/organization-service.ts`
- Create: `app/api/admin/register/route.ts`
- Create: `app/api/admin/organizations/route.ts`
- Create: `app/api/admin/organizations/[id]/route.ts`
- Create: `app/api/admin/organizations/[id]/review/route.ts`
- Create: `test/admin-organization.test.cjs`

- [ ] **Step 1: Write failing organization tests**

Create `test/admin-organization.test.cjs`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

test('organization service supports registration, admin creation, and review', () => {
  const source = read('src/lib/admin/organization-service.ts');

  assert.match(source, /registerOrganization/);
  assert.match(source, /createOrganizationByAdmin/);
  assert.match(source, /reviewOrganization/);
  assert.match(source, /hashAdminPassword/);
  assert.match(source, /businessLicensePath/);
});

test('organization APIs require admin role for list and review', () => {
  const listRoute = read('app/api/admin/organizations/route.ts');
  const reviewRoute = read('app/api/admin/organizations/[id]/review/route.ts');

  assert.match(listRoute, /requireAdminRole/);
  assert.match(reviewRoute, /requireAdminRole/);
});

test('register API creates pending organization account', () => {
  const route = read('app/api/admin/register/route.ts');

  assert.match(route, /registerOrganization/);
  assert.match(route, /ok\s*\(/);
  assert.match(route, /fail\s*\(/);
});
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
npm test -- test/admin-organization.test.cjs
```

Expected: fail because organization service and routes do not exist.

- [ ] **Step 3: Implement organization service schemas and mapper**

Create `src/lib/admin/organization-service.ts` with this top section:

```ts
import 'server-only';

import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { hashAdminPassword } from '@/lib/admin-auth/password';

export const organizationInputSchema = z.object({
  name: z.string().min(1).max(150),
  contactName: z.string().min(1).max(100),
  contactPhone: z.string().min(1).max(32),
  email: z.string().email().optional().or(z.literal('')),
  creditCode: z.string().min(1).max(64),
  address: z.string().max(255).optional().or(z.literal('')),
  description: z.string().max(5000).optional().or(z.literal('')),
  businessLicensePath: z.string().min(1).max(255),
});

export const organizationRegisterSchema = organizationInputSchema.extend({
  password: z.string().min(8).max(100),
});

export const organizationReviewSchema = z.object({
  action: z.enum(['approve', 'reject']),
  reason: z.string().max(500).optional(),
});

function normalizeOptional(value: string | undefined) {
  return value && value.trim() ? value.trim() : null;
}

function mapOrganization(row: {
  id: string;
  name: string;
  contactName: string;
  contactPhone: string;
  email: string | null;
  creditCode: string;
  address: string | null;
  description: string | null;
  businessLicensePath: string;
  status: string;
  rejectReason: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    name: row.name,
    contactName: row.contactName,
    contactPhone: row.contactPhone,
    email: row.email,
    creditCode: row.creditCode,
    address: row.address,
    description: row.description,
    businessLicensePath: row.businessLicensePath,
    status: row.status,
    rejectReason: row.rejectReason,
    reviewedAt: row.reviewedAt ? row.reviewedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
```

- [ ] **Step 4: Implement registration and admin creation**

Add to `src/lib/admin/organization-service.ts`:

```ts
export async function registerOrganization(input: z.infer<typeof organizationRegisterSchema>) {
  const data = organizationRegisterSchema.parse(input);
  const organizationId = randomUUID();
  const accountId = randomUUID();
  const passwordHash = await hashAdminPassword(data.password);

  const organization = await prisma.$transaction(async (tx) => {
    const createdOrganization = await tx.organization.create({
      data: {
        id: organizationId,
        name: data.name,
        contactName: data.contactName,
        contactPhone: data.contactPhone,
        email: normalizeOptional(data.email),
        creditCode: data.creditCode,
        address: normalizeOptional(data.address),
        description: normalizeOptional(data.description),
        businessLicensePath: data.businessLicensePath,
        status: 'pending',
      },
    });

    await tx.adminUser.create({
      data: {
        id: accountId,
        phone: data.contactPhone,
        passwordHash,
        role: 'organization',
        displayName: data.name,
        organizationId,
        status: 'pending',
      },
    });

    return createdOrganization;
  });

  return mapOrganization(organization);
}

export async function createOrganizationByAdmin(input: z.infer<typeof organizationRegisterSchema>) {
  const data = organizationRegisterSchema.parse(input);
  const organizationId = randomUUID();
  const passwordHash = await hashAdminPassword(data.password);

  const organization = await prisma.$transaction(async (tx) => {
    const createdOrganization = await tx.organization.create({
      data: {
        id: organizationId,
        name: data.name,
        contactName: data.contactName,
        contactPhone: data.contactPhone,
        email: normalizeOptional(data.email),
        creditCode: data.creditCode,
        address: normalizeOptional(data.address),
        description: normalizeOptional(data.description),
        businessLicensePath: data.businessLicensePath,
        status: 'approved',
        reviewedAt: new Date(),
      },
    });

    await tx.adminUser.create({
      data: {
        id: randomUUID(),
        phone: data.contactPhone,
        passwordHash,
        role: 'organization',
        displayName: data.name,
        organizationId,
        status: 'active',
      },
    });

    return createdOrganization;
  });

  return mapOrganization(organization);
}
```

- [ ] **Step 5: Implement list, detail, and review**

Add to `src/lib/admin/organization-service.ts`:

```ts
export async function listOrganizations() {
  const rows = await prisma.organization.findMany({
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
  });
  return rows.map(mapOrganization);
}

export async function getOrganizationById(id: string) {
  const row = await prisma.organization.findUnique({ where: { id } });
  return row ? mapOrganization(row) : null;
}

export async function reviewOrganization(id: string, adminUserId: string, input: z.infer<typeof organizationReviewSchema>) {
  const data = organizationReviewSchema.parse(input);
  const now = new Date();
  const approved = data.action === 'approve';

  const organization = await prisma.$transaction(async (tx) => {
    const updated = await tx.organization.update({
      where: { id },
      data: {
        status: approved ? 'approved' : 'rejected',
        reviewedByAdminUserId: adminUserId,
        reviewedAt: now,
        rejectReason: approved ? null : data.reason || '资料未通过审核',
      },
    });

    await tx.adminUser.updateMany({
      where: { organizationId: id, role: 'organization' },
      data: { status: approved ? 'active' : 'pending' },
    });

    return updated;
  });

  return mapOrganization(organization);
}
```

- [ ] **Step 6: Implement routes**

Create `app/api/admin/register/route.ts`:

```ts
import { z } from 'zod';
import { ok, fail } from '@/lib/api/response';
import { registerOrganization } from '@/lib/admin/organization-service';

export async function POST(request: Request) {
  try {
    const organization = await registerOrganization(await request.json());
    return ok({ organization });
  } catch (error) {
    if (error instanceof z.ZodError) return fail('INVALID_REQUEST', '请求参数错误', 400);
    return fail('ORGANIZATION_REGISTER_FAILED', '机构注册失败', 500, error);
  }
}
```

Create `app/api/admin/organizations/route.ts`:

```ts
import { z } from 'zod';
import { ok, fail } from '@/lib/api/response';
import { requireAdminRole } from '@/lib/admin-auth/require-admin';
import { createOrganizationByAdmin, listOrganizations } from '@/lib/admin/organization-service';

export async function GET() {
  try {
    await requireAdminRole();
    return ok({ organizations: await listOrganizations() });
  } catch (error) {
    return failFromAdminError(error, 'LIST_ORGANIZATIONS_FAILED', '获取机构列表失败');
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminRole();
    const organization = await createOrganizationByAdmin(await request.json());
    return ok({ organization });
  } catch (error) {
    if (error instanceof z.ZodError) return fail('INVALID_REQUEST', '请求参数错误', 400);
    return failFromAdminError(error, 'CREATE_ORGANIZATION_FAILED', '创建机构失败');
  }
}

function failFromAdminError(error: unknown, code: string, message: string) {
  if (error instanceof Error && 'code' in error && 'status' in error) {
    return fail(String(error.code), error.message, Number(error.status));
  }
  return fail(code, message, 500, error);
}
```

Create `app/api/admin/organizations/[id]/route.ts`:

```ts
import { ok, fail } from '@/lib/api/response';
import { requireAdminRole } from '@/lib/admin-auth/require-admin';
import { getOrganizationById } from '@/lib/admin/organization-service';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdminRole();
    const organization = await getOrganizationById(params.id);
    if (!organization) return fail('ORGANIZATION_NOT_FOUND', '机构不存在', 404);
    return ok({ organization });
  } catch (error) {
    if (error instanceof Error && 'code' in error && 'status' in error) {
      return fail(String(error.code), error.message, Number(error.status));
    }
    return fail('GET_ORGANIZATION_FAILED', '获取机构失败', 500, error);
  }
}
```

Create `app/api/admin/organizations/[id]/review/route.ts`:

```ts
import { z } from 'zod';
import { ok, fail } from '@/lib/api/response';
import { requireAdminRole } from '@/lib/admin-auth/require-admin';
import { reviewOrganization } from '@/lib/admin/organization-service';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const adminUser = await requireAdminRole();
    const organization = await reviewOrganization(params.id, adminUser.id, await request.json());
    return ok({ organization });
  } catch (error) {
    if (error instanceof z.ZodError) return fail('INVALID_REQUEST', '请求参数错误', 400);
    if (error instanceof Error && 'code' in error && 'status' in error) {
      return fail(String(error.code), error.message, Number(error.status));
    }
    return fail('REVIEW_ORGANIZATION_FAILED', '审核机构失败', 500, error);
  }
}
```

- [ ] **Step 7: Verify tests pass**

Run:

```bash
npm test -- test/admin-organization.test.cjs
```

Expected: pass.

- [ ] **Step 8: Commit**

```bash
git add src/lib/admin/organization-service.ts app/api/admin/register app/api/admin/organizations test/admin-organization.test.cjs
git commit -m "feat: add organization review workflow"
```

---

## Task 4: Upload Authorization And Path Validation

**Files:**
- Create: `src/lib/admin-upload/upload-service.ts`
- Create: `app/api/admin/uploads/policy/route.ts`
- Create: `test/admin-upload.test.cjs`

- [ ] **Step 1: Write failing upload tests**

Create `test/admin-upload.test.cjs`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

test('upload service generates role-scoped object prefixes', () => {
  const source = read('src/lib/admin-upload/upload-service.ts');

  assert.match(source, /getAllowedUploadPrefix/);
  assert.match(source, /admin\/\$\{adminUser\.id\}/);
  assert.match(source, /organizations\/\$\{adminUser\.organizationId\}/);
  assert.match(source, /assertAllowedUploadPath/);
});

test('upload policy route requires admin session', () => {
  const source = read('app/api/admin/uploads/policy/route.ts');

  assert.match(source, /requireAdminSession/);
  assert.match(source, /createUploadPolicy/);
});
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
npm test -- test/admin-upload.test.cjs
```

Expected: fail because upload service and route do not exist.

- [ ] **Step 3: Implement upload service**

Create `src/lib/admin-upload/upload-service.ts`:

```ts
import 'server-only';

import { createHmac, randomUUID } from 'node:crypto';
import { getEnv } from '@/lib/config/env';
import type { CurrentAdminUser } from '@/lib/admin-auth/service';

const UPLOAD_EXPIRES_SECONDS = 600;

export function getAllowedUploadPrefix(adminUser: CurrentAdminUser) {
  if (adminUser.role === 'admin') {
    return `admin/${adminUser.id}/`;
  }
  if (adminUser.role === 'organization' && adminUser.organizationId) {
    return `organizations/${adminUser.organizationId}/`;
  }
  throw new Error('INVALID_UPLOAD_OWNER');
}

export function assertAllowedUploadPath(adminUser: CurrentAdminUser, objectPath: string) {
  const normalized = objectPath.replace(/^\/+/, '');
  const prefix = getAllowedUploadPrefix(adminUser);
  if (!normalized.startsWith(prefix)) {
    const error = new Error('OSS path 不在授权范围内') as Error & { code: string; status: number };
    error.code = 'INVALID_UPLOAD_PATH';
    error.status = 403;
    throw error;
  }
  return normalized;
}

export function createUploadPolicy(adminUser: CurrentAdminUser, fileKind: string) {
  const env = getEnv();
  const prefix = `${getAllowedUploadPrefix(adminUser)}${fileKind}/${new Date().toISOString().slice(0, 10)}/`;
  const objectKey = `${prefix}${randomUUID()}`;
  const expires = new Date(Date.now() + UPLOAD_EXPIRES_SECONDS * 1000).toISOString();

  const policy = Buffer.from(JSON.stringify({
    expiration: expires,
    conditions: [
      ['starts-with', '$key', prefix],
      ['content-length-range', 1, 1024 * 1024 * 1024 * 5],
    ],
  })).toString('base64');

  const signature = createHmac('sha1', env.OSS_ACCESS_KEY_SECRET).update(policy).digest('base64');

  return {
    host: `https://${env.OSS_BUCKET}.${env.OSS_REGION}.aliyuncs.com`,
    region: env.OSS_REGION,
    bucket: env.OSS_BUCKET,
    accessKeyId: env.OSS_ACCESS_KEY_ID,
    policy,
    signature,
    objectKey,
    prefix,
    expires,
  };
}
```

- [ ] **Step 4: Implement policy route**

Create `app/api/admin/uploads/policy/route.ts`:

```ts
import { z } from 'zod';
import { ok, fail } from '@/lib/api/response';
import { requireAdminSession, assertApprovedOrganization } from '@/lib/admin-auth/require-admin';
import { createUploadPolicy } from '@/lib/admin-upload/upload-service';

const policySchema = z.object({
  fileKind: z.enum(['license', 'cover', 'poster', 'trailer', 'episode', 'cast']),
});

export async function POST(request: Request) {
  try {
    const adminUser = await requireAdminSession();
    assertApprovedOrganization(adminUser);
    const input = policySchema.parse(await request.json());
    return ok({ upload: createUploadPolicy(adminUser, input.fileKind) });
  } catch (error) {
    if (error instanceof z.ZodError) return fail('INVALID_REQUEST', '请求参数错误', 400);
    if (error instanceof Error && 'code' in error && 'status' in error) {
      return fail(String(error.code), error.message, Number(error.status));
    }
    return fail('CREATE_UPLOAD_POLICY_FAILED', '创建上传凭证失败', 500, error);
  }
}
```

- [ ] **Step 5: Verify tests pass**

Run:

```bash
npm test -- test/admin-upload.test.cjs
```

Expected: pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/admin-upload/upload-service.ts app/api/admin/uploads test/admin-upload.test.cjs
git commit -m "feat: add admin upload authorization"
```

---

## Task 5: Drama Admin Services And APIs

**Files:**
- Create: `src/lib/admin/drama-admin-service.ts`
- Create: `app/api/admin/dramas/route.ts`
- Create: `app/api/admin/dramas/[id]/route.ts`
- Create: `app/api/admin/dramas/[id]/submit/route.ts`
- Create: `app/api/admin/dramas/[id]/review/route.ts`
- Create: `test/admin-drama.test.cjs`

- [ ] **Step 1: Write failing drama tests**

Create `test/admin-drama.test.cjs`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

test('drama admin service implements ownership and review actions', () => {
  const source = read('src/lib/admin/drama-admin-service.ts');

  assert.match(source, /listAdminDramas/);
  assert.match(source, /createAdminDrama/);
  assert.match(source, /updateAdminDrama/);
  assert.match(source, /submitDramaForReview/);
  assert.match(source, /reviewDrama/);
  assert.match(source, /assertAllowedUploadPath/);
  assert.match(source, /organizationId:\s*adminUser\.organizationId/);
});

test('drama review API is admin-only', () => {
  const source = read('app/api/admin/dramas/[id]/review/route.ts');

  assert.match(source, /requireAdminRole/);
  assert.match(source, /reviewDrama/);
});

test('drama submit API requires an approved organization or admin', () => {
  const source = read('app/api/admin/dramas/[id]/submit/route.ts');

  assert.match(source, /requireAdminSession/);
  assert.match(source, /assertApprovedOrganization/);
  assert.match(source, /submitDramaForReview/);
});
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
npm test -- test/admin-drama.test.cjs
```

Expected: fail because drama admin service and routes do not exist.

- [ ] **Step 3: Implement drama input schemas and access filter**

Create `src/lib/admin/drama-admin-service.ts`:

```ts
import 'server-only';

import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import type { CurrentAdminUser } from '@/lib/admin-auth/service';
import { assertAllowedUploadPath } from '@/lib/admin-upload/upload-service';

export const dramaInputSchema = z.object({
  slug: z.string().min(1).max(128),
  title: z.string().min(1).max(150),
  subtitle: z.string().max(255).optional().or(z.literal('')),
  synopsis: z.string().max(10000).optional().or(z.literal('')),
  coverPath: z.string().min(1).max(255),
  posterPath: z.string().max(255).optional().or(z.literal('')),
  trailerPath: z.string().max(255).optional().or(z.literal('')),
  releaseStatus: z.enum(['upcoming', 'released']).default('upcoming'),
  sortOrder: z.coerce.number().int().default(0),
});

export const dramaReviewSchema = z.object({
  action: z.enum(['approve', 'reject']),
  reason: z.string().max(500).optional(),
});

function nullable(value: string | undefined) {
  return value && value.trim() ? value.trim() : null;
}

function getDramaOwnershipWhere(adminUser: CurrentAdminUser) {
  if (adminUser.role === 'admin') return {};
  return { organizationId: adminUser.organizationId || '__missing__' };
}
```

- [ ] **Step 4: Implement list, create, and update**

Add:

```ts
export async function listAdminDramas(adminUser: CurrentAdminUser) {
  return prisma.drama.findMany({
    where: getDramaOwnershipWhere(adminUser),
    orderBy: [{ updatedAt: 'desc' }],
    include: { _count: { select: { episodes: true } }, organization: true },
  });
}

export async function createAdminDrama(adminUser: CurrentAdminUser, input: z.infer<typeof dramaInputSchema>) {
  const data = dramaInputSchema.parse(input);
  assertAllowedUploadPath(adminUser, data.coverPath);
  if (data.posterPath) assertAllowedUploadPath(adminUser, data.posterPath);
  if (data.trailerPath) assertAllowedUploadPath(adminUser, data.trailerPath);

  return prisma.drama.create({
    data: {
      id: randomUUID(),
      slug: data.slug,
      title: data.title,
      subtitle: nullable(data.subtitle),
      synopsis: nullable(data.synopsis),
      coverPath: data.coverPath,
      posterPath: nullable(data.posterPath),
      trailerPath: nullable(data.trailerPath),
      releaseStatus: data.releaseStatus,
      sortOrder: data.sortOrder,
      status: 'draft',
      ownerType: adminUser.role === 'admin' ? 'admin' : 'organization',
      ownerAdminUserId: adminUser.role === 'admin' ? adminUser.id : null,
      organizationId: adminUser.role === 'organization' ? adminUser.organizationId : null,
      reviewStatus: 'draft',
    },
  });
}

export async function updateAdminDrama(adminUser: CurrentAdminUser, dramaId: string, input: z.infer<typeof dramaInputSchema>) {
  const data = dramaInputSchema.parse(input);
  const drama = await prisma.drama.findFirst({ where: { id: dramaId, ...getDramaOwnershipWhere(adminUser) } });
  if (!drama) throw createDramaAdminError('DRAMA_NOT_FOUND', '剧集不存在', 404);
  if (adminUser.role === 'organization' && drama.reviewStatus === 'submitted') {
    throw createDramaAdminError('DRAMA_NOT_EDITABLE', '剧集审核中，暂不可编辑', 409);
  }

  assertAllowedUploadPath(adminUser, data.coverPath);
  if (data.posterPath) assertAllowedUploadPath(adminUser, data.posterPath);
  if (data.trailerPath) assertAllowedUploadPath(adminUser, data.trailerPath);

  return prisma.drama.update({
    where: { id: dramaId },
    data: {
      slug: data.slug,
      title: data.title,
      subtitle: nullable(data.subtitle),
      synopsis: nullable(data.synopsis),
      coverPath: data.coverPath,
      posterPath: nullable(data.posterPath),
      trailerPath: nullable(data.trailerPath),
      releaseStatus: data.releaseStatus,
      sortOrder: data.sortOrder,
      reviewStatus: drama.reviewStatus === 'rejected' ? 'draft' : drama.reviewStatus,
      reviewRejectReason: null,
    },
  });
}

function createDramaAdminError(code: string, message: string, status: number) {
  const error = new Error(message) as Error & { code: string; status: number };
  error.code = code;
  error.status = status;
  return error;
}
```

- [ ] **Step 5: Implement submit and review**

Add:

```ts
export async function submitDramaForReview(adminUser: CurrentAdminUser, dramaId: string) {
  const drama = await prisma.drama.findFirst({ where: { id: dramaId, ...getDramaOwnershipWhere(adminUser) } });
  if (!drama) throw createDramaAdminError('DRAMA_NOT_FOUND', '剧集不存在', 404);

  if (adminUser.role === 'admin') {
    return prisma.drama.update({
      where: { id: dramaId },
      data: {
        reviewStatus: 'approved',
        status: 'published',
        publishedAt: new Date(),
        reviewedByAdminUserId: adminUser.id,
        reviewedAt: new Date(),
        reviewRejectReason: null,
      },
    });
  }

  return prisma.drama.update({
    where: { id: dramaId },
    data: {
      reviewStatus: 'submitted',
      submittedAt: new Date(),
      status: 'draft',
      reviewRejectReason: null,
    },
  });
}

export async function reviewDrama(adminUserId: string, dramaId: string, input: z.infer<typeof dramaReviewSchema>) {
  const data = dramaReviewSchema.parse(input);
  const approved = data.action === 'approve';

  return prisma.drama.update({
    where: { id: dramaId },
    data: {
      reviewStatus: approved ? 'approved' : 'rejected',
      status: approved ? 'published' : 'draft',
      publishedAt: approved ? new Date() : null,
      reviewedByAdminUserId: adminUserId,
      reviewedAt: new Date(),
      reviewRejectReason: approved ? null : data.reason || '内容未通过审核',
    },
  });
}
```

- [ ] **Step 6: Implement routes**

Create the four route files and use these patterns:

```ts
const adminUser = await requireAdminSession();
assertApprovedOrganization(adminUser);
const drama = await createAdminDrama(adminUser, await request.json());
return ok({ drama });
```

For review:

```ts
const adminUser = await requireAdminRole();
const drama = await reviewDrama(adminUser.id, params.id, await request.json());
return ok({ drama });
```

For error handling in each route:

```ts
if (error instanceof z.ZodError) return fail('INVALID_REQUEST', '请求参数错误', 400);
if (error instanceof Error && 'code' in error && 'status' in error) {
  return fail(String(error.code), error.message, Number(error.status));
}
return fail('ADMIN_DRAMA_OPERATION_FAILED', '剧集操作失败', 500, error);
```

- [ ] **Step 7: Verify tests pass**

Run:

```bash
npm test -- test/admin-drama.test.cjs
```

Expected: pass.

- [ ] **Step 8: Commit**

```bash
git add src/lib/admin/drama-admin-service.ts app/api/admin/dramas test/admin-drama.test.cjs
git commit -m "feat: add admin drama review workflow"
```

---

## Task 6: Episode Admin Services And APIs

**Files:**
- Create: `src/lib/admin/episode-admin-service.ts`
- Create: `app/api/admin/dramas/[id]/episodes/route.ts`
- Create: `app/api/admin/dramas/[id]/episodes/[episodeId]/route.ts`
- Create: `test/admin-episode.test.cjs`

- [ ] **Step 1: Write failing episode tests**

Create `test/admin-episode.test.cjs`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

test('episode admin service checks drama ownership and upload paths', () => {
  const source = read('src/lib/admin/episode-admin-service.ts');

  assert.match(source, /listAdminEpisodes/);
  assert.match(source, /upsertAdminEpisode/);
  assert.match(source, /deleteAdminEpisode/);
  assert.match(source, /assertAllowedUploadPath/);
  assert.match(source, /assertDramaWritable/);
});

test('episode admin routes require approved admin session', () => {
  const source = read('app/api/admin/dramas/[id]/episodes/route.ts');

  assert.match(source, /requireAdminSession/);
  assert.match(source, /assertApprovedOrganization/);
  assert.match(source, /upsertAdminEpisode/);
});
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
npm test -- test/admin-episode.test.cjs
```

Expected: fail because episode service and routes do not exist.

- [ ] **Step 3: Implement episode service**

Create `src/lib/admin/episode-admin-service.ts`:

```ts
import 'server-only';

import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import type { CurrentAdminUser } from '@/lib/admin-auth/service';
import { assertAllowedUploadPath } from '@/lib/admin-upload/upload-service';

export const episodeInputSchema = z.object({
  episodeNo: z.coerce.number().int().positive(),
  title: z.string().min(1).max(150),
  summary: z.string().max(5000).optional().or(z.literal('')),
  videoPath: z.string().min(1).max(255),
  coverPath: z.string().max(255).optional().or(z.literal('')),
  durationSeconds: z.coerce.number().int().min(0).default(0),
  accessLevel: z.enum(['free', 'member']).default('member'),
  status: z.enum(['draft', 'published']).default('draft'),
});

function ownershipWhere(adminUser: CurrentAdminUser) {
  if (adminUser.role === 'admin') return {};
  return { organizationId: adminUser.organizationId || '__missing__' };
}

export async function assertDramaWritable(adminUser: CurrentAdminUser, dramaId: string) {
  const drama = await prisma.drama.findFirst({ where: { id: dramaId, ...ownershipWhere(adminUser) } });
  if (!drama) throw createEpisodeAdminError('DRAMA_NOT_FOUND', '剧集不存在', 404);
  if (adminUser.role === 'organization' && drama.reviewStatus === 'submitted') {
    throw createEpisodeAdminError('DRAMA_NOT_EDITABLE', '剧集审核中，暂不可编辑', 409);
  }
  return drama;
}

export async function listAdminEpisodes(adminUser: CurrentAdminUser, dramaId: string) {
  await assertDramaWritable(adminUser, dramaId);
  return prisma.episode.findMany({ where: { dramaId }, orderBy: { episodeNo: 'asc' } });
}

export async function upsertAdminEpisode(adminUser: CurrentAdminUser, dramaId: string, input: z.infer<typeof episodeInputSchema>) {
  await assertDramaWritable(adminUser, dramaId);
  const data = episodeInputSchema.parse(input);
  assertAllowedUploadPath(adminUser, data.videoPath);
  if (data.coverPath) assertAllowedUploadPath(adminUser, data.coverPath);

  return prisma.episode.upsert({
    where: { uk_episodes_drama_episode: { dramaId, episodeNo: data.episodeNo } },
    create: {
      id: randomUUID(),
      dramaId,
      episodeNo: data.episodeNo,
      title: data.title,
      summary: data.summary || null,
      videoPath: data.videoPath,
      coverPath: data.coverPath || null,
      durationSeconds: data.durationSeconds,
      accessLevel: data.accessLevel,
      status: data.status,
      publishedAt: data.status === 'published' ? new Date() : null,
    },
    update: {
      title: data.title,
      summary: data.summary || null,
      videoPath: data.videoPath,
      coverPath: data.coverPath || null,
      durationSeconds: data.durationSeconds,
      accessLevel: data.accessLevel,
      status: data.status,
      publishedAt: data.status === 'published' ? new Date() : null,
    },
  });
}

export async function deleteAdminEpisode(adminUser: CurrentAdminUser, dramaId: string, episodeId: string) {
  await assertDramaWritable(adminUser, dramaId);
  return prisma.episode.delete({ where: { id: episodeId, dramaId } });
}

function createEpisodeAdminError(code: string, message: string, status: number) {
  const error = new Error(message) as Error & { code: string; status: number };
  error.code = code;
  error.status = status;
  return error;
}
```

- [ ] **Step 4: Implement routes**

Create `app/api/admin/dramas/[id]/episodes/route.ts`:

```ts
import { z } from 'zod';
import { ok, fail } from '@/lib/api/response';
import { requireAdminSession, assertApprovedOrganization } from '@/lib/admin-auth/require-admin';
import { listAdminEpisodes, upsertAdminEpisode } from '@/lib/admin/episode-admin-service';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const adminUser = await requireAdminSession();
    assertApprovedOrganization(adminUser);
    return ok({ episodes: await listAdminEpisodes(adminUser, params.id) });
  } catch (error) {
    return failFromEpisodeError(error);
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const adminUser = await requireAdminSession();
    assertApprovedOrganization(adminUser);
    const episode = await upsertAdminEpisode(adminUser, params.id, await request.json());
    return ok({ episode });
  } catch (error) {
    if (error instanceof z.ZodError) return fail('INVALID_REQUEST', '请求参数错误', 400);
    return failFromEpisodeError(error);
  }
}

function failFromEpisodeError(error: unknown) {
  if (error instanceof Error && 'code' in error && 'status' in error) {
    return fail(String(error.code), error.message, Number(error.status));
  }
  return fail('ADMIN_EPISODE_OPERATION_FAILED', '分集操作失败', 500, error);
}
```

Create `app/api/admin/dramas/[id]/episodes/[episodeId]/route.ts` with a `DELETE` handler that calls `deleteAdminEpisode`.

- [ ] **Step 5: Verify tests pass**

Run:

```bash
npm test -- test/admin-episode.test.cjs
```

Expected: pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/admin/episode-admin-service.ts app/api/admin/dramas test/admin-episode.test.cjs
git commit -m "feat: add admin episode management"
```

---

## Task 7: Admin UI Foundation

**Files:**
- Create: `src/lib/admin-ui/api.ts`
- Create: `src/components/admin/AdminLayout.tsx`
- Create: `src/components/admin/AdminSidebar.tsx`
- Create: `src/components/admin/StatusBadge.tsx`
- Create: `src/components/admin/FormField.tsx`
- Create: `src/components/admin/UploadField.tsx`
- Create: `app/admin/layout.tsx`
- Create: `app/admin/login/page.tsx`
- Create: `app/admin/register/page.tsx`
- Create: `test/admin-ui.test.cjs`

- [ ] **Step 1: Write failing UI foundation tests**

Create `test/admin-ui.test.cjs`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

test('admin UI uses the existing brand theme and shadcn-style primitives', () => {
  const layout = read('src/components/admin/AdminLayout.tsx');
  const badge = read('src/components/admin/StatusBadge.tsx');

  assert.match(layout, /brand-bg/);
  assert.match(layout, /brand-card/);
  assert.match(layout, /brand-gold/);
  assert.match(badge, /rounded-md/);
});

test('admin login and register pages wire admin APIs', () => {
  const login = read('app/admin/login/page.tsx');
  const register = read('app/admin/register/page.tsx');

  assert.match(login, /\/api\/admin\/auth\/login/);
  assert.match(register, /\/api\/admin\/register/);
});

test('admin upload field requests upload policy API', () => {
  const source = read('src/components/admin/UploadField.tsx');

  assert.match(source, /\/api\/admin\/uploads\/policy/);
  assert.match(source, /XMLHttpRequest|fetch/);
});
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
npm test -- test/admin-ui.test.cjs
```

Expected: fail because admin UI files do not exist.

- [ ] **Step 3: Create admin client API helper**

Create `src/lib/admin-ui/api.ts`:

```ts
export async function adminApi<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message || '请求失败');
  }
  return payload.data as T;
}
```

- [ ] **Step 4: Create layout primitives**

Create `src/components/admin/AdminLayout.tsx`:

```tsx
import type { ReactNode } from 'react';
import { AdminSidebar } from './AdminSidebar';

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-bg text-stone-100">
      <div className="flex min-h-screen">
        <AdminSidebar />
        <main className="flex-1 px-4 py-5 md:px-8">
          <div className="mx-auto max-w-[1200px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
```

Create `src/components/admin/AdminSidebar.tsx`:

```tsx
import Link from 'next/link';

const navItems = [
  { href: '/admin', label: '概览' },
  { href: '/admin/organizations', label: '机构' },
  { href: '/admin/dramas', label: '剧集' },
];

export function AdminSidebar() {
  return (
    <aside className="hidden w-56 border-r border-white/10 bg-brand-card px-4 py-5 md:block">
      <Link href="/admin" className="font-display text-2xl text-brand-gold">风之追数</Link>
      <nav className="mt-8 space-y-1">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className="block rounded-md px-3 py-2 text-sm text-stone-200 hover:bg-white/10">
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
```

Create `src/components/admin/StatusBadge.tsx`:

```tsx
const statusText: Record<string, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已驳回',
  disabled: '已禁用',
  draft: '草稿',
  submitted: '审核中',
  published: '已发布',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className="inline-flex rounded-md border border-brand-gold/30 bg-brand-gold/10 px-2 py-1 text-xs text-brand-gold">
      {statusText[status] || status}
    </span>
  );
}
```

Create `src/components/admin/FormField.tsx`:

```tsx
import type { ReactNode } from 'react';

export function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm text-stone-300">{label}</span>
      {children}
    </label>
  );
}

export const adminInputClassName = 'w-full rounded-md border border-white/10 bg-brand-card px-3 py-2 text-sm text-stone-100 outline-none focus:border-brand-gold';
```

Create `src/components/admin/UploadField.tsx`:

```tsx
'use client';

import { useState } from 'react';

interface UploadFieldProps {
  fileKind: 'license' | 'cover' | 'poster' | 'trailer' | 'episode' | 'cast';
  value: string;
  onChange: (path: string) => void;
}

export function UploadField({ fileKind, value, onChange }: UploadFieldProps) {
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const policyResponse = await fetch('/api/admin/uploads/policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileKind }),
      });
      const payload = await policyResponse.json();
      if (!policyResponse.ok) throw new Error(payload?.error?.message || '获取上传凭证失败');
      const upload = payload.data.upload;
      const formData = new FormData();
      formData.append('key', `${upload.objectKey}-${file.name}`);
      formData.append('policy', upload.policy);
      formData.append('OSSAccessKeyId', upload.accessKeyId);
      formData.append('signature', upload.signature);
      formData.append('file', file);

      const ossResponse = await fetch(upload.host, { method: 'POST', body: formData });
      if (!ossResponse.ok) throw new Error('文件上传失败');
      onChange(`${upload.objectKey}-${file.name}`);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-md border border-white/10 bg-brand-card p-3">
      <input
        type="file"
        className="text-sm text-stone-200"
        disabled={uploading}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
      {value ? <p className="mt-2 break-all text-xs text-stone-400">{value}</p> : null}
    </div>
  );
}
```

Task 10 verifies the file reaches OSS through the browser flow.

- [ ] **Step 5: Create admin layout and auth pages**

Create `app/admin/layout.tsx`:

```tsx
import type { ReactNode } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';

export default function Layout({ children }: { children: ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
```

Create `app/admin/login/page.tsx` and `app/admin/register/page.tsx` as client components that submit to `/api/admin/auth/login` and `/api/admin/register` via `adminApi`.

- [ ] **Step 6: Verify tests pass**

Run:

```bash
npm test -- test/admin-ui.test.cjs
```

Expected: pass.

- [ ] **Step 7: Commit**

```bash
git add src/lib/admin-ui src/components/admin app/admin test/admin-ui.test.cjs
git commit -m "feat: add admin ui foundation"
```

---

## Task 8: Admin Organization And Drama Pages

**Files:**
- Create: `app/admin/page.tsx`
- Create: `app/admin/organizations/page.tsx`
- Create: `app/admin/organizations/[id]/page.tsx`
- Create: `app/admin/dramas/page.tsx`
- Create: `app/admin/dramas/new/page.tsx`
- Create: `app/admin/dramas/[id]/page.tsx`
- Create: `app/admin/dramas/[id]/episodes/page.tsx`
- Create: `src/components/admin/ReviewPanel.tsx`
- Create: `test/admin-pages.test.cjs`

- [ ] **Step 1: Write failing page wiring tests**

Create `test/admin-pages.test.cjs`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

test('organization admin pages wire list, detail, and review APIs', () => {
  const list = read('app/admin/organizations/page.tsx');
  const detail = read('app/admin/organizations/[id]/page.tsx');

  assert.match(list, /\/api\/admin\/organizations/);
  assert.match(detail, /\/api\/admin\/organizations\/\$\{id\}/);
  assert.match(detail, /\/review/);
});

test('drama admin pages wire CRUD, submit, review, and episodes APIs', () => {
  const list = read('app/admin/dramas/page.tsx');
  const edit = read('app/admin/dramas/[id]/page.tsx');
  const episodes = read('app/admin/dramas/[id]/episodes/page.tsx');

  assert.match(list, /\/api\/admin\/dramas/);
  assert.match(edit, /\/submit/);
  assert.match(edit, /\/review/);
  assert.match(episodes, /\/episodes/);
});
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
npm test -- test/admin-pages.test.cjs
```

Expected: fail because pages do not exist.

- [ ] **Step 3: Create dashboard and organization pages**

Create `src/components/admin/ReviewPanel.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { adminInputClassName } from './FormField';

interface ReviewPanelProps {
  approveLabel: string;
  rejectLabel: string;
  onReview: (action: 'approve' | 'reject', reason?: string) => Promise<void>;
}

export function ReviewPanel({ approveLabel, rejectLabel, onReview }: ReviewPanelProps) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(action: 'approve' | 'reject') {
    setSubmitting(true);
    try {
      await onReview(action, reason || undefined);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-md border border-white/10 bg-brand-card p-4">
      <textarea
        className={adminInputClassName}
        rows={3}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        aria-label="驳回原因"
      />
      <div className="mt-3 flex gap-2">
        <button disabled={submitting} className="rounded-md bg-brand-gold px-3 py-2 text-sm text-stone-950" onClick={() => void submit('approve')}>
          {approveLabel}
        </button>
        <button disabled={submitting} className="rounded-md border border-white/10 px-3 py-2 text-sm text-stone-100" onClick={() => void submit('reject')}>
          {rejectLabel}
        </button>
      </div>
    </section>
  );
}
```

For every page in this task:

- Call `adminApi` from a client component.
- Render tables inside `bg-brand-card border border-white/10 rounded-md`.
- Use `StatusBadge` for `pending`, `approved`, `rejected`, `draft`, `submitted`, and `published`.
- Use `ReviewPanel` for approve/reject forms.
```

- [ ] **Step 4: Create drama pages**

Create drama list, create/edit, and episode management pages with these required API calls:

```ts
await adminApi('/api/admin/dramas');
await adminApi(`/api/admin/dramas/${id}`);
await adminApi(`/api/admin/dramas/${id}/submit`, { method: 'POST', body: '{}' });
await adminApi(`/api/admin/dramas/${id}/review`, { method: 'POST', body: JSON.stringify({ action, reason }) });
await adminApi(`/api/admin/dramas/${id}/episodes`);
```

- [ ] **Step 5: Verify tests pass**

Run:

```bash
npm test -- test/admin-pages.test.cjs test/admin-ui.test.cjs
```

Expected: pass.

- [ ] **Step 6: Commit**

```bash
git add app/admin src/components/admin/ReviewPanel.tsx test/admin-pages.test.cjs
git commit -m "feat: add admin management pages"
```

---

## Task 9: API Contract, Security Regression, And Build

**Files:**
- Modify: `test/api-contract.test.cjs`
- Modify: `test/frontend-api-wiring.test.cjs`
- Modify: `test/server-drama.test.cjs`
- Create: `test/admin-security.test.cjs`

- [ ] **Step 1: Add contract tests for admin APIs**

In `test/api-contract.test.cjs`, add admin route files to the existing route assertions. Ensure every admin route imports `ok` and `fail`.

```js
const adminRouteFiles = [
  'app/api/admin/auth/login/route.ts',
  'app/api/admin/auth/logout/route.ts',
  'app/api/admin/auth/me/route.ts',
  'app/api/admin/register/route.ts',
  'app/api/admin/organizations/route.ts',
  'app/api/admin/organizations/[id]/route.ts',
  'app/api/admin/organizations/[id]/review/route.ts',
  'app/api/admin/uploads/policy/route.ts',
  'app/api/admin/dramas/route.ts',
  'app/api/admin/dramas/[id]/route.ts',
  'app/api/admin/dramas/[id]/submit/route.ts',
  'app/api/admin/dramas/[id]/review/route.ts',
  'app/api/admin/dramas/[id]/episodes/route.ts',
  'app/api/admin/dramas/[id]/episodes/[episodeId]/route.ts',
];
```

- [ ] **Step 2: Add admin security source tests**

Create `test/admin-security.test.cjs`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

test('organization-owned resources are scoped by organization id', () => {
  const drama = read('src/lib/admin/drama-admin-service.ts');
  const episode = read('src/lib/admin/episode-admin-service.ts');

  assert.match(drama, /organizationId:\s*adminUser\.organizationId/);
  assert.match(episode, /organizationId:\s*adminUser\.organizationId/);
});

test('admin routes do not use frontend session helpers', () => {
  for (const file of [
    'src/lib/admin-auth/session.ts',
    'app/api/admin/auth/me/route.ts',
    'app/api/admin/dramas/route.ts',
  ]) {
    const source = read(file);
    assert.doesNotMatch(source, /@\/lib\/auth\/session/);
  }
});

test('upload path validation runs before storing paths', () => {
  const drama = read('src/lib/admin/drama-admin-service.ts');
  const episode = read('src/lib/admin/episode-admin-service.ts');

  assert.match(drama, /assertAllowedUploadPath\(adminUser,\s*data\.coverPath\)/);
  assert.match(episode, /assertAllowedUploadPath\(adminUser,\s*data\.videoPath\)/);
});
```

- [ ] **Step 3: Run targeted tests**

Run:

```bash
npm test -- test/admin-security.test.cjs test/api-contract.test.cjs
```

Expected: pass.

- [ ] **Step 4: Run full test suite**

Run:

```bash
npm test
```

Expected: pass.

- [ ] **Step 5: Run production build**

Run:

```bash
npm run build
```

Expected: Next.js build completes successfully.

- [ ] **Step 6: Commit verification updates**

```bash
git add test/api-contract.test.cjs test/frontend-api-wiring.test.cjs test/server-drama.test.cjs test/admin-security.test.cjs
git commit -m "test: cover admin backend security"
```

---

## Task 10: Manual Smoke Test

**Files:**
- Modify only if smoke testing reveals a defect in files touched by Tasks 1-9.

- [ ] **Step 1: Apply migrations locally**

Run:

```bash
npx prisma migrate deploy
```

Expected: migration `0002_admin_backend` applies successfully.

- [ ] **Step 2: Seed default data**

Run:

```bash
npx tsx prisma/seed.ts
```

Expected: command prints `Seed 完成`; default admin exists; seed dramas are assigned to default admin.

- [ ] **Step 3: Start development server**

Run:

```bash
npm run dev
```

Expected: dev server starts at `http://localhost:3000` or the next available port.

- [ ] **Step 4: Exercise admin flows in browser**

Verify:

- `/admin/login` accepts the default admin credentials configured by env.
- Admin can open `/admin/organizations`.
- `/admin/register` creates a pending organization.
- Admin can approve the organization.
- Approved organization can create a drama draft.
- Organization can add at least one episode.
- Organization can submit the drama.
- Admin can approve the drama.
- The approved drama appears through existing client drama APIs.

- [ ] **Step 5: Commit smoke-test fixes**

If fixes were needed:

```bash
git add <changed-files>
git commit -m "fix: stabilize admin backend smoke flow"
```

If no fixes were needed, do not create an empty commit.

---

## Final Verification

Before merging or handing off, run:

```bash
npm test
npm run build
git status --short
```

Expected:

- `npm test` passes.
- `npm run build` passes.
- `git status --short` shows no uncommitted implementation changes.

## Implementation Notes

- Keep frontend user auth and admin auth separate. Do not import `@/lib/auth/session` from admin services or admin routes.
- Keep OSS database fields as paths only. Do not store signed URLs.
- Keep all date values in UTC and return ISO strings from service mappers.
- Keep all API errors in the existing `{ error: { code, message } }` shape.
- Use the current theme colors: `brand.bg`, `brand.card`, `brand.gold`, `brand.amber`.
- Use shadcn-style local components and Tailwind classes; only add a package if a missing primitive materially reduces implementation risk.
