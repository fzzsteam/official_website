# Prisma 迁移实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有 mysql2 原始 SQL 查询完整迁移至 Prisma Client，并建立容器启动时自动执行 `prisma migrate deploy` 的机制。

**Architecture:** 新增 `prisma/schema.prisma`（10 张表）和基线迁移文件，`src/lib/db/prisma.ts` 替代 `client.ts` 作为 PrismaClient 单例，所有 service 和 route 文件改用 Prisma Client API，支付事务用 `prisma.$transaction()` + `$queryRaw` 保留 `FOR UPDATE` 锁，Dockerfile 改由 `docker-entrypoint.sh` 先跑 `migrate deploy` 再启动应用。

**Tech Stack:** Prisma 5.x, @prisma/client, MySQL, Next.js 14, TypeScript

---

## 文件结构

| 操作 | 文件 |
|------|------|
| 新建 | `prisma/schema.prisma` |
| 新建 | `prisma/migrations/0001_init/migration.sql` |
| 新建 | `prisma/seed.ts` |
| 新建 | `src/lib/db/prisma.ts` |
| 新建 | `docker-entrypoint.sh` |
| 修改 | `src/lib/auth/sms-code.ts` |
| 修改 | `src/lib/drama/drama-service.ts` |
| 修改 | `src/lib/membership/membership-service.ts` |
| 修改 | `src/lib/payment/wechat-service.ts` |
| 修改 | `app/api/auth/login/route.ts` |
| 修改 | `app/api/auth/me/route.ts` |
| 修改 | `app/api/payments/wechat/status/route.ts` |
| 修改 | `src/lib/config/env.ts` |
| 修改 | `Dockerfile` |
| 修改 | `package.json` |
| 修改 | `test/db-schema.test.cjs` |
| 修改 | `test/api-contract.test.cjs` |
| 修改 | `test/server-drama.test.cjs` |
| 修改 | `test/server-auth.test.cjs` |
| 删除 | `src/lib/db/client.ts` |
| 删除 | `src/lib/db/schema.sql` |
| 删除 | `src/lib/db/seed.sql` |

---

## Task 1: 安装 Prisma 依赖

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 安装依赖**

```bash
cd /Users/yuanjiawei/ai-coding/fzzs/official_website
npm install prisma @prisma/client
npm uninstall mysql2
```

- [ ] **Step 2: 验证安装**

```bash
npx prisma --version
```

Expected: 输出 Prisma CLI 版本号，无报错。

---

## Task 2: 创建 Prisma Schema

**Files:**
- Create: `prisma/schema.prisma`

- [ ] **Step 1: 创建 schema.prisma**

写入 `prisma/schema.prisma`：

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model User {
  id           String    @id @db.Char(36)
  phone        String    @unique @db.VarChar(32)
  nickname     String?   @db.VarChar(100)
  avatarPath   String?   @map("avatar_path") @db.VarChar(255)
  vipExpiredAt DateTime? @map("vip_expired_at") @db.DateTime(3)
  status       String    @default("active") @db.VarChar(32)
  lastLoginAt  DateTime? @map("last_login_at") @db.DateTime(3)
  createdAt    DateTime  @default(now()) @map("created_at") @db.DateTime(3)
  updatedAt    DateTime  @updatedAt @map("updated_at") @db.DateTime(3)
  orders       Order[]

  @@map("users")
}

model SmsCode {
  id         String    @id @db.Char(36)
  phone      String    @db.VarChar(32)
  codeHash   String    @map("code_hash") @db.VarChar(255)
  purpose    String    @default("login") @db.VarChar(32)
  expiresAt  DateTime  @map("expires_at") @db.DateTime(3)
  consumedAt DateTime? @map("consumed_at") @db.DateTime(3)
  requestIp  String?   @map("request_ip") @db.VarChar(64)
  status     String    @default("pending") @db.VarChar(32)
  createdAt  DateTime  @default(now()) @map("created_at") @db.DateTime(3)
  updatedAt  DateTime  @updatedAt @map("updated_at") @db.DateTime(3)

  @@index([phone, purpose], name: "idx_sms_codes_phone_purpose")
  @@index([expiresAt], name: "idx_sms_codes_expires_at")
  @@map("sms_codes")
}

model MembershipPlan {
  id           String   @id @db.Char(36)
  code         String   @unique @db.VarChar(64)
  name         String   @db.VarChar(100)
  durationDays Int      @map("duration_days")
  priceCents   Int      @map("price_cents")
  enabled      Boolean  @default(true) @db.TinyInt(1)
  sortOrder    Int      @default(0) @map("sort_order")
  description  String?  @db.VarChar(255)
  createdAt    DateTime @default(now()) @map("created_at") @db.DateTime(3)
  updatedAt    DateTime @updatedAt @map("updated_at") @db.DateTime(3)
  orders       Order[]

  @@map("membership_plans")
}

model Order {
  id                         String                      @id @db.Char(36)
  orderNo                    String                      @unique @map("order_no") @db.VarChar(64)
  userId                     String                      @map("user_id") @db.Char(36)
  membershipPlanId           String?                     @map("membership_plan_id") @db.Char(36)
  totalCents                 Int                         @map("total_cents")
  paidCents                  Int                         @default(0) @map("paid_cents")
  status                     String                      @default("pending") @db.VarChar(32)
  paymentChannel             String                      @default("wechat_native") @map("payment_channel") @db.VarChar(32)
  paidAt                     DateTime?                   @map("paid_at") @db.DateTime(3)
  closedAt                   DateTime?                   @map("closed_at") @db.DateTime(3)
  description                String?                     @db.VarChar(255)
  createdAt                  DateTime                    @default(now()) @map("created_at") @db.DateTime(3)
  updatedAt                  DateTime                    @updatedAt @map("updated_at") @db.DateTime(3)
  user                       User                        @relation(fields: [userId], references: [id])
  membershipPlan             MembershipPlan?             @relation(fields: [membershipPlanId], references: [id])
  wechatPaymentNotifications WechatPaymentNotification[]

  @@index([userId], name: "idx_orders_user_id")
  @@index([membershipPlanId], name: "idx_orders_membership_plan_id")
  @@map("orders")
}

