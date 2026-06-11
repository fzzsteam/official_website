# Admin Content Management Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a unified admin content management workflow with drawer-based editing, signed media previews, independent review/publish actions, organization creation, and polished upload controls.

**Architecture:** Keep the existing Next.js App Router and Prisma service boundaries. Add focused admin service helpers for media URL mapping, status transitions, genres, and organization creation options; then refactor admin pages around shared list, drawer, media, and status components.

**Tech Stack:** Next.js App Router, React client components, TypeScript, Tailwind CSS, Prisma, Ali OSS signed URLs, Node `node:test` static/structural tests.

---

## File Structure

Create:

- `src/lib/admin/media-url.ts` - server-only helpers that convert OSS paths into signed admin media URLs without storing URLs.
- `src/lib/admin/drama-genres.ts` - fixed drama genre enum, validation, and Prisma write helpers.
- `src/components/admin/AdminDrawer.tsx` - reusable right-side drawer shell with fixed footer.
- `src/components/admin/AdminListToolbar.tsx` - reusable toolbar with search and grouped filters.
- `src/components/admin/AdminMediaPreview.tsx` - unified image/video/file preview component.
- `src/components/admin/AdminMediaUpload.tsx` - polished OSS direct-upload component replacing the current basic file input.
- `src/components/admin/AdminActionButton.tsx` - consistent row action buttons and disabled states.
- `src/components/admin/GenreMultiSelect.tsx` - fixed enum multi-select for drama genres.
- `app/api/admin/dramas/[id]/release/route.ts` - drama release/unrelease endpoint.
- `app/api/admin/dramas/[id]/episodes/[episodeId]/status/route.ts` - episode publish/unpublish endpoint.

Modify:

- `src/lib/admin/drama-admin-service.ts` - slug generation, signed media URL mapping, genre persistence, release status transition.
- `src/lib/admin/episode-admin-service.ts` - signed video preview mapping, default member access, status transition.
- `src/lib/admin/organization-service.ts` - admin-created organization `initialStatus`, signed license URL, editable organization fields.
- `app/api/admin/dramas/route.ts` - return enriched drama list and accept genres.
- `app/api/admin/dramas/[id]/route.ts` - return enriched drama detail and accept genres.
- `app/api/admin/dramas/[id]/episodes/route.ts` - return enriched episode list.
- `app/api/admin/dramas/[id]/episodes/[episodeId]/route.ts` - support update in addition to delete, if needed by the drawer.
- `app/api/admin/organizations/route.ts` - accept `initialStatus`.
- `app/api/admin/organizations/[id]/route.ts` - add update support and return signed license URL.
- `app/admin/login/page.tsx` - add visible institution registration link.
- `app/admin/dramas/page.tsx` - rebuild with list + drawer and row status actions.
- `app/admin/dramas/new/page.tsx` - remove from primary flow; keep redirect or lightweight compatibility path.
- `app/admin/dramas/[id]/page.tsx` - remove from primary flow; keep redirect or compatibility detail.
- `app/admin/dramas/[id]/episodes/page.tsx` - rebuild with list + drawer and video previews.
- `app/admin/organizations/page.tsx` - rebuild with list + drawer and admin-create organization form.
- `src/components/admin/AdminLayout.tsx` - switch to dark sidebar + light content shell.
- `src/components/admin/AdminSidebar.tsx` - keep navigation, align with mixed theme.
- `src/components/admin/StatusBadge.tsx` - extend status labels for `upcoming`, `released`, `submitted`, `published`.
- `src/components/admin/UploadField.tsx` - convert this file into a compatibility wrapper around `AdminMediaUpload` so older imports keep working.

Tests:

- `test/admin-drama.test.cjs` - slug generation, genre helpers, signed media URLs, release status route.
- `test/admin-episode.test.cjs` - signed video previews, member default, episode status route.
- `test/admin-organization.test.cjs` - `initialStatus`, signed license URL, update route.
- `test/admin-ui.test.cjs` - drawer, toolbar, media upload, login registration link, mixed theme.
- `test/admin-upload.test.cjs` - upload component still requests policy and only submits path.

---

### Task 1: Add Admin Media URL Mapping

**Files:**
- Create: `src/lib/admin/media-url.ts`
- Modify: `src/lib/admin/drama-admin-service.ts`
- Modify: `src/lib/admin/episode-admin-service.ts`
- Modify: `src/lib/admin/organization-service.ts`
- Test: `test/admin-drama.test.cjs`
- Test: `test/admin-episode.test.cjs`
- Test: `test/admin-organization.test.cjs`

- [ ] **Step 1: Write failing tests for admin signed media mapping**

Add these tests:

```js
test('admin drama service maps media paths to signed admin URLs', () => {
  const media = read('src/lib/admin/media-url.ts');
  const drama = read('src/lib/admin/drama-admin-service.ts');

  assert.match(media, /signAdminMediaPath/);
  assert.match(media, /mapAdminDramaMedia/);
  assert.match(media, /signOssPath/);
  assert.match(drama, /mapAdminDramaMedia/);
  assert.match(drama, /posterUrl/);
  assert.match(drama, /coverUrl/);
  assert.doesNotMatch(drama, /trailerUrl/);
});
```

```js
test('admin episode service returns signed video preview URLs', () => {
  const media = read('src/lib/admin/media-url.ts');
  const episode = read('src/lib/admin/episode-admin-service.ts');

  assert.match(media, /mapAdminEpisodeMedia/);
  assert.match(episode, /videoPreviewUrl/);
  assert.match(episode, /videoUrl/);
  assert.match(episode, /mapAdminEpisodeMedia/);
});
```

```js
test('organization service returns signed business license URL', () => {
  const media = read('src/lib/admin/media-url.ts');
  const organization = read('src/lib/admin/organization-service.ts');

  assert.match(media, /mapAdminOrganizationMedia/);
  assert.match(organization, /businessLicenseUrl/);
  assert.match(organization, /mapAdminOrganizationMedia/);
});
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
npm test -- test/admin-drama.test.cjs test/admin-episode.test.cjs test/admin-organization.test.cjs
```

