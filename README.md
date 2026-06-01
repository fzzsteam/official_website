## 项目说明

这是一个基于 `Next.js 14 + TypeScript + Prisma + MariaDB` 的官网项目。

主要目录：

- `src/`：React 页面、组件、Server Actions 和类型
- `app/`：Next.js App Router 路由
- `prisma/`：数据库 schema、迁移文件和种子数据
- `test/`：路由与接口测试

## 本地部署

### 前置条件

- Node.js 20+
- MariaDB 或 MySQL（本地运行或 Docker）
- npm

### 1. 安装依赖

```bash
npm install
npx prisma generate
```

### 2. 创建数据库

在本地 MariaDB / MySQL 中创建数据库：

```sql
CREATE DATABASE fzzs CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. 配置环境变量

复制模板文件：

```bash
cp .env.local.example .env.local
```

生成 `COOKIE_SECRET` 并填入 `.env.local`：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

然后打开 `.env.local` 填写其余变量（数据库、阿里云、微信支付等）。

> 本地开发若不使用短信/OSS/微信支付，对应变量留空即可，不影响页面渲染，仅调用相关接口时会报错。

### 4. 执行数据库迁移

```bash
npx prisma migrate deploy
```

应用 `prisma/migrations/` 中的迁移文件在本地数据库建表。

### 5. 写入种子数据（首次）

```bash
npx tsx prisma/seed.ts
```

写入剧集、会员套餐等初始数据。后续重复执行是幂等的（upsert），不会重复插入。

### 6. 启动开发服务

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)。

---

## 其他命令

Prisma Studio（数据库可视化）：

```bash
npx prisma studio
```

---

## 部署说明

GitHub Actions / SAE 部署需要在仓库 Secrets 中配置：

- `ACR_REGISTRY`
- `ACR_USERNAME`
- `ACR_PASSWORD`
- `ACR_IMAGE`
- `ALIYUN_ACCESS_KEY_ID`
- `ALIYUN_ACCESS_KEY_SECRET`
- `SAE_REGION_ID`
- `SAE_APP_ID`

业务运行时 secrets 和环境变量统一配置在 SAE 应用侧，不提交到仓库，也不要写入 workflow 文件。
