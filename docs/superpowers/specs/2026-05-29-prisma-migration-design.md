# Prisma 迁移设计

**日期：** 2026-05-29  
**状态：** 已审批

## 目标

将现有 `mysql2` 原始 SQL 查询完整迁移至 Prisma Client，同时建立容器启动时自动执行数据库迁移的机制。

---

## 范围

### 新增

| 文件 | 说明 |
|------|------|
| `prisma/schema.prisma` | 9 张表的 schema，取代 `src/lib/db/schema.sql` |
| `prisma/seed.ts` | 初始数据脚本，取代 `src/lib/db/seed.sql` |
| `prisma/migrations/0001_init/migration.sql` | 基线迁移，内容与现有 `schema.sql` 一致 |
| `src/lib/db/prisma.ts` | PrismaClient 单例，取代 `src/lib/db/client.ts` |
| `docker-entrypoint.sh` | 容器启动入口：先 migrate deploy，再启动 Next.js |

### 修改

| 文件 | 变更说明 |
|------|----------|
| `src/lib/auth/sms-code.ts` | `query()` → Prisma Client API |
| `src/lib/drama/drama-service.ts` | `query()` → Prisma Client API，`total_episodes` 改用 `_count` |
| `src/lib/membership/membership-service.ts` | `query()` → Prisma Client API |
| `src/lib/payment/wechat-service.ts` | 事务改用 `prisma.$transaction()`，`FOR UPDATE` 用 `tx.$queryRaw` |
| `app/api/auth/login/route.ts` | `query()` → Prisma Client API |
| `app/api/auth/me/route.ts` | `query()` → Prisma Client API |
| `app/api/payments/wechat/status/route.ts` | `query()` → Prisma Client API |
| `Dockerfile` | CMD 改为调用 `docker-entrypoint.sh` |
| `package.json` | 添加 Prisma 依赖，移除 `mysql2` |
| `src/lib/config/env.ts` | 移除 `DATABASE_URL` 校验（Prisma 自行读取） |

### 删除

- `src/lib/db/client.ts`
- `src/lib/db/schema.sql`
- `src/lib/db/seed.sql`

---

## Prisma Schema 设计

所有表的字段类型映射规则：

| SQL 类型 | Prisma 类型 |
|----------|-------------|
| `CHAR(36) PRIMARY KEY` | `String @id @db.Char(36)` |
| `VARCHAR(n)` | `String @db.VarChar(n)` |
| `TEXT` | `String @db.Text` |
| `TINYINT(1)` | `Boolean @db.TinyInt(1)` |
| `INT` | `Int` |
| `DATETIME(3)` | `DateTime @db.DateTime(3)` |
| `JSON` | `Json` |

主键均为手动传入的 UUID 字符串（`randomUUID()`），schema 中标注 `@default(uuid())` 仅作文档说明，不影响应用行为。

关系字段（外键）定义完整，支持 `include` 关联查询。

---

## PrismaClient 单例

```typescript
// src/lib/db/prisma.ts
import 'server-only';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({ log: process.env.NODE_ENV === 'development' ? ['query'] : [] });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

开发环境开启 query log，生产环境关闭。

---

## 查询迁移策略

### 普通查询

直接替换为 Prisma Client API：

```typescript
// 旧
const rows = await query<UserRow>('SELECT ... WHERE id = :id', { id });
const user = rows[0];

// 新
const user = await prisma.user.findUnique({ where: { id } });
```

### total_episodes 子查询

旧代码使用相关子查询计数，改用 Prisma `_count` include：

```typescript
prisma.drama.findMany({
  include: { _count: { select: { episodes: { where: { status: 'published' } } } } }
})
```

映射时取 `drama._count.episodes` 作为 `totalEpisodes`。

### getDramaDetail 多表并行查询

保持 `Promise.all` 并行结构，各子查询改为 Prisma API：

```typescript
const [genres, cast, episodes, recommendations] = await Promise.all([
  prisma.dramaGenre.findMany({ where: { dramaId } }),
  prisma.castMember.findMany({ where: { dramaId }, orderBy: [...] }),
  prisma.episode.findMany({ where: { dramaId, status: 'published' }, orderBy: [...] }),
  prisma.recommendation.findMany({ where: { enabled: true, ... }, include: { drama: true } }),
]);
```

### 支付事务（wechat-service.ts）

使用交互式事务，`SELECT ... FOR UPDATE` 保留为原始 SQL：

```typescript
await prisma.$transaction(async (tx) => {
  // FOR UPDATE 需要原始 SQL
  const orders = await tx.$queryRaw<OrderRow[]>`
    SELECT o.*, mp.duration_days, u.vip_expired_at
    FROM orders o
    LEFT JOIN membership_plans mp ON mp.id = o.membership_plan_id
    LEFT JOIN users u ON u.id = o.user_id
    WHERE o.order_no = ${orderNo}
    LIMIT 1
    FOR UPDATE
  `;

  // 其余操作使用 Prisma API
  await tx.wechatPaymentNotification.upsert({ ... });
  await tx.order.update({ ... });
  await tx.user.update({ ... });
});
```

---

## 容器启动迁移

### docker-entrypoint.sh

```bash
#!/bin/sh
set -e
npx prisma migrate deploy
exec node server.js
```

### Dockerfile 修改

```dockerfile
# 在 runner stage 中添加 prisma schema
COPY --from=builder /app/prisma ./prisma
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh

CMD ["sh", "/app/docker-entrypoint.sh"]
```

### 多实例并发安全

`prisma migrate deploy` 使用 `_prisma_migrations` 表的行级锁保证幂等性。SAE 多个实例同时启动时，只有一个实例会执行实际迁移，其余实例等待后检测到已应用则跳过。无需额外锁机制。

---

## 种子数据

`prisma/seed.ts` 使用 `upsert` 确保幂等，与原 `seed.sql` 的 `ON DUPLICATE KEY UPDATE` 语义一致：

```typescript
await prisma.membershipPlan.upsert({
  where: { code: '30d' },
  create: { id: '00000000-0000-0000-0000-000000000030', code: '30d', ... },
  update: { name: '30天会员', priceCents: 2990, ... },
});
```

`package.json` 中配置：
```json
"prisma": { "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts" }
```

---

## 环境变量

`DATABASE_URL` 格式不变，Prisma 直接读取 `process.env.DATABASE_URL`。  
`src/lib/config/env.ts` 中移除 `DATABASE_URL` 字段，由 Prisma 自行校验。

---

## 基线迁移处理

现有生产数据库已存在所有表，初次部署时：

1. `prisma migrate deploy` 发现 `_prisma_migrations` 表不存在，自动创建
2. 检测到 `0001_init` 迁移未应用，执行 `migration.sql`（内容与 `schema.sql` 相同）
3. 若表已存在（生产环境初次迁移），`migration.sql` 使用 `CREATE TABLE IF NOT EXISTS` 避免报错

**注意：** `schema.sql` 中原有的 `CREATE TABLE` 需改为 `CREATE TABLE IF NOT EXISTS`，写入 `migration.sql`。

---

## 不在范围内

- 管理后台 / CMS 功能
- Prisma Studio 配置
- 查询性能优化
- 数据库连接池调优（保持 Prisma 默认值）