model WechatPaymentNotification {
  id             String    @id @db.Char(36)
  orderId        String    @map("order_id") @db.Char(36)
  orderNo        String    @map("order_no") @db.VarChar(64)
  transactionId  String    @unique @map("transaction_id") @db.VarChar(64)
  eventType      String    @map("event_type") @db.VarChar(64)
  eventId        String    @unique @map("event_id") @db.VarChar(128)
  resourceType   String?   @map("resource_type") @db.VarChar(64)
  rawPayloadJson Json      @map("raw_payload_json")
  processed      Boolean   @default(false) @db.TinyInt(1)
  processedAt    DateTime? @map("processed_at") @db.DateTime(3)
  createdAt      DateTime  @default(now()) @map("created_at") @db.DateTime(3)
  updatedAt      DateTime  @updatedAt @map("updated_at") @db.DateTime(3)
  order          Order     @relation(fields: [orderId], references: [id])

  @@index([orderId], name: "idx_wechat_payment_notifications_order_id")
  @@map("wechat_payment_notifications")
}

model Drama {
  id              String           @id @db.Char(36)
  slug            String           @unique @db.VarChar(128)
  title           String           @db.VarChar(150)
  subtitle        String?          @db.VarChar(255)
  synopsis        String?          @db.Text
  coverPath       String           @map("cover_path") @db.VarChar(255)
  posterPath      String?          @map("poster_path") @db.VarChar(255)
  trailerPath     String?          @map("trailer_path") @db.VarChar(255)
  status          String           @default("draft") @db.VarChar(32)
  releaseStatus   String           @default("upcoming") @map("release_status") @db.VarChar(32)
  publishedAt     DateTime?        @map("published_at") @db.DateTime(3)
  sortOrder       Int              @default(0) @map("sort_order")
  createdAt       DateTime         @default(now()) @map("created_at") @db.DateTime(3)
  updatedAt       DateTime         @updatedAt @map("updated_at") @db.DateTime(3)
  genres          DramaGenre[]
  episodes        Episode[]
  castMembers     CastMember[]
  recommendations Recommendation[]

  @@map("dramas")
}

model DramaGenre {
  id        String   @id @db.Char(36)
  dramaId   String   @map("drama_id") @db.Char(36)
  genreCode String   @map("genre_code") @db.VarChar(64)
  genreName String   @map("genre_name") @db.VarChar(64)
  createdAt DateTime @default(now()) @map("created_at") @db.DateTime(3)
  updatedAt DateTime @updatedAt @map("updated_at") @db.DateTime(3)
  drama     Drama    @relation(fields: [dramaId], references: [id])

  @@unique([dramaId, genreCode], name: "uk_drama_genres_drama_genre")
  @@map("drama_genres")
}

model Episode {
  id              String    @id @db.Char(36)
  dramaId         String    @map("drama_id") @db.Char(36)
  episodeNo       Int       @map("episode_no")
  title           String    @db.VarChar(150)
  summary         String?   @db.Text
  videoPath       String    @map("video_path") @db.VarChar(255)
  coverPath       String?   @map("cover_path") @db.VarChar(255)
  durationSeconds Int       @default(0) @map("duration_seconds")
  accessLevel     String    @default("member") @map("access_level") @db.VarChar(32)
  status          String    @default("draft") @db.VarChar(32)
  publishedAt     DateTime? @map("published_at") @db.DateTime(3)
  createdAt       DateTime  @default(now()) @map("created_at") @db.DateTime(3)
  updatedAt       DateTime  @updatedAt @map("updated_at") @db.DateTime(3)
  drama           Drama     @relation(fields: [dramaId], references: [id])

  @@unique([dramaId, episodeNo], name: "uk_episodes_drama_episode")
  @@index([dramaId], name: "idx_episodes_drama_id")
  @@map("episodes")
}

model CastMember {
  id         String   @id @db.Char(36)
  dramaId    String   @map("drama_id") @db.Char(36)
  name       String   @db.VarChar(100)
  roleName   String?  @map("role_name") @db.VarChar(100)
  avatarPath String?  @map("avatar_path") @db.VarChar(255)
  sortOrder  Int      @default(0) @map("sort_order")
  createdAt  DateTime @default(now()) @map("created_at") @db.DateTime(3)
  updatedAt  DateTime @updatedAt @map("updated_at") @db.DateTime(3)
  drama      Drama    @relation(fields: [dramaId], references: [id])

  @@index([dramaId], name: "idx_cast_members_drama_id")
  @@map("cast_members")
}