Expected: FAIL because `src/lib/admin/media-url.ts` does not exist and services do not return URL fields.

- [ ] **Step 3: Create `src/lib/admin/media-url.ts`**

Implement:

```ts
import 'server-only';

import { signOssPath } from '@/lib/oss/oss-service';

export function signAdminMediaPath(path: string | null | undefined) {
  if (!path) return null;
  return signOssPath(path);
}

export function mapAdminDramaMedia<T extends {
  coverPath: string;
  posterPath: string | null;
}>(drama: T) {
  return {
    ...drama,
    coverUrl: signAdminMediaPath(drama.coverPath),
    posterUrl: signAdminMediaPath(drama.posterPath),
  };
}

export function mapAdminEpisodeMedia<T extends {
  videoPath: string;
  coverPath: string | null;
}>(episode: T) {
  return {
    ...episode,
    videoPreviewUrl: signAdminMediaPath(episode.videoPath),
    videoUrl: signAdminMediaPath(episode.videoPath),
    coverUrl: signAdminMediaPath(episode.coverPath),
  };
}

export function mapAdminOrganizationMedia<T extends {
  businessLicensePath: string;
}>(organization: T) {
  return {
    ...organization,
    businessLicenseUrl: signAdminMediaPath(organization.businessLicensePath),
  };
}
```

- [ ] **Step 4: Wire drama, episode, and organization services**

Update service return paths:

```ts
import { mapAdminDramaMedia } from '@/lib/admin/media-url';
```

Use `return rows.map(mapAdminDramaMedia)` for list results and `return mapAdminDramaMedia(drama)` for detail results.

For episodes:

```ts
import { mapAdminEpisodeMedia } from '@/lib/admin/media-url';
```

Use `return rows.map(mapAdminEpisodeMedia)` in list and return `mapAdminEpisodeMedia(episode)` from create/update paths where the route returns the row.

For organizations:

```ts
import { mapAdminOrganizationMedia } from '@/lib/admin/media-url';
```

Wrap mapped organization responses with `mapAdminOrganizationMedia`.

- [ ] **Step 5: Run tests and commit**

Run:

```bash
npm test -- test/admin-drama.test.cjs test/admin-episode.test.cjs test/admin-organization.test.cjs
```

Expected: PASS.

Commit:

```bash
git add src/lib/admin/media-url.ts src/lib/admin/drama-admin-service.ts src/lib/admin/episode-admin-service.ts src/lib/admin/organization-service.ts test/admin-drama.test.cjs test/admin-episode.test.cjs test/admin-organization.test.cjs
git commit -m "feat: add admin signed media urls"
```

---

### Task 2: Add Drama Genres and Automatic Slug Generation

**Files:**
- Create: `src/lib/admin/drama-genres.ts`
- Modify: `src/lib/admin/drama-admin-service.ts`
- Test: `test/admin-drama.test.cjs`

- [ ] **Step 1: Write failing tests**

Add:

```js
test('drama admin service auto-generates slug and persists fixed genres', () => {
  const genres = read('src/lib/admin/drama-genres.ts');
  const drama = read('src/lib/admin/drama-admin-service.ts');

  assert.match(genres, /DRAMA_GENRES/);
  assert.match(genres, /urban/);
  assert.match(genres, /romance/);
  assert.match(genres, /validateDramaGenreCodes/);
  assert.match(genres, /replaceDramaGenres/);
  assert.match(drama, /generateUniqueDramaSlug/);
  assert.match(drama, /replaceDramaGenres/);
  assert.doesNotMatch(drama, /slug:\s*z\.string\(\)\.min\(1\)/);
});
```

- [ ] **Step 2: Run test and verify failure**

Run:

```bash
npm test -- test/admin-drama.test.cjs
```

Expected: FAIL because genre helper and slug generator are missing.

- [ ] **Step 3: Create fixed genre helper**

Create:

```ts
import 'server-only';

import type { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';

export const DRAMA_GENRES = [
  { code: 'urban', name: '都市' },
  { code: 'romance', name: '爱情' },
  { code: 'suspense', name: '悬疑' },
  { code: 'costume', name: '古装' },
  { code: 'comedy', name: '喜剧' },
  { code: 'xianxia', name: '仙侠' },
  { code: 'war', name: '战争' },
  { code: 'thriller', name: '惊悚' },
] as const;

const GENRE_BY_CODE = new Map(DRAMA_GENRES.map((genre) => [genre.code, genre]));

export type DramaGenreCode = (typeof DRAMA_GENRES)[number]['code'];

export function validateDramaGenreCodes(codes: string[]) {
  return codes.map((code) => {
    const genre = GENRE_BY_CODE.get(code as DramaGenreCode);
    if (!genre) {
      const error = new Error('分类不存在') as Error & { code: string; status: number };
      error.code = 'INVALID_DRAMA_GENRE';
      error.status = 400;
      throw error;
    }
    return genre;
  });
}

export async function replaceDramaGenres(
  tx: Pick<PrismaClient, 'dramaGenre'>,
  dramaId: string,
  codes: string[],
) {
  const genres = validateDramaGenreCodes(codes);
  await tx.dramaGenre.deleteMany({ where: { dramaId } });
  if (genres.length === 0) return;
  await tx.dramaGenre.createMany({
    data: genres.map((genre) => ({
      id: randomUUID(),
      dramaId,
      genreCode: genre.code,
      genreName: genre.name,
    })),
  });
}
```

- [ ] **Step 4: Update drama schema and slug generation**

Change `dramaInputSchema` so `slug` is optional/internal and `genreCodes` is accepted:

