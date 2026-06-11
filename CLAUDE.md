# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

`方直智胜` 短剧会员官网，技术栈为 `Next.js 14 (App Router) + TypeScript + Prisma + MariaDB`。项目正在从 `Vite + React + TypeScript` 单页应用迁移为 Next.js 单体应用，迁移过程中保留原有页面视觉和组件，优先迁移路由、数据获取和后端能力（手机号验证码登录、会员、微信 Native 支付、OSS 私有资源鉴权、SAE 部署）。

## 常用命令

```bash
npm install && npx prisma generate   # 安装依赖并生成 Prisma Client
npm run dev                          # 启动开发服务（http://localhost:3000）
npm run build                        # 生产构建
npm test                             # 运行 test/*.test.cjs（node:test，纯静态/源码断言，无需数据库或服务器）
node --test test/admin-drama.test.cjs  # 运行单个测试文件
npx prisma migrate deploy            # 应用 prisma/migrations/ 中的迁移
npx tsx prisma/seed.ts               # 写入种子数据（幂等 upsert）
npx prisma studio                    # 数据库可视化
```

完成实现前至少运行 `npm test` 和 `npm run build`。`test/` 下的用例大多是读取源码文件并用正则断言关键标识符/导入是否存在的"规约测试"，不连接数据库、不启动服务，新增共享逻辑或迁移页面时记得同步补充这类断言。

## 架构总览

### 双层路由：Next.js App Router 包裹遗留 React SPA

- `app/` 是 Next.js App Router 入口：页面路由（`app/page.tsx`、`app/drama/[id]/page.tsx`、`app/admin/**`）和所有 API 路由（`app/api/**`）。
- 前台页面（首页、剧集详情、关于/业务/联系）通过 `src/app/AppShell.tsx`（client component）整体渲染 `src/App.tsx`，内部用 `AppContext`（`src/context/AppContext.tsx`）做客户端路由/弹窗状态管理（`page`/`modal`/`selectedDrama`），不是 Next.js 路由跳转。新增前台页面优先在 `src/components/pages/` 和 `src/App.tsx` 中接入，而不是新建 `app/` 路由。
- `app/admin/**` 是真正的 Next.js 路由（独立的后台管理系统），布局为 `src/components/admin/AdminLayout.tsx` + `AdminSidebar`/`AdminToast`。

### 服务端分层

- API route（`app/api/**/route.ts`）只负责解析请求、校验、调用 `src/lib/**` 服务、用 `src/lib/api/response.ts` 的 `ok()` / `fail()` 返回统一格式：成功 `{ data }`，失败 `{ error: { code, message } }`。
- `src/lib/**` 按领域拆分服务模块，均标记 `import 'server-only'`：
  - `auth/`、`admin-auth/`：用户/后台两套独立的 JWT session（`jose` 签发，cookie 名分别为 `fzzs_session` / `fzzs_admin_session`，密钥来自 `COOKIE_SECRET`）
  - `admin/`：后台业务服务（剧集、机构、媒体 URL 签名等），`admin-ui/`、`admin-upload/` 为后台前端配套
  - `drama/`、`membership/`、`payment/`（微信支付）、`sms/`（阿里云短信）、`oss/`（阿里云 OSS）
  - `db/prisma.ts`：Prisma Client + MariaDB adapter 单例
  - `config/env.ts`：用 zod 集中校验所有环境变量，业务代码不要直接读 `process.env`
- 前端统一通过 `src/lib/api/client.ts` 的 `apiGet`/`apiPost` 调用接口（自动处理 `{data}`/`{error}` 包装并抛出带 `code`/`status` 的 `ApiError`）。

### 权限与审核模型

- 后台账号 `AdminUser.role` 分两种：`admin`（系统管理员，全局权限）和 `organization`（剧集制作机构账号，归属某个 `Organization`）。`requireAdminRole` / `requireOrganizationRole` / `requireAdminSession`（`src/lib/admin-auth/require-admin.ts`）做路由级鉴权。
- `Organization.status` 需经管理员审核（`pending` -> `approved`/`rejected`），`assertApprovedOrganization` 检查机构是否已通过审核才能提交剧集。
- `Drama` 有两套独立状态：`status`（草稿等内容状态）和 `reviewStatus`（`draft -> submitted -> approved/rejected`，机构提交后由管理员审核）、`releaseStatus`（`upcoming`/`released`，是否对外上线）。机构账号只能操作 `organizationId` 归属自己的剧集（见 `src/lib/admin/drama-admin-service.ts` 的 `getDramaOwnershipWhere`）。

### OSS 私有资源

数据库只存对象路径（字段名 `*_path`，如 `coverPath`/`videoPath`），从不存签名 URL。读取时由服务端按权限通过 `signOssPath`（`src/lib/oss/oss-service.ts`）/`signAdminMediaPath`（`src/lib/admin/media-url.ts`）生成短时签名 URL，再以 `*Url` 字段返回给前端。

### 数据库（Prisma + MariaDB）

- 所有业务表主键为 `id Char(36)`（UUID 字符串），均含 `created_at`/`updated_at`；DB 字段 `snake_case`，通过 `@map` 映射为 Prisma/TS 的 `camelCase`。
- 金额字段为整数分（`*_cents`），状态字段为小写枚举字符串（如 `pending`/`paid`/`active`），外键命名 `{entity}_id`。
- 迁移文件在 `prisma/migrations/`，新增迁移用标准 Prisma 流程；线上容器启动时 `docker-entrypoint.sh` 自动执行 `migrate deploy`，一般无需手动迁移。`prisma.config.ts` 会自动加载 `.env.local`/`.env`。

### 部署

- `Dockerfile` 多阶段构建，`next.config.mjs` 设置 `output: 'standalone'`。GitHub Actions（`.github/workflows/docker.yml`）push 到 `master` 时构建镜像推送到阿里云 ACR 并部署到 SAE。线上 secrets/环境变量统一在 SAE 应用侧配置，不写入仓库或 workflow 文件。

## 代码规范要点（详见 AGENTS.md）

- 全项目 TypeScript；React 组件 `PascalCase.tsx`，工具/服务文件 `kebab-case.ts`。
- 服务端密钥只能在 server-only 模块读取，禁止 `NEXT_PUBLIC_` 前缀暴露。API 入参必须服务端校验（zod）。
- 日志中禁止输出验证码、Cookie、微信支付密钥、OSS AccessKey、签名 URL 全量内容。会员/支付/播放鉴权以服务端数据库状态为准。微信支付回调必须验签且幂等。
- 响应式布局：移动端 `<768px`（默认）、桌面端 `≥1024px`（`lg:`），移动端优先；视频播放器使用 `aspect-[9/16]`。

## 历史设计文档

`docs/superpowers/specs/` 和 `docs/superpowers/plans/` 保存了各阶段功能（Next.js 迁移、Prisma 迁移、剧集数据管线、响应式布局、后台管理系统）的设计方案与实施计划，理解某个模块历史决策时可参考对应日期的文档。