model Recommendation {
  id                 String   @id @db.Char(36)
  dramaId            String   @map("drama_id") @db.Char(36)
  recommendationType String   @default("homepage") @map("recommendation_type") @db.VarChar(32)
  sortOrder          Int      @default(0) @map("sort_order")
  enabled            Boolean  @default(true) @db.TinyInt(1)
  createdAt          DateTime @default(now()) @map("created_at") @db.DateTime(3)
  updatedAt          DateTime @updatedAt @map("updated_at") @db.DateTime(3)
  drama              Drama    @relation(fields: [dramaId], references: [id])

  @@unique([recommendationType, dramaId], name: "uk_recommendations_type_drama")
  @@map("recommendations")
}
```

- [ ] **Step 2: 生成 Prisma Client**

```bash
npx prisma generate
```

Expected: 无报错，输出 `✔ Generated Prisma Client`。

---

## Task 3: 创建基线迁移文件

**Files:**
- Create: `prisma/migrations/0001_init/migration.sql`

- [ ] **Step 1: 创建迁移目录并写入 migration.sql**

```bash
mkdir -p /Users/yuanjiawei/ai-coding/fzzs/official_website/prisma/migrations/0001_init
```

写入 `prisma/migrations/0001_init/migration.sql`（全部使用 `IF NOT EXISTS`，保证对已有生产库幂等）：

```sql
CREATE TABLE IF NOT EXISTS `users` (
  `id` CHAR(36) NOT NULL,
  `phone` VARCHAR(32) NOT NULL,
  `nickname` VARCHAR(100) NULL,
  `avatar_path` VARCHAR(255) NULL,
  `vip_expired_at` DATETIME(3) NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'active',
  `last_login_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `sms_codes` (
  `id` CHAR(36) NOT NULL,
  `phone` VARCHAR(32) NOT NULL,
  `code_hash` VARCHAR(255) NOT NULL,
  `purpose` VARCHAR(32) NOT NULL DEFAULT 'login',
  `expires_at` DATETIME(3) NOT NULL,
  `consumed_at` DATETIME(3) NULL,
  `request_ip` VARCHAR(64) NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'pending',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_sms_codes_phone_purpose` (`phone`, `purpose`),
  KEY `idx_sms_codes_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `membership_plans` (
  `id` CHAR(36) NOT NULL,
  `code` VARCHAR(64) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `duration_days` INT NOT NULL,
  `price_cents` INT NOT NULL,
  `enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `sort_order` INT NOT NULL DEFAULT 0,
  `description` VARCHAR(255) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_membership_plans_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `orders` (
  `id` CHAR(36) NOT NULL,
  `order_no` VARCHAR(64) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `membership_plan_id` CHAR(36) NULL,
  `total_cents` INT NOT NULL,
  `paid_cents` INT NOT NULL DEFAULT 0,
  `status` VARCHAR(32) NOT NULL DEFAULT 'pending',
  `payment_channel` VARCHAR(32) NOT NULL DEFAULT 'wechat_native',
  `paid_at` DATETIME(3) NULL,
  `closed_at` DATETIME(3) NULL,
  `description` VARCHAR(255) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_orders_order_no` (`order_no`),
  KEY `idx_orders_user_id` (`user_id`),
  KEY `idx_orders_membership_plan_id` (`membership_plan_id`),
  CONSTRAINT `fk_orders_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_orders_membership_plan_id` FOREIGN KEY (`membership_plan_id`) REFERENCES `membership_plans` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `wechat_payment_notifications` (
  `id` CHAR(36) NOT NULL,
  `order_id` CHAR(36) NOT NULL,
  `order_no` VARCHAR(64) NOT NULL,
  `transaction_id` VARCHAR(64) NOT NULL,
  `event_type` VARCHAR(64) NOT NULL,
  `event_id` VARCHAR(128) NOT NULL,
  `resource_type` VARCHAR(64) NULL,
  `raw_payload_json` JSON NOT NULL,
  `processed` TINYINT(1) NOT NULL DEFAULT 0,
  `processed_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_wechat_payment_notifications_event_id` (`event_id`),
  UNIQUE KEY `uk_wechat_payment_notifications_transaction_id` (`transaction_id`),
  KEY `idx_wechat_payment_notifications_order_id` (`order_id`),
  CONSTRAINT `fk_wechat_payment_notifications_order_id` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `dramas` (
  `id` CHAR(36) NOT NULL,
  `slug` VARCHAR(128) NOT NULL,
  `title` VARCHAR(150) NOT NULL,
  `subtitle` VARCHAR(255) NULL,
  `synopsis` TEXT NULL,
  `cover_path` VARCHAR(255) NOT NULL,
  `poster_path` VARCHAR(255) NULL,
  `trailer_path` VARCHAR(255) NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'draft',
  `release_status` VARCHAR(32) NOT NULL DEFAULT 'upcoming',
  `published_at` DATETIME(3) NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_dramas_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `drama_genres` (
  `id` CHAR(36) NOT NULL,
  `drama_id` CHAR(36) NOT NULL,
  `genre_code` VARCHAR(64) NOT NULL,
  `genre_name` VARCHAR(64) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_drama_genres_drama_genre` (`drama_id`, `genre_code`),
  CONSTRAINT `fk_drama_genres_drama_id` FOREIGN KEY (`drama_id`) REFERENCES `dramas` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `episodes` (
  `id` CHAR(36) NOT NULL,
  `drama_id` CHAR(36) NOT NULL,
  `episode_no` INT NOT NULL,
  `title` VARCHAR(150) NOT NULL,
  `summary` TEXT NULL,
  `video_path` VARCHAR(255) NOT NULL,
  `cover_path` VARCHAR(255) NULL,
  `duration_seconds` INT NOT NULL DEFAULT 0,
  `access_level` VARCHAR(32) NOT NULL DEFAULT 'member',
  `status` VARCHAR(32) NOT NULL DEFAULT 'draft',
  `published_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_episodes_drama_episode` (`drama_id`, `episode_no`),
  KEY `idx_episodes_drama_id` (`drama_id`),
  CONSTRAINT `fk_episodes_drama_id` FOREIGN KEY (`drama_id`) REFERENCES `dramas` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cast_members` (
  `id` CHAR(36) NOT NULL,
  `drama_id` CHAR(36) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `role_name` VARCHAR(100) NULL,
  `avatar_path` VARCHAR(255) NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_cast_members_drama_id` (`drama_id`),
  CONSTRAINT `fk_cast_members_drama_id` FOREIGN KEY (`drama_id`) REFERENCES `dramas` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `recommendations` (
  `id` CHAR(36) NOT NULL,
  `drama_id` CHAR(36) NOT NULL,
  `recommendation_type` VARCHAR(32) NOT NULL DEFAULT 'homepage',
  `sort_order` INT NOT NULL DEFAULT 0,
  `enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_recommendations_type_drama` (`recommendation_type`, `drama_id`),
  CONSTRAINT `fk_recommendations_drama_id` FOREIGN KEY (`drama_id`) REFERENCES `dramas` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

- [ ] **Step 2: 验证 schema 与迁移文件一致**

```bash
cd /Users/yuanjiawei/ai-coding/fzzs/official_website
npx prisma validate
```

Expected: `The schema at prisma/schema.prisma is valid` 无报错。

---

## Task 4: 创建 PrismaClient 单例

**Files:**
- Create: `src/lib/db/prisma.ts`

- [ ] **Step 1: 写入 prisma.ts**

写入 `src/lib/db/prisma.ts`：

```typescript
import 'server-only';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

- [ ] **Step 2: 提交**

```bash
git add prisma/ src/lib/db/prisma.ts
git commit -m "feat: add Prisma schema, baseline migration, and client singleton"
```

---

## Task 5: 更新 env.ts（移除 DATABASE_URL）

**Files:**
- Modify: `src/lib/config/env.ts`

- [ ] **Step 1: 从 envSchema 移除 DATABASE_URL**

将 `src/lib/config/env.ts` 替换为：

```typescript
import 'server-only';
import { z } from 'zod';

const envSchema = z.object({
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

---

## Task 6: 迁移 sms-code.ts

**Files:**
- Modify: `src/lib/auth/sms-code.ts`

- [ ] **Step 1: 替换为 Prisma Client 实现**

写入 `src/lib/auth/sms-code.ts`：

```typescript
import 'server-only';

import bcrypt from 'bcryptjs';
import { randomInt, randomUUID } from 'node:crypto';
import { prisma } from '@/lib/db/prisma';

const LOGIN_SCENE = 'login';
const CODE_EXPIRES_IN_MS = 5 * 60 * 1000;

export function normalizePhone(phone: string) {
  const normalized = phone.replace(/\s+/g, '').replace(/^\+86/, '');

  if (!/^1\d{10}$/.test(normalized)) {
    throw new Error('INVALID_PHONE');
  }

  return normalized;
}

export async function createSmsCode(phone: string, requestIp?: string | null) {
  const normalizedPhone = normalizePhone(phone);
  const code = String(randomInt(100000, 1000000));
  const expiresAt = new Date(Date.now() + CODE_EXPIRES_IN_MS);
  const codeHash = await bcrypt.hash(code, 10);

  await prisma.smsCode.create({
    data: {
      id: randomUUID(),
      phone: normalizedPhone,
      codeHash,
      purpose: LOGIN_SCENE,
      expiresAt,
      requestIp: requestIp ?? null,
      status: 'pending',
    },
  });

  return {
    code,
    expiresAt: expiresAt.toISOString(),
  };
}

export async function verifySmsCode(phone: string, code: string) {
  const normalizedPhone = normalizePhone(phone);
  const trimmedCode = code.trim();

  if (!/^\d{6}$/.test(trimmedCode)) {
    return false;
  }

  const rows = await prisma.smsCode.findMany({
    where: {
      phone: normalizedPhone,
      purpose: LOGIN_SCENE,
      status: 'pending',
      consumedAt: null,
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  const now = Date.now();

  for (const row of rows) {
    if (row.consumedAt || row.expiresAt.getTime() <= now) {
      continue;
    }

    const matched = await bcrypt.compare(trimmedCode, row.codeHash);

    if (!matched) {
      continue;
    }

    await prisma.smsCode.updateMany({
      where: { id: row.id, consumedAt: null },
      data: { consumedAt: new Date(), status: 'consumed' },
    });

    return true;
  }

  return false;
}
```

---

## Task 7: 迁移 membership-service.ts

**Files:**
- Modify: `src/lib/membership/membership-service.ts`

- [ ] **Step 1: 替换为 Prisma Client 实现**

写入 `src/lib/membership/membership-service.ts`：

```typescript
import 'server-only';

import { prisma } from '@/lib/db/prisma';

export interface MembershipPlan {
  id: string;
  code: string;
  name: string;
  durationDays: number;
  priceCents: number;
  enabled: boolean;
  sortOrder: number;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export function calculateNextVipExpiry(
  currentVipExpiredAt: Date | string | null,
  durationDays: number,
  now = new Date(),
) {
  const currentExpiry = currentVipExpiredAt ? new Date(currentVipExpiredAt) : null;
  const baseTime =
    currentExpiry && currentExpiry.getTime() > now.getTime() ? currentExpiry : now;

  return new Date(baseTime.getTime() + durationDays * 24 * 60 * 60 * 1000);
}

export async function getEnabledMembershipPlans(): Promise<MembershipPlan[]> {
  const rows = await prisma.membershipPlan.findMany({
    where: { enabled: true },
    orderBy: { sortOrder: 'asc' },
  });

  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    durationDays: row.durationDays,
    priceCents: row.priceCents,
    enabled: row.enabled,
    sortOrder: row.sortOrder,
    description: row.description,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
}
```

---

## Task 8: 迁移 drama-service.ts

**Files:**
- Modify: `src/lib/drama/drama-service.ts`

- [ ] **Step 1: 替换为 Prisma Client 实现**

写入 `src/lib/drama/drama-service.ts`：

```typescript
import 'server-only';

import { prisma } from '@/lib/db/prisma';
import { signOssPath } from '@/lib/oss/oss-service';

export interface PublishedDrama {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  synopsis: string | null;
  coverPath: string;
  posterPath: string | null;
  trailerPath: string | null;
  releaseStatus: string;
  publishedAt: string | null;
  sortOrder: number;
  totalEpisodes: number;
}

export interface DramaEpisode {
  id: string;
  episodeNo: number;
  title: string;
  summary: string | null;
  videoPath: string;
  coverPath: string | null;
  durationSeconds: number;
  accessLevel: string;
  isFree: boolean;
  publishedAt: string | null;
}

export interface DramaDetail extends PublishedDrama {
  genres: Array<{ code: string; name: string }>;
  cast: Array<{
    id: string;
    name: string;
    roleName: string | null;
    avatarPath: string | null;
    sortOrder: number;
  }>;
  episodes: DramaEpisode[];
  recommendations: Array<{
    id: string;
    slug: string;
    title: string;
    coverPath: string;
    sortOrder: number;
  }>;
}

export interface EpisodePlayUrlResult {
  dramaId: string;
  episodeNo: number;
  playUrl: string;
}

function createDramaError(code: string) {
  const error = new Error(code);
  error.name = code;
  return error;
}

function toIsoString(value: Date | null) {
  return value ? value.toISOString() : null;
}

function mapDramaEpisode(row: {
  id: string;
  episodeNo: number;
  title: string;
  summary: string | null;
  videoPath: string;
  coverPath: string | null;
  durationSeconds: number;
  accessLevel: string;
  publishedAt: Date | null;
}): DramaEpisode {
  return {
    id: row.id,
    episodeNo: row.episodeNo,
    title: row.title,
    summary: row.summary,
    videoPath: row.videoPath,
    coverPath: row.coverPath,
    durationSeconds: row.durationSeconds,
    accessLevel: row.accessLevel,
    isFree: row.accessLevel === 'free',
    publishedAt: toIsoString(row.publishedAt),
  };
}

function isVipActive(vipExpiredAt: Date | null) {
  return vipExpiredAt ? vipExpiredAt.getTime() > Date.now() : false;
}

export async function getPublishedDramas(): Promise<PublishedDrama[]> {
  const dramas = await prisma.drama.findMany({
    where: { status: 'published' },
    orderBy: [{ sortOrder: 'asc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
    include: {
      _count: {
        select: { episodes: { where: { status: 'published' } } },
      },
    },
  });

  return dramas.map((d) => ({
    id: d.id,
    slug: d.slug,
    title: d.title,
    subtitle: d.subtitle,
    synopsis: d.synopsis,
    coverPath: d.coverPath,
    posterPath: d.posterPath,
    trailerPath: d.trailerPath,
    releaseStatus: d.releaseStatus,
    publishedAt: toIsoString(d.publishedAt),
    sortOrder: d.sortOrder,
    totalEpisodes: d._count.episodes,
  }));
}

export async function getDramaDetail(dramaId: string): Promise<DramaDetail> {
  const drama = await prisma.drama.findFirst({
    where: { id: dramaId, status: 'published' },
    include: {
      _count: { select: { episodes: { where: { status: 'published' } } } },
    },
  });

  if (!drama) {
    throw createDramaError('DRAMA_NOT_FOUND');
  }

  const [genres, cast, episodes, recommendations] = await Promise.all([
    prisma.dramaGenre.findMany({
      where: { dramaId },
      orderBy: { genreName: 'asc' },
    }),
    prisma.castMember.findMany({
      where: { dramaId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    }),
    prisma.episode.findMany({
      where: { dramaId, status: 'published' },
      orderBy: { episodeNo: 'asc' },
    }),
    prisma.recommendation.findMany({
      where: {
        dramaId: { not: dramaId },
        enabled: true,
        drama: { status: 'published' },
      },
      orderBy: [{ sortOrder: 'asc' }, { drama: { publishedAt: 'desc' } }],
      take: 12,
      include: { drama: true },
    }),
  ]);

  return {
    id: drama.id,
    slug: drama.slug,
    title: drama.title,
    subtitle: drama.subtitle,
    synopsis: drama.synopsis,
    coverPath: drama.coverPath,
    posterPath: drama.posterPath,
    trailerPath: drama.trailerPath,
    releaseStatus: drama.releaseStatus,
    publishedAt: toIsoString(drama.publishedAt),
    sortOrder: drama.sortOrder,
    totalEpisodes: drama._count.episodes,
    genres: genres.map((g) => ({ code: g.genreCode, name: g.genreName })),
    cast: cast.map((c) => ({
      id: c.id,
      name: c.name,
      roleName: c.roleName,
      avatarPath: c.avatarPath,
      sortOrder: c.sortOrder,
    })),
    episodes: episodes.map(mapDramaEpisode),
    recommendations: recommendations.map((r) => ({
      id: r.drama.id,
      slug: r.drama.slug,
      title: r.drama.title,
      coverPath: r.drama.coverPath,
      sortOrder: r.sortOrder,
    })),
  };
}

export async function getEpisodePlayUrl(
  dramaId: string,
  episodeNo: number,
  userId: string | null,
): Promise<EpisodePlayUrlResult> {
  const episode = await prisma.episode.findFirst({
    where: {
      dramaId,
      episodeNo,
      status: 'published',
      drama: { status: 'published' },
    },
  });

  if (!episode) {
    throw createDramaError('EPISODE_NOT_FOUND');
  }

  if (episode.accessLevel === 'free') {
    return {
      dramaId: episode.dramaId,
      episodeNo: episode.episodeNo,
      playUrl: signOssPath(episode.videoPath),
    };
  }

  if (!userId) {
    throw createDramaError('AUTH_REQUIRED');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { vipExpiredAt: true },
  });

  if (!user || !isVipActive(user.vipExpiredAt)) {
    throw createDramaError('VIP_REQUIRED');
  }

  return {
    dramaId: episode.dramaId,
    episodeNo: episode.episodeNo,
    playUrl: signOssPath(episode.videoPath),
  };
}
```

---

## Task 9: 迁移 wechat-service.ts

**Files:**
- Modify: `src/lib/payment/wechat-service.ts`

- [ ] **Step 1: 替换为 Prisma Client 实现**

写入 `src/lib/payment/wechat-service.ts`：

```typescript
import 'server-only';

import { randomUUID } from 'node:crypto';
import { getEnv } from '@/lib/config/env';
import { prisma } from '@/lib/db/prisma';
import { calculateNextVipExpiry } from '@/lib/membership/membership-service';

const ORDER_STATUS_PENDING = 'pending';
const ORDER_STATUS_PAID = 'paid';
const PAYMENT_CHANNEL_WECHAT_NATIVE = 'wechat_native';

interface WechatNotificationPayload {
  orderNo: string;
  transactionId: string;
  rawPayload: Record<string, unknown> | string;
  eventId?: string;
  eventType?: string;
  resourceType?: string;
  successTime?: string | null;
  amountCents?: number | null;
}

export interface WechatNativeOrder {
  orderId: string;
  orderNo: string;
  status: 'pending';
  planCode: string;
  totalCents: number;
  codeUrl: string;
  expiresAt: string;
}

export interface WechatNotificationResult {
  orderNo: string;
  status: 'paid';
  alreadyProcessed: boolean;
  transactionId: string;
  vipExpiredAt: string | null;
}

// 支付回调事务中用于 FOR UPDATE 的原始查询类型
interface OrderForUpdate {
  id: string;
  order_no: string;
  user_id: string;
  membership_plan_id: string | null;
  total_cents: number;
  paid_cents: number;
  status: string;
  paid_at: Date | null;
  description: string | null;
  duration_days: number | null;
  vip_expired_at: Date | null;
}

function createOrderNo() {
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const suffix = randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase();
  return `WX${timestamp}${suffix}`;
}

function normalizeRawPayload(rawPayload: Record<string, unknown> | string) {
  return typeof rawPayload === 'string' ? { raw: rawPayload } : rawPayload;
}

async function requestWechatNativeCodeUrl(
  orderNo: string,
  description: string,
  amountCents: number,
) {
  const env = getEnv();

  return {
    codeUrl:
      `weixin://wxpay/bizpayurl?` +
      `appid=${encodeURIComponent(env.WECHAT_PAY_APPID)}` +
      `&mchid=${encodeURIComponent(env.WECHAT_PAY_MCH_ID)}` +
      `&out_trade_no=${encodeURIComponent(orderNo)}` +
      `&amount=${amountCents}` +
      `&desc=${encodeURIComponent(description)}`,
    notifyUrl: env.WECHAT_PAY_NOTIFY_URL,
  };
}

export async function createWechatNativeOrder(
  userId: string,
  planCode: string,
): Promise<WechatNativeOrder> {
  const plan = await prisma.membershipPlan.findFirst({
    where: { code: planCode, enabled: true },
  });

  if (!plan) {
    throw new Error('PLAN_NOT_FOUND');
  }

  const orderId = randomUUID();
  const orderNo = createOrderNo();
  const description = `${plan.name}会员充值`;
  const totalCents = plan.priceCents;
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  const wechatOrder = await requestWechatNativeCodeUrl(orderNo, description, totalCents);

  await prisma.order.create({
    data: {
      id: orderId,
      orderNo,
      userId,
      membershipPlanId: plan.id,
      totalCents,
      paidCents: 0,
      status: ORDER_STATUS_PENDING,
      paymentChannel: PAYMENT_CHANNEL_WECHAT_NATIVE,
      description,
    },
  });

  return {
    orderId,
    orderNo,
    status: ORDER_STATUS_PENDING,
    planCode: plan.code,
    totalCents,
    codeUrl: wechatOrder.codeUrl,
    expiresAt: expiresAt.toISOString(),
  };
}

export async function handleWechatPaymentNotification(
  payload: WechatNotificationPayload,
): Promise<WechatNotificationResult> {
  const rawPayloadJson = normalizeRawPayload(payload.rawPayload);
  const eventId = payload.eventId || `event:${payload.transactionId}`;
  const eventType = payload.eventType || 'TRANSACTION.SUCCESS';
  const resourceType = payload.resourceType || 'encrypt-resource';

  return prisma.$transaction(async (tx) => {
    // FOR UPDATE 需要原始 SQL 以获得行锁
    const orderRows = await tx.$queryRaw<OrderForUpdate[]>`
      SELECT
        o.id, o.order_no, o.user_id, o.membership_plan_id,
        o.total_cents, o.paid_cents, o.status, o.paid_at, o.description,
        mp.duration_days, u.vip_expired_at
      FROM orders o
      LEFT JOIN membership_plans mp ON mp.id = o.membership_plan_id
      LEFT JOIN users u ON u.id = o.user_id
      WHERE o.order_no = ${payload.orderNo}
      LIMIT 1
      FOR UPDATE
    `;

    const order = orderRows[0];

    if (!order) {
      throw new Error('ORDER_NOT_FOUND');
    }

    await tx.wechatPaymentNotification.upsert({
      where: { eventId },
      create: {
        id: randomUUID(),
        orderId: order.id,
        orderNo: order.order_no,
        transactionId: payload.transactionId,
        eventType,
        eventId,
        resourceType,
        rawPayloadJson,
        processed: false,
        processedAt: null,
      },
      update: {
        rawPayloadJson,
        updatedAt: new Date(),
      },
    });

    if (order.status === ORDER_STATUS_PAID) {
      await tx.wechatPaymentNotification.updateMany({
        where: { orderNo: order.order_no, transactionId: payload.transactionId },
        data: { processed: true, processedAt: new Date() },
      });

      return {
        orderNo: order.order_no,
        status: ORDER_STATUS_PAID,
        alreadyProcessed: true,
        transactionId: payload.transactionId,
        vipExpiredAt: order.vip_expired_at ? order.vip_expired_at.toISOString() : null,
      };
    }

    if (!order.membership_plan_id || !order.duration_days) {
      throw new Error('ORDER_PLAN_INVALID');
    }

    const paidCents = payload.amountCents ?? order.total_cents;

    if (paidCents !== order.total_cents) {
      throw new Error('ORDER_AMOUNT_MISMATCH');
    }

    const paidAt = payload.successTime ? new Date(payload.successTime) : new Date();
    const nextVipExpiry = calculateNextVipExpiry(order.vip_expired_at, order.duration_days, paidAt);

    await tx.order.update({
      where: { id: order.id },
      data: { status: ORDER_STATUS_PAID, paidCents, paidAt },
    });

    await tx.user.update({
      where: { id: order.user_id },
      data: { vipExpiredAt: nextVipExpiry },
    });

    await tx.wechatPaymentNotification.updateMany({
      where: { orderNo: order.order_no, transactionId: payload.transactionId },
      data: { processed: true, processedAt: new Date() },
    });

    return {
      orderNo: order.order_no,
      status: ORDER_STATUS_PAID,
      alreadyProcessed: false,
      transactionId: payload.transactionId,
      vipExpiredAt: nextVipExpiry.toISOString(),
    };
  });
}
```

---

## Task 10: 迁移三个 API Route

**Files:**
- Modify: `app/api/auth/login/route.ts`
- Modify: `app/api/auth/me/route.ts`
- Modify: `app/api/payments/wechat/status/route.ts`

- [ ] **Step 1: 更新 login/route.ts**

写入 `app/api/auth/login/route.ts`：

```typescript
import { randomUUID } from 'node:crypto';
import { fail, ok } from '@/lib/api/response';
import { createSession } from '@/lib/auth/session';
import { normalizePhone, verifySmsCode } from '@/lib/auth/sms-code';
import { prisma } from '@/lib/db/prisma';

function isVipActive(vipExpiredAt: Date | null) {
  return vipExpiredAt ? vipExpiredAt.getTime() > Date.now() : false;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const phone = normalizePhone(String(body?.phone || ''));
    const code = String(body?.code || '');
    const verified = await verifySmsCode(phone, code);

    if (!verified) {
      return fail('INVALID_SMS_CODE', '验证码错误或已过期', 400);
    }

    let user = await prisma.user.findUnique({
      where: { phone },
      select: { id: true, phone: true, vipExpiredAt: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { id: randomUUID(), phone, lastLoginAt: new Date() },
        select: { id: true, phone: true, vipExpiredAt: true },
      });
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    }

    await createSession(user.id);

    return ok({
      user: {
        id: user.id,
        phone: user.phone,
        isVip: isVipActive(user.vipExpiredAt),
        vipExpiredAt: user.vipExpiredAt ? user.vipExpiredAt.toISOString() : null,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_PHONE') {
      return fail('INVALID_PHONE', '手机号格式错误', 400);
    }

    return fail('LOGIN_FAILED', '登录失败', 500);
  }
}
```

- [ ] **Step 2: 更新 me/route.ts**

写入 `app/api/auth/me/route.ts`：

```typescript
import { fail, ok } from '@/lib/api/response';
import { getSessionUserId } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

function isVipActive(vipExpiredAt: Date | null) {
  return vipExpiredAt ? vipExpiredAt.getTime() > Date.now() : false;
}

export async function GET() {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return ok({ user: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, phone: true, vipExpiredAt: true },
    });

    if (!user) {
      return ok({ user: null });
    }

    return ok({
      user: {
        id: user.id,
        phone: user.phone,
        isVip: isVipActive(user.vipExpiredAt),
        vipExpiredAt: user.vipExpiredAt ? user.vipExpiredAt.toISOString() : null,
      },
    });
  } catch {
    return fail('AUTH_CHECK_FAILED', '登录状态获取失败', 500);
  }
}
```

- [ ] **Step 3: 更新 payments/wechat/status/route.ts**

写入 `app/api/payments/wechat/status/route.ts`：

```typescript
import { fail, ok } from '@/lib/api/response';
import { getSessionUserId } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return fail('AUTH_REQUIRED', '请先登录', 401);
    }

    const { searchParams } = new URL(request.url);
    const orderNo = searchParams.get('orderNo')?.trim() || '';

    if (!orderNo) {
      return fail('INVALID_PARAMS', '缺少订单号', 400);
    }

    const order = await prisma.order.findFirst({
      where: { orderNo, userId },
      select: { orderNo: true, status: true },
    });

    if (!order) {
      return fail('ORDER_NOT_FOUND', '订单不存在', 404);
    }

    return ok({
      orderNo: order.orderNo,
      status: order.status,
    });
  } catch {
    return fail('WECHAT_ORDER_STATUS_FAILED', '查询订单状态失败', 500);
  }
}
```

- [ ] **Step 4: 提交所有 service 和 route 变更**

```bash
git add src/lib/ app/api/auth/login/route.ts app/api/auth/me/route.ts app/api/payments/wechat/status/route.ts
git commit -m "feat: migrate all DB queries to Prisma Client"
```

---

## Task 11: 创建 seed.ts

**Files:**
- Create: `prisma/seed.ts`

- [ ] **Step 1: 写入 seed.ts**

写入 `prisma/seed.ts`：

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.membershipPlan.upsert({
    where: { code: '30d' },
    create: {
      id: '00000000-0000-0000-0000-000000000030',
      code: '30d',
      name: '30天会员',
      durationDays: 30,
      priceCents: 2990,
      enabled: true,
      sortOrder: 1,
      description: '30天会员套餐',
    },
    update: {
      name: '30天会员',
      durationDays: 30,
      priceCents: 2990,
      enabled: true,
      sortOrder: 1,
      description: '30天会员套餐',
    },
  });

  await prisma.membershipPlan.upsert({
    where: { code: '365d' },
    create: {
      id: '00000000-0000-0000-0000-000000000365',
      code: '365d',
      name: '365天会员',
      durationDays: 365,
      priceCents: 19900,
      enabled: true,
      sortOrder: 2,
      description: '365天会员套餐',
    },
    update: {
      name: '365天会员',
      durationDays: 365,
      priceCents: 19900,
      enabled: true,
      sortOrder: 2,
      description: '365天会员套餐',
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 2: 在 package.json 中添加 seed 配置**

在 `package.json` 的 `"scripts"` 同级添加：

```json
"prisma": {
  "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
}
```

同时在 `devDependencies` 中确认有 `ts-node`（如没有则安装）：

```bash
npm install --save-dev ts-node
```

---

## Task 12: 更新 Dockerfile 和 entrypoint

**Files:**
- Create: `docker-entrypoint.sh`
- Modify: `Dockerfile`

- [ ] **Step 1: 创建 docker-entrypoint.sh**

写入 `docker-entrypoint.sh`：

```bash
#!/bin/sh
set -e
npx prisma migrate deploy
exec node server.js
```

- [ ] **Step 2: 更新 Dockerfile**

将 `Dockerfile` 中的 runner stage 替换为：

```dockerfile
FROM docker.m.daocloud.io/library/node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