```ts
export const dramaInputSchema = z.object({
  title: z.string().min(1).max(150),
  subtitle: z.string().max(255).optional().or(z.literal('')),
  synopsis: z.string().max(10000).optional().or(z.literal('')),
  coverPath: z.string().min(1).max(255),
  posterPath: z.string().max(255).optional().or(z.literal('')),
  releaseStatus: z.enum(['upcoming', 'released']).default('upcoming'),
  sortOrder: z.coerce.number().int().default(0),
  genreCodes: z.array(z.string()).default([]),
});
```

Add:

```ts
function createSlugBase(title: string) {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'drama';
}

export async function generateUniqueDramaSlug(title: string) {
  const base = createSlugBase(title);
  for (let index = 0; index < 5; index += 1) {
    const suffix = randomUUID().slice(0, 8);
    const slug = `${base}-${suffix}`;
    const exists = await prisma.drama.findUnique({ where: { slug } });
    if (!exists) return slug;
  }
  return `${base}-${randomUUID()}`;
}
```

Use `generateUniqueDramaSlug(data.title)` in `createAdminDrama`.

- [ ] **Step 5: Persist genres in create/update transactions**

Wrap create/update in `prisma.$transaction`:

```ts
return prisma.$transaction(async (tx) => {
  const drama = await tx.drama.create({ data: { ... } });
  await replaceDramaGenres(tx, drama.id, data.genreCodes);
  return getAdminDrama(adminUser, drama.id);
});
```

For update:

```ts
return prisma.$transaction(async (tx) => {
  await tx.drama.update({ where: { id: dramaId }, data: { ... } });
  await replaceDramaGenres(tx, dramaId, data.genreCodes);
  return getAdminDrama(adminUser, dramaId);
});
```

- [ ] **Step 6: Include genres in list/detail**

Update Prisma includes:

```ts
include: {
  _count: { select: { episodes: true } },
  organization: true,
  genres: true,
}
```

- [ ] **Step 7: Run tests and commit**

Run:

```bash
npm test -- test/admin-drama.test.cjs
```

Expected: PASS.

Commit:

```bash
git add src/lib/admin/drama-genres.ts src/lib/admin/drama-admin-service.ts test/admin-drama.test.cjs
git commit -m "feat: add admin drama genres and slug generation"
```

---

### Task 3: Add Independent Drama Release API

**Files:**
- Create: `app/api/admin/dramas/[id]/release/route.ts`
- Modify: `src/lib/admin/drama-admin-service.ts`
- Test: `test/admin-drama.test.cjs`

- [ ] **Step 1: Write failing tests**

Add:

```js
test('drama release API updates release status separately from detail save', () => {
  const route = read('app/api/admin/dramas/[id]/release/route.ts');
  const service = read('src/lib/admin/drama-admin-service.ts');

  assert.match(route, /requireAdminSession/);
  assert.match(route, /assertApprovedOrganization/);
  assert.match(route, /updateDramaReleaseStatus/);
  assert.match(service, /updateDramaReleaseStatus/);
  assert.match(service, /reviewStatus !== 'approved'/);
  assert.match(service, /releaseStatus:\s*data\.releaseStatus/);
});
```

- [ ] **Step 2: Run test and verify failure**

Run:

```bash
npm test -- test/admin-drama.test.cjs
```

Expected: FAIL because release route and service function do not exist.

- [ ] **Step 3: Add service schema and function**

Add:

```ts
export const dramaReleaseSchema = z.object({
  releaseStatus: z.enum(['upcoming', 'released']),
});

export async function updateDramaReleaseStatus(
  adminUser: CurrentAdminUser,
  dramaId: string,
  input: z.infer<typeof dramaReleaseSchema>,
) {
  const data = dramaReleaseSchema.parse(input);
  const drama = await prisma.drama.findFirst({ where: { id: dramaId, ...getDramaOwnershipWhere(adminUser) } });
  if (!drama) {
    throw createDramaAdminError('DRAMA_NOT_FOUND', '剧集不存在', 404);
  }
  if (drama.reviewStatus !== 'approved') {
    throw createDramaAdminError('DRAMA_NOT_APPROVED', '审核通过后才可以上架', 409);
  }
  return prisma.drama.update({
    where: { id: dramaId },
    data: {
      releaseStatus: data.releaseStatus,
      publishedAt: data.releaseStatus === 'released' ? (drama.publishedAt || new Date()) : null,
    },
  });
}
```

- [ ] **Step 4: Add route**

Create:

```ts
import { z } from 'zod';
import { ok, fail } from '@/lib/api/response';
import { requireAdminSession, assertApprovedOrganization } from '@/lib/admin-auth/require-admin';
import { updateDramaReleaseStatus } from '@/lib/admin/drama-admin-service';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const adminUser = await requireAdminSession();
    assertApprovedOrganization(adminUser);
    const drama = await updateDramaReleaseStatus(adminUser, params.id, await request.json());
    return ok({ drama });
  } catch (error) {
    if (error instanceof z.ZodError) return fail('INVALID_REQUEST', '请求参数错误', 400);
    if (error instanceof Error && 'code' in error && 'status' in error) {
      return fail(String(error.code), error.message, Number(error.status));
    }
    return fail('ADMIN_DRAMA_RELEASE_FAILED', '剧集上架状态更新失败', 500, error);
  }
}
```

- [ ] **Step 5: Run tests and commit**

Run:

```bash
npm test -- test/admin-drama.test.cjs
```

Expected: PASS.

Commit:

```bash
git add 'app/api/admin/dramas/[id]/release/route.ts' src/lib/admin/drama-admin-service.ts test/admin-drama.test.cjs
git commit -m "feat: add admin drama release actions"
```

---

### Task 4: Add Independent Episode Status API

**Files:**
- Create: `app/api/admin/dramas/[id]/episodes/[episodeId]/status/route.ts`
- Modify: `src/lib/admin/episode-admin-service.ts`
- Test: `test/admin-episode.test.cjs`

- [ ] **Step 1: Write failing tests**

Add:

```js
test('episode status API publishes and unpublishes independently', () => {
  const route = read('app/api/admin/dramas/[id]/episodes/[episodeId]/status/route.ts');
  const service = read('src/lib/admin/episode-admin-service.ts');

  assert.match(route, /requireAdminSession/);
  assert.match(route, /assertApprovedOrganization/);
  assert.match(route, /updateAdminEpisodeStatus/);
  assert.match(service, /episodeStatusSchema/);
  assert.match(service, /publishedAt:\s*data\.status === 'published'/);
  assert.match(service, /accessLevel:\s*'member'/);
});
```

- [ ] **Step 2: Run test and verify failure**

Run:

```bash
npm test -- test/admin-episode.test.cjs
```

Expected: FAIL because route/function are missing.

- [ ] **Step 3: Hide access level from input and default member**

Update `episodeInputSchema`:

```ts
export const episodeInputSchema = z.object({
  episodeNo: z.coerce.number().int().positive(),
  title: z.string().min(1).max(150),
  summary: z.string().max(5000).optional().or(z.literal('')),
  videoPath: z.string().min(1).max(255),
  coverPath: z.string().max(255).optional().or(z.literal('')),
  durationSeconds: z.coerce.number().int().min(0).default(0),
  status: z.enum(['draft', 'published']).default('draft'),
});
```

Set `accessLevel: 'member'` in both create and update.

- [ ] **Step 4: Add status service function**

Add:

```ts
export const episodeStatusSchema = z.object({
  status: z.enum(['draft', 'published']),
});

export async function updateAdminEpisodeStatus(
  adminUser: CurrentAdminUser,
  dramaId: string,
  episodeId: string,
  input: z.infer<typeof episodeStatusSchema>,
) {
  await assertDramaWritable(adminUser, dramaId);
  const data = episodeStatusSchema.parse(input);
  const result = await prisma.episode.updateMany({
    where: { id: episodeId, dramaId },
    data: {
      status: data.status,
      publishedAt: data.status === 'published' ? new Date() : null,
    },
  });
  if (result.count === 0) {
    throw createEpisodeAdminError('EPISODE_NOT_FOUND', '分集不存在', 404);
  }
  return prisma.episode.findFirstOrThrow({ where: { id: episodeId, dramaId } });
}
```

- [ ] **Step 5: Add route**

Create:

```ts
import { z } from 'zod';
import { ok, fail } from '@/lib/api/response';
import { requireAdminSession, assertApprovedOrganization } from '@/lib/admin-auth/require-admin';
import { updateAdminEpisodeStatus } from '@/lib/admin/episode-admin-service';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { id: string; episodeId: string } },
) {
  try {
    const adminUser = await requireAdminSession();
    assertApprovedOrganization(adminUser);
    const episode = await updateAdminEpisodeStatus(adminUser, params.id, params.episodeId, await request.json());
    return ok({ episode });
  } catch (error) {
    if (error instanceof z.ZodError) return fail('INVALID_REQUEST', '请求参数错误', 400);
    if (error instanceof Error && 'code' in error && 'status' in error) {
      return fail(String(error.code), error.message, Number(error.status));
    }
    return fail('ADMIN_EPISODE_STATUS_FAILED', '分集发布状态更新失败', 500, error);
  }
}
```

- [ ] **Step 6: Run tests and commit**

Run:

```bash
npm test -- test/admin-episode.test.cjs
```

Expected: PASS.

Commit:

```bash
git add 'app/api/admin/dramas/[id]/episodes/[episodeId]/status/route.ts' src/lib/admin/episode-admin-service.ts test/admin-episode.test.cjs
git commit -m "feat: add admin episode publish actions"
```

---

### Task 5: Add Admin Organization Creation Status and Update Support

**Files:**
- Modify: `src/lib/admin/organization-service.ts`
- Modify: `app/api/admin/organizations/route.ts`
- Modify: `app/api/admin/organizations/[id]/route.ts`
- Test: `test/admin-organization.test.cjs`

- [ ] **Step 1: Write failing tests**

Add:

```js
test('admin organization creation supports approved or pending initial status', () => {
  const service = read('src/lib/admin/organization-service.ts');
  const route = read('app/api/admin/organizations/route.ts');

  assert.match(service, /initialStatus/);
  assert.match(service, /z\.enum\(\['approved', 'pending'\]\)/);
  assert.match(service, /status:\s*data\.initialStatus/);
  assert.match(service, /data\.initialStatus === 'approved' \? 'active' : 'pending'/);
  assert.match(route, /createOrganizationByAdmin/);
});
```

```js
test('admin organization detail route supports updating organization details', () => {
  const route = read('app/api/admin/organizations/[id]/route.ts');
  const service = read('src/lib/admin/organization-service.ts');

  assert.match(route, /export async function PUT/);
  assert.match(route, /updateOrganizationByAdmin/);
  assert.match(service, /updateOrganizationByAdmin/);
});
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
npm test -- test/admin-organization.test.cjs
```

Expected: FAIL because `initialStatus` and update route are missing.

- [ ] **Step 3: Add admin creation schema**

Add:

```ts
export const organizationAdminCreateSchema = organizationRegisterSchema.extend({
  initialStatus: z.enum(['approved', 'pending']).default('approved'),
});
```

Update `createOrganizationByAdmin` to parse `organizationAdminCreateSchema` and use:

```ts
status: data.initialStatus,
reviewedAt: data.initialStatus === 'approved' ? new Date() : null,
```

For the account:

```ts
status: data.initialStatus === 'approved' ? 'active' : 'pending',
```

- [ ] **Step 4: Add update service**

Add:

```ts
export async function updateOrganizationByAdmin(id: string, input: z.infer<typeof organizationInputSchema>) {
  const data = organizationInputSchema.parse(input);
  const organization = await prisma.organization.update({
    where: { id },
    data: {
      name: data.name,
      contactName: data.contactName,
      contactPhone: data.contactPhone,
      email: normalizeOptional(data.email),
      creditCode: data.creditCode,
      address: normalizeOptional(data.address),
      description: normalizeOptional(data.description),
      businessLicensePath: data.businessLicensePath,
    },
  });
  return mapOrganization(organization);
}
```

- [ ] **Step 5: Add PUT route**

In `app/api/admin/organizations/[id]/route.ts`, import `z` and `updateOrganizationByAdmin`, then add:

```ts
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdminRole();
    const organization = await updateOrganizationByAdmin(params.id, await request.json());
    return ok({ organization });
  } catch (error) {
    if (error instanceof z.ZodError) return fail('INVALID_REQUEST', '请求参数错误', 400);
    if (isAdminAuthError(error)) {
      return fail(error.code, error.message, error.status);
    }
    return fail('UPDATE_ORGANIZATION_FAILED', '更新机构失败', 500, error);
  }
}
```

- [ ] **Step 6: Run tests and commit**

Run:

```bash
npm test -- test/admin-organization.test.cjs
```

Expected: PASS.

Commit:

```bash
git add src/lib/admin/organization-service.ts app/api/admin/organizations/route.ts 'app/api/admin/organizations/[id]/route.ts' test/admin-organization.test.cjs
git commit -m "feat: add admin organization creation options"
```

---

### Task 6: Build Shared Admin UI Components

**Files:**
- Create: `src/components/admin/AdminDrawer.tsx`
- Create: `src/components/admin/AdminListToolbar.tsx`
- Create: `src/components/admin/AdminMediaPreview.tsx`
- Create: `src/components/admin/AdminMediaUpload.tsx`
- Create: `src/components/admin/AdminActionButton.tsx`
- Create: `src/components/admin/GenreMultiSelect.tsx`
- Modify: `src/components/admin/StatusBadge.tsx`
- Modify: `src/components/admin/UploadField.tsx`
- Test: `test/admin-ui.test.cjs`
- Test: `test/admin-upload.test.cjs`

- [ ] **Step 1: Write failing UI component tests**

Add:

```js
test('admin shared drawer and toolbar components exist', () => {
  const drawer = read('src/components/admin/AdminDrawer.tsx');
  const toolbar = read('src/components/admin/AdminListToolbar.tsx');

  assert.match(drawer, /export function AdminDrawer/);
  assert.match(drawer, /fixed inset-y-0 right-0/);
  assert.match(drawer, /role="dialog"/);
  assert.match(toolbar, /export function AdminListToolbar/);
  assert.match(toolbar, /filterGroups/);
});
```

```js
test('admin media upload and preview components support rich media states', () => {
  const upload = read('src/components/admin/AdminMediaUpload.tsx');
  const preview = read('src/components/admin/AdminMediaPreview.tsx');

  assert.match(upload, /\/api\/admin\/uploads\/policy/);
  assert.match(upload, /uploading/);
  assert.match(upload, /onChange\(objectKey\)/);
  assert.match(upload, /onClear/);
  assert.match(preview, /type === 'video'/);
  assert.match(preview, /<video/);
  assert.match(preview, /<img/);
});
```

```js
test('status badge labels include review and release statuses', () => {
  const badge = read('src/components/admin/StatusBadge.tsx');

  assert.match(badge, /upcoming:\s*'待上架'/);
  assert.match(badge, /released:\s*'已上架'/);
  assert.match(badge, /submitted:\s*'待审核'/);
});
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
npm test -- test/admin-ui.test.cjs test/admin-upload.test.cjs
```

Expected: FAIL because new shared components are missing.

- [ ] **Step 3: Create `AdminDrawer`**

Implement:

```tsx
'use client';

import type { ReactNode } from 'react';

interface AdminDrawerProps {
  open: boolean;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
}

export function AdminDrawer({ open, title, subtitle, children, footer, onClose }: AdminDrawerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-slate-950/40" aria-label="关闭抽屉背景" onClick={onClose} />
      <section role="dialog" aria-modal="true" className="fixed inset-y-0 right-0 flex w-full flex-col bg-white text-slate-950 shadow-2xl md:max-w-[560px]">
        <header className="border-b border-slate-200 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">{title}</h2>
              {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
            </div>
            <button className="rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100" onClick={onClose}>关闭</button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? <footer className="border-t border-slate-200 bg-slate-50 px-5 py-4">{footer}</footer> : null}
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Create toolbar, preview, upload, action, and genre components**

Implement minimal versions with clear props:

```tsx
export interface AdminFilterOption {
  label: string;
  value: string;
}

export interface AdminFilterGroup {
  label: string;
  value: string;
  options: AdminFilterOption[];
  onChange: (value: string) => void;
}