FROM docker.m.daocloud.io/library/node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM docker.m.daocloud.io/library/node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

CMD ["sh", "/app/docker-entrypoint.sh"]
```

---

## Task 13: 更新受影响的测试

**Files:**
- Modify: `test/db-schema.test.cjs`
- Modify: `test/api-contract.test.cjs`
- Modify: `test/server-drama.test.cjs`
- Modify: `test/server-auth.test.cjs`

- [ ] **Step 1: 更新 db-schema.test.cjs**

写入 `test/db-schema.test.cjs`：

```javascript
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
  assert.match(schema, /phone.*@unique/s);
  assert.match(schema, /uk_orders_order_no/);
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
```

- [ ] **Step 2: 更新 api-contract.test.cjs 中 DATABASE_URL 检查**

将 `test/api-contract.test.cjs` 中的环境变量校验 test 替换为：

```javascript
test('environment config validates server-only variables centrally', () => {
  const source = read('src/lib/config/env.ts');
  for (const key of [
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

- [ ] **Step 3: 更新 server-drama.test.cjs**

将 `test/server-drama.test.cjs` 中第一个 test 替换为：

```javascript
test('drama service exposes play url authorization flow', () => {
  const source = read('src/lib/drama/drama-service.ts');

  assert.match(source, /getEpisodePlayUrl/);
  assert.match(source, /accessLevel/);
  assert.match(source, /vipExpiredAt/);
  assert.match(source, /signOssPath/);
});
```

- [ ] **Step 4: 更新 server-auth.test.cjs**

将 `test/server-auth.test.cjs` 中 sms-code test 的 `consumed_at` 替换为 `consumedAt`：

```javascript
test('sms code helper stores hashed codes with expiration and consumption tracking', () => {
  const source = read('src/lib/auth/sms-code.ts');

  assert.match(source, /bcrypt/);
  assert.match(source, /expiresAt/);
  assert.match(source, /consumedAt/);
});
```

- [ ] **Step 5: 运行测试**

```bash
npm test
```

Expected: 所有测试通过，无失败。

- [ ] **Step 6: 提交所有剩余变更**

```bash
git add test/ prisma/seed.ts docker-entrypoint.sh Dockerfile package.json src/lib/config/env.ts
git commit -m "feat: add seed, entrypoint, update tests for Prisma migration"
```

---

## Task 14: 删除旧文件

**Files:**
- Delete: `src/lib/db/client.ts`
- Delete: `src/lib/db/schema.sql`
- Delete: `src/lib/db/seed.sql`

- [ ] **Step 1: 删除旧 DB 文件**

```bash
rm /Users/yuanjiawei/ai-coding/fzzs/official_website/src/lib/db/client.ts
rm /Users/yuanjiawei/ai-coding/fzzs/official_website/src/lib/db/schema.sql
rm /Users/yuanjiawei/ai-coding/fzzs/official_website/src/lib/db/seed.sql
```

- [ ] **Step 2: 验证没有文件还在引用旧 client**

```bash
grep -r "from '@/lib/db/client'" /Users/yuanjiawei/ai-coding/fzzs/official_website/src /Users/yuanjiawei/ai-coding/fzzs/official_website/app 2>/dev/null
```

Expected: 无输出（无任何文件仍引用旧 client）。

- [ ] **Step 3: 运行测试确认无回归**

```bash
npm test
```

Expected: 所有测试通过。

- [ ] **Step 4: 最终提交**

```bash
git add -u src/lib/db/
git commit -m "chore: remove legacy mysql2 db client and sql files"
```