export function AdminListToolbar({ search, onSearchChange, filterGroups, action }: {
  search: string;
  onSearchChange: (value: string) => void;
  filterGroups: AdminFilterGroup[];
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
      <input className="min-h-10 rounded-md border border-slate-300 px-3 text-sm" value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="搜索" />
      <div className="flex flex-wrap items-center gap-3">
        {filterGroups.map((group) => (
          <label key={group.label} className="flex items-center gap-2 text-sm text-slate-600">
            {group.label}
            <select className="rounded-md border border-slate-300 bg-white px-2 py-2" value={group.value} onChange={(event) => group.onChange(event.target.value)}>
              {group.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        ))}
        {action}
      </div>
    </div>
  );
}
```

For `AdminMediaUpload`, keep the existing direct upload logic from `UploadField`, but add props:

```ts
type MediaKind = 'image' | 'video' | 'file';
type FileKind = 'license' | 'cover' | 'poster' | 'trailer' | 'episode' | 'cast';
```

Ensure it calls `onChange(objectKey)` after OSS success and supports `onClear`.

- [ ] **Step 5: Extend `StatusBadge` labels**

Use:

```ts
const statusText: Record<string, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已驳回',
  disabled: '已禁用',
  draft: '草稿',
  submitted: '待审核',
  published: '已发布',
  upcoming: '待上架',
  released: '已上架',
};
```

- [ ] **Step 6: Run tests and commit**

Run:

```bash
npm test -- test/admin-ui.test.cjs test/admin-upload.test.cjs
```

Expected: PASS.

Commit:

```bash
git add src/components/admin/AdminDrawer.tsx src/components/admin/AdminListToolbar.tsx src/components/admin/AdminMediaPreview.tsx src/components/admin/AdminMediaUpload.tsx src/components/admin/AdminActionButton.tsx src/components/admin/GenreMultiSelect.tsx src/components/admin/StatusBadge.tsx src/components/admin/UploadField.tsx test/admin-ui.test.cjs test/admin-upload.test.cjs
git commit -m "feat: add shared admin workspace components"
```

---

### Task 7: Update Admin Layout Theme and Login Registration Entry

**Files:**
- Modify: `src/components/admin/AdminLayout.tsx`
- Modify: `src/components/admin/AdminSidebar.tsx`
- Modify: `app/admin/login/page.tsx`
- Test: `test/admin-ui.test.cjs`

- [ ] **Step 1: Write failing tests**

Add:

```js
test('admin layout uses dark sidebar and light content workspace', () => {
  const layout = read('src/components/admin/AdminLayout.tsx');
  const sidebar = read('src/components/admin/AdminSidebar.tsx');

  assert.match(layout, /bg-slate-100/);
  assert.match(layout, /text-slate-950/);
  assert.match(sidebar, /bg-brand-card/);
});
```

```js
test('admin login page exposes organization registration entry', () => {
  const login = read('app/admin/login/page.tsx');

  assert.match(login, /机构注册/);
  assert.match(login, /href="\/admin\/register"/);
});
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
npm test -- test/admin-ui.test.cjs
```

Expected: FAIL because layout is still fully dark and login lacks registration link.

- [ ] **Step 3: Update layout**

Use dark root/sidebar with light main:

```tsx
export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-card text-slate-950">
      <div className="flex min-h-screen">
        <AdminSidebar />
        <main className="flex-1 bg-slate-100 px-4 py-5 md:px-8">
          <div className="mb-5 rounded-md border border-slate-200 bg-white px-4 py-3 text-slate-900 md:hidden">
            方直智胜后台
          </div>
          <div className="mx-auto max-w-[1440px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Add login registration link**

Import `Link` and add below the login button:

```tsx
<div className="mt-4 border-t border-white/10 pt-4 text-center text-sm text-stone-300">
  机构还没有账号？
  <Link className="ml-2 text-brand-gold hover:underline" href="/admin/register">
    机构注册
  </Link>
</div>
```

- [ ] **Step 5: Run tests and commit**

Run:

```bash
npm test -- test/admin-ui.test.cjs
```

Expected: PASS.

Commit:

```bash
git add src/components/admin/AdminLayout.tsx src/components/admin/AdminSidebar.tsx app/admin/login/page.tsx test/admin-ui.test.cjs
git commit -m "feat: update admin shell and registration entry"
```

---

### Task 8: Rebuild Drama Management Page

**Files:**
- Modify: `app/admin/dramas/page.tsx`
- Modify: `app/admin/dramas/new/page.tsx`
- Modify: `app/admin/dramas/[id]/page.tsx`
- Test: `test/admin-ui.test.cjs`
- Test: `test/frontend-api-wiring.test.cjs`

- [ ] **Step 1: Write failing tests**

Add to `test/admin-ui.test.cjs`:

```js
test('admin dramas page uses drawer workspace and independent status actions', () => {
  const page = read('app/admin/dramas/page.tsx');

  assert.match(page, /AdminDrawer/);
  assert.match(page, /AdminListToolbar/);
  assert.match(page, /AdminMediaUpload/);
  assert.match(page, /GenreMultiSelect/);
  assert.match(page, /\/api\/admin\/dramas\/\$\{selectedDrama\.id\}\/release/);
  assert.match(page, /\/api\/admin\/dramas\/\$\{drama\.id\}\/review/);
  assert.match(page, /posterUrl/);
  assert.doesNotMatch(page, /短标语.*列表/);
});
```

- [ ] **Step 2: Run test and verify failure**

Run:

```bash
npm test -- test/admin-ui.test.cjs
```

Expected: FAIL because dramas page is still a simple link list.

- [ ] **Step 3: Define page types and local state**

Use these client-side types:

```ts
interface AdminDrama {
  id: string;
  title: string;
  subtitle: string | null;
  synopsis: string | null;
  coverPath: string;
  coverUrl: string | null;
  posterPath: string | null;
  posterUrl: string | null;
  reviewStatus: string;
  releaseStatus: 'upcoming' | 'released';
  sortOrder: number;
  updatedAt: string;
  genres?: Array<{ genreCode: string; genreName: string }>;
  _count?: { episodes: number };
}

const emptyForm = {
  title: '',
  subtitle: '',
  synopsis: '',
  coverPath: '',
  posterPath: '',
  releaseStatus: 'upcoming' as const,
  sortOrder: 0,
  genreCodes: [] as string[],
};
```

- [ ] **Step 4: Build toolbar filters**

Implement separate filter state:

```ts
const [releaseFilter, setReleaseFilter] = useState('all');
const [reviewFilter, setReviewFilter] = useState('all');
const [search, setSearch] = useState('');
```

Filter locally:

```ts
const visibleDramas = dramas.filter((drama) => {
  const matchesSearch = drama.title.includes(search);
  const matchesRelease = releaseFilter === 'all' || drama.releaseStatus === releaseFilter;
  const matchesReview = reviewFilter === 'all' || drama.reviewStatus === reviewFilter;
  return matchesSearch && matchesRelease && matchesReview;
});
```

- [ ] **Step 5: Add row status actions**

Use functions:

```ts
async function submitForReview(dramaId: string) {
  await adminApi(`/api/admin/dramas/${dramaId}/submit`, { method: 'POST', body: '{}' });
  await load();
}

async function reviewDrama(dramaId: string, action: 'approve' | 'reject', reason?: string) {
  await adminApi(`/api/admin/dramas/${dramaId}/review`, {
    method: 'POST',
    body: JSON.stringify({ action, reason }),
  });
  await load();
}

async function updateRelease(dramaId: string, releaseStatus: 'upcoming' | 'released') {
  await adminApi(`/api/admin/dramas/${dramaId}/release`, {
    method: 'POST',
    body: JSON.stringify({ releaseStatus }),
  });
  await load();
}
```

- [ ] **Step 6: Add drawer create/update save**

For create:

```ts
await adminApi('/api/admin/dramas', {
  method: 'POST',
  body: JSON.stringify(form),
});
```

For update:

```ts
await adminApi(`/api/admin/dramas/${selectedDrama.id}`, {
  method: 'PUT',
  body: JSON.stringify(form),
});
```

Use `AdminMediaUpload` for `coverPath` and `posterPath`, and `GenreMultiSelect` for `genreCodes`.

- [ ] **Step 7: Keep old routes compatible**

Change `app/admin/dramas/new/page.tsx` to redirect or link back:

```tsx
import { redirect } from 'next/navigation';

export default function AdminNewDramaPage() {
  redirect('/admin/dramas');
}
```

Change `app/admin/dramas/[id]/page.tsx` similarly:

```tsx
import { redirect } from 'next/navigation';

export default function AdminDramaDetailPage() {
  redirect('/admin/dramas');
}
```

- [ ] **Step 8: Run tests and commit**

Run:

```bash
npm test -- test/admin-ui.test.cjs test/frontend-api-wiring.test.cjs
```

Expected: PASS.

Commit:

```bash
git add app/admin/dramas/page.tsx app/admin/dramas/new/page.tsx 'app/admin/dramas/[id]/page.tsx' test/admin-ui.test.cjs test/frontend-api-wiring.test.cjs
git commit -m "feat: rebuild admin drama workspace"
```

---

### Task 9: Rebuild Episode Management Page

**Files:**
- Modify: `app/admin/dramas/[id]/episodes/page.tsx`
- Modify: `app/api/admin/dramas/[id]/episodes/[episodeId]/route.ts`
- Test: `test/admin-ui.test.cjs`
- Test: `test/admin-episode.test.cjs`

- [ ] **Step 1: Write failing tests**

Add:

```js
test('admin episodes page uses drawer workspace with video previews and publish actions', () => {
  const page = read('app/admin/dramas/[id]/episodes/page.tsx');

  assert.match(page, /AdminDrawer/);
  assert.match(page, /AdminMediaPreview/);
  assert.match(page, /AdminMediaUpload/);
  assert.match(page, /videoPreviewUrl/);
  assert.match(page, /\/status/);
  assert.doesNotMatch(page, /accessLevel/);
});
```

Add:

```js
test('episode detail route supports PUT updates for drawer save', () => {
  const route = read('app/api/admin/dramas/[id]/episodes/[episodeId]/route.ts');

  assert.match(route, /export async function PUT/);
  assert.match(route, /upsertAdminEpisode/);
});
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
npm test -- test/admin-ui.test.cjs test/admin-episode.test.cjs
```

Expected: FAIL because episode page and detail route are not drawer-based.

- [ ] **Step 3: Add PUT route for episode drawer save**

In `app/api/admin/dramas/[id]/episodes/[episodeId]/route.ts`, import `z` and `upsertAdminEpisode`, then add:

```ts
export async function PUT(
  request: Request,
  { params }: { params: { id: string; episodeId: string } },
) {
  try {
    const adminUser = await requireAdminSession();
    assertApprovedOrganization(adminUser);
    const episode = await upsertAdminEpisode(adminUser, params.id, await request.json());
    return ok({ episode });
  } catch (error) {
    if (error instanceof z.ZodError) return fail('INVALID_REQUEST', '请求参数错误', 400);
    if (error instanceof Error && 'code' in error && 'status' in error) {
      return fail(String(error.code), error.message, Number(error.status));
    }
    return fail('ADMIN_EPISODE_OPERATION_FAILED', '分集操作失败', 500, error);
  }
}
```

- [ ] **Step 4: Rebuild page state and form**

Use:

```ts
interface AdminEpisode {
  id: string;
  episodeNo: number;
  title: string;
  summary: string | null;
  videoPath: string;
  videoPreviewUrl: string | null;
  videoUrl: string | null;
  coverPath: string | null;
  coverUrl: string | null;
  durationSeconds: number;
  status: 'draft' | 'published';
  updatedAt: string;
}

const emptyEpisodeForm = {
  episodeNo: 1,
  title: '',
  summary: '',
  videoPath: '',
  coverPath: '',
  durationSeconds: 0,
  status: 'draft' as const,
};
```

Do not include `accessLevel` in UI or form.

- [ ] **Step 5: Add video preview rows and drawer**

Use:

```tsx
<AdminMediaPreview type="video" url={episode.videoPreviewUrl} label={`第${episode.episodeNo}集预览`} />
```

In the drawer, use `AdminMediaUpload fileKind="episode" mediaKind="video"` for `videoPath` and `fileKind="cover"` for optional cover.

- [ ] **Step 6: Add independent publish action**

Use:

```ts
async function updateEpisodeStatus(episodeId: string, status: 'draft' | 'published') {
  await adminApi(`/api/admin/dramas/${id}/episodes/${episodeId}/status`, {
    method: 'POST',
    body: JSON.stringify({ status }),
  });
  await load();
}
```

- [ ] **Step 7: Run tests and commit**

Run:

```bash
npm test -- test/admin-ui.test.cjs test/admin-episode.test.cjs
```

Expected: PASS.

Commit:

```bash
git add 'app/admin/dramas/[id]/episodes/page.tsx' 'app/api/admin/dramas/[id]/episodes/[episodeId]/route.ts' test/admin-ui.test.cjs test/admin-episode.test.cjs
git commit -m "feat: rebuild admin episode workspace"
```

---

### Task 10: Rebuild Organization Management Page

**Files:**
- Modify: `app/admin/organizations/page.tsx`
- Modify: `app/admin/organizations/[id]/page.tsx`
- Test: `test/admin-ui.test.cjs`
- Test: `test/admin-organization.test.cjs`

- [ ] **Step 1: Write failing tests**

Add:

```js
test('admin organizations page uses drawer workspace and admin-create form', () => {
  const page = read('app/admin/organizations/page.tsx');

  assert.match(page, /AdminDrawer/);
  assert.match(page, /AdminListToolbar/);
  assert.match(page, /AdminMediaUpload/);
  assert.match(page, /initialStatus/);
  assert.match(page, /直接启用/);
  assert.match(page, /待审核/);
  assert.match(page, /\/api\/admin\/organizations\/\$\{organization\.id\}\/review/);
});
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
npm test -- test/admin-ui.test.cjs test/admin-organization.test.cjs
```

Expected: FAIL because organizations page is still a link list.

- [ ] **Step 3: Define organization page types**

Use:

```ts
interface Organization {
  id: string;
  name: string;
  contactName: string;
  contactPhone: string;
  email: string | null;
  creditCode: string;
  address: string | null;
  description: string | null;
  businessLicensePath: string;
  businessLicenseUrl: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const emptyOrganizationForm = {
  name: '',
  contactName: '',
  contactPhone: '',
  email: '',
  creditCode: '',
  address: '',
  description: '',
  businessLicensePath: '',
  password: '',
  initialStatus: 'approved' as 'approved' | 'pending',
};
```

- [ ] **Step 4: Add create/update drawer behavior**

Create uses:

```ts
await adminApi('/api/admin/organizations', {
  method: 'POST',
  body: JSON.stringify(form),
});
```

Update uses:

```ts
await adminApi(`/api/admin/organizations/${selectedOrganization.id}`, {
  method: 'PUT',
  body: JSON.stringify({
    name: form.name,
    contactName: form.contactName,
    contactPhone: form.contactPhone,
    email: form.email,
    creditCode: form.creditCode,
    address: form.address,
    description: form.description,
    businessLicensePath: form.businessLicensePath,
  }),
});
```

- [ ] **Step 5: Add pending-only review buttons**

Use:

```ts
async function reviewOrganization(organizationId: string, action: 'approve' | 'reject', reason?: string) {
  await adminApi(`/api/admin/organizations/${organizationId}/review`, {
    method: 'POST',
    body: JSON.stringify({ action, reason }),
  });
  await load();
}
```

Only render these buttons for `organization.status === 'pending'`.

- [ ] **Step 6: Redirect old organization detail page**

Change `app/admin/organizations/[id]/page.tsx`:

```tsx
import { redirect } from 'next/navigation';

export default function AdminOrganizationDetailPage() {
  redirect('/admin/organizations');
}
```

- [ ] **Step 7: Run tests and commit**

Run:

```bash
npm test -- test/admin-ui.test.cjs test/admin-organization.test.cjs
```

Expected: PASS.

Commit:

```bash
git add app/admin/organizations/page.tsx 'app/admin/organizations/[id]/page.tsx' test/admin-ui.test.cjs test/admin-organization.test.cjs
git commit -m "feat: rebuild admin organization workspace"
```

---

### Task 11: Final Responsive, Contract, and Security Checks

**Files:**
- Modify tests only if they need updated expectations:
  - `test/api-contract.test.cjs`
  - `test/admin-security.test.cjs`
  - `test/responsive-tailwind.test.cjs`

- [ ] **Step 1: Run full test suite**

Run:

```bash
npm test
```

Expected: PASS. If a test fails because it asserts old UI structure, update the assertion to match the new drawer workspace while preserving the same behavioral guarantee.

- [ ] **Step 2: Run production build**

Run:

```bash
npm run build
```

Expected: PASS. Fix TypeScript errors by tightening local interfaces or service return types. Do not suppress errors with `any` unless the source API truly returns unknown JSON.

- [ ] **Step 3: Manually smoke test in browser**

Run:

```bash
npm run dev
```

Open:

- `http://localhost:3000/admin/login`
- `http://localhost:3000/admin/dramas`
- `http://localhost:3000/admin/organizations`

Verify:

- Login page has “机构注册”.
- Drama list uses light workspace and dark sidebar.
- Drama rows show poster image area, review status, release status, and row action buttons.
- Drama drawer opens and closes without layout shift.
- Episode page shows video preview containers.
- Organization drawer has `直接启用 / 待审核`.
- Upload controls show preview/replacement UI instead of a bare file input.

- [ ] **Step 4: Commit final test adjustments**

If Step 1 or Step 2 required test-only or typing fixes, commit:

```bash
git add test src app
git commit -m "test: verify admin content management redesign"
```

If no changes were required, do not create an empty commit.

---

## Self-Review Notes

Spec coverage:

- Admin-created organizations with `approved/pending`: Task 5, Task 10.
- Login registration entry: Task 7.
- Drama list status display and independent review/release actions: Task 3, Task 8.
- Drawer-based drama, episode, and organization UX: Task 6, Task 8, Task 9, Task 10.
- Episode video upload and preview: Task 1, Task 4, Task 6, Task 9.
- Signed admin media URLs instead of raw paths for display: Task 1, Task 8, Task 9, Task 10.
- Fixed genres: Task 2, Task 8.
- No trailer preview, no episode access-level UI, no slug field: Task 2, Task 8, Task 9.
- Final `npm test` and `npm run build`: Task 11.

Placeholder scan:

- This plan contains concrete file paths, commands, and code snippets for each implementation task.
- Dynamic route paths must be quoted in shell commands, for example `'app/admin/dramas/[id]/page.tsx'`.

Type consistency:

- Drama release uses `releaseStatus: 'upcoming' | 'released'`.
- Episode status uses `status: 'draft' | 'published'`.
- Organization creation uses `initialStatus: 'approved' | 'pending'`.
- Form submissions store OSS path fields only; signed URL fields are display-only.
