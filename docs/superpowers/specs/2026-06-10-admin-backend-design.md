# 后台管理功能设计

日期：2026-06-10

## 背景

当前项目已迁移为 `Next.js App Router + TypeScript + Prisma + MariaDB` 单体应用，已有前台会员用户、手机号验证码登录、会员支付、OSS 签名播放和剧集展示接口。

本次新增后台能力，不改造现有前台会员体系。后台用于管理员和机构管理机构资料、剧集内容、分集视频和发布审核。

## 目标

- 新增独立后台账号体系，包含管理员和机构两个角色。
- 支持机构自行注册，管理员审核后启用。
- 支持管理员直接创建机构账号。
- 支持机构上传剧集和分集视频，管理员审核通过后发布到客户端。
- 支持管理员和机构进行剧集管理，包括基本信息编辑、封面/海报/预告片、分集视频管理。
- 初始化时创建默认管理员账号，现有剧集归属到默认管理员名下。

## 非目标

- 一期不做复杂 RBAC 权限系统。
- 一期不做分集级审核，审核粒度为整部剧。
- 一期不做内容版本对比、审核批注、素材库和复杂工作流。
- 一期不拆独立后台前端项目，继续使用当前 Next.js 单体应用。

## 方案选择

采用“独立后台账号 + 机构实体 + 整剧审核流”的方案。

备选方案包括复用前台 `User` 表或直接建设重型 CMS。复用前台用户会混淆会员和后台账号的权限、安全策略和生命周期；重型 CMS 会引入版本表、分集审核和素材库，超出一期范围。独立后台账号方案能保持边界清晰，并为后续扩展操作日志、细分权限和分集审核预留空间。

## 架构

后台位于同一应用的 `/admin` 区域：

- `/admin/login`：后台登录。
- `/admin/register`：机构自注册。
- `/admin`：后台首页和数据概览。
- `/admin/organizations`：机构列表、详情和审核。
- `/admin/dramas`：剧集列表和管理。
- `/admin/dramas/[id]`：剧集基本信息、演员、题材、素材和提交审核。
- `/admin/dramas/[id]/episodes`：分集列表和视频管理。

后台 API 放在 `app/api/admin/**`。服务端业务逻辑按领域放在：

- `src/lib/admin-auth/**`：后台登录、session、鉴权。
- `src/lib/admin/**`：机构、剧集和审核业务。
- `src/lib/admin-upload/**`：OSS 上传授权和 path 校验。

API route 只负责解析请求、调用服务、返回响应。成功和错误返回继续遵守现有 API 规范：

```json
{ "data": {} }
```

```json
{ "error": { "code": "AUTH_REQUIRED", "message": "请先登录" } }
```

## 账号与权限

前台会员继续使用现有 `users` 表和 `fzzs_session`。后台新增独立 session，例如 `fzzs_admin_session`，避免前后台登录态互相影响。

后台账号使用手机号 + 密码登录，密码只保存哈希。后台账号角色：

- `admin`：管理全量机构、全量剧集，审核机构和剧集，可创建机构账号。
- `organization`：管理自身机构资料和自身剧集，不能访问其他机构数据，不能直接发布到客户端。

后台账号状态：

- `pending`：待审核或待启用。
- `active`：可正常使用。
- `disabled`：已禁用，禁止登录。

机构自注册后，机构账号为待审核状态。待审核机构账号允许登录后台查看审核状态和修改注册资料，但不能创建或提交剧集。管理员审核通过后账号变为可用。管理员创建机构账号时，一期默认可直接创建为已通过状态，同时保留审核字段用于审计。

## 数据模型

新增 `admin_users`：

- `id`：UUID 字符串主键。
- `phone`：后台登录手机号，唯一。
- `password_hash`：密码哈希。
- `role`：`admin` 或 `organization`。
- `display_name`：显示名。
- `organization_id`：机构账号绑定的机构 ID，管理员为空。
- `status`：`pending`、`active`、`disabled`。
- `last_login_at`：最后登录时间。
- `created_at`、`updated_at`：UTC 时间。

新增 `organizations`：

- `id`：UUID 字符串主键。
- `name`：机构名称。
- `contact_name`：联系人。
- `contact_phone`：联系人手机号。
- `email`：联系邮箱。
- `credit_code`：统一社会信用代码，唯一。
- `address`：机构地址。
- `description`：机构简介。
- `business_license_path`：营业执照 OSS path。
- `status`：`pending`、`approved`、`rejected`、`disabled`。
- `reviewed_by_admin_user_id`：审核管理员。
- `reviewed_at`：审核时间。
- `reject_reason`：驳回原因。
- `created_at`、`updated_at`：UTC 时间。

扩展 `dramas`：

- `owner_type`：`admin` 或 `organization`。
- `owner_admin_user_id`：管理员归属 ID。
- `organization_id`：机构归属 ID。
- `review_status`：`draft`、`submitted`、`approved`、`rejected`。
- `submitted_at`：提交审核时间。
- `reviewed_by_admin_user_id`：审核管理员。
- `reviewed_at`：审核时间。
- `review_reject_reason`：剧集驳回原因。

现有剧集在迁移或 seed 时归属到默认管理员。客户端仍以 `dramas.status = 'published'` 作为可见条件。

## 核心流程

### 机构自注册

机构填写名称、联系人、手机号、密码、邮箱、统一社会信用代码、地址、简介和营业执照。营业执照通过后台上传授权直传 OSS，服务端只保存 `business_license_path`。

注册成功后创建 `organizations` 和对应 `admin_users`，状态为待审核。待审核机构可以登录后台查看审核状态和修改资料，但不能发布剧集。

### 管理员审核机构

管理员在机构列表查看待审核机构。审核通过后：

- `organizations.status = 'approved'`
- 机构后台账号 `status = 'active'`
- 写入审核人和审核时间

审核驳回后：

- `organizations.status = 'rejected'`
- 写入驳回原因
- 机构可修改资料后重新提交

### 管理员创建机构账号

管理员录入机构资料和联系人手机号，系统创建机构与机构账号。一期默认创建为已审核和可登录状态。后续如果需要更严格流程，可以切换为待审核状态。

### 剧集管理与审核

机构创建剧集草稿并维护基本信息、题材、演员、封面、海报、预告片和分集视频。提交审核后，剧集进入 `submitted` 状态，机构不能继续编辑正在审核的内容。

管理员审核通过后：

- `dramas.review_status = 'approved'`
- `dramas.status = 'published'`
- `dramas.published_at = now`
- 已发布分集按现有 `episodes.status = 'published'` 规则对前台可见

管理员驳回后：

- `dramas.review_status = 'rejected'`
- `dramas.status` 保持不可见状态
- 写入驳回原因
- 机构可修改后再次提交

管理员自己创建的剧集归属为 `owner_type = 'admin'`，可以直接发布，也可以复用同一审核字段一键通过。

## 上传与 OSS 安全

视频和图片上传采用浏览器直传 OSS。后台先向服务端申请上传授权，服务端根据当前后台账号生成限定前缀：

- 管理员内容：`admin/{adminUserId}/...`
- 机构内容：`organizations/{organizationId}/...`

前端直传完成后，把 OSS path 提交给业务接口。服务端保存 path 前必须校验：

- 当前用户是否有该资源的写权限。
- path 是否位于当前账号允许的前缀下。
- path 字段只保存路径，不保存签名 URL 或公开 URL。

服务端不得在日志中输出签名 URL、OSS AccessKey 或完整上传凭证。

## UI 设计

后台 UI 采用 `shadcn/ui` 风格的组件体系，基于 Tailwind CSS 和当前项目已有主题色定制。主色继续使用现有 `brand.bg`、`brand.card`、`brand.gold`、`brand.amber`，保持与客户端一致。

后台布局不做营销式设计，采用管理台结构：

- 左侧导航。
- 顶部账号和状态区域。
- 表格列表。
- 表单编辑页。
- 状态标签。
- 确认弹窗。
- 审核操作区。

页面组件优先使用现有字体和 Tailwind 断点规范。后台可以比前台更克制、更密集，但不引入与当前客户端主题冲突的色系。

## 错误处理

后台 API 使用明确错误码：

- `ADMIN_AUTH_REQUIRED`：后台未登录。
- `ADMIN_FORBIDDEN`：角色或资源归属不允许。
- `ADMIN_INVALID_CREDENTIALS`：手机号或密码错误。
- `ORGANIZATION_PENDING_REVIEW`：机构尚未审核通过。
- `ORGANIZATION_REJECTED`：机构审核被驳回。
- `DRAMA_NOT_EDITABLE`：剧集当前状态不可编辑。
- `DRAMA_REVIEW_REQUIRED`：剧集需要审核后发布。
- `INVALID_UPLOAD_PATH`：OSS path 不在授权前缀下。

所有后台写操作都在服务端校验角色、状态和资源归属。前端校验只用于交互提示。

## 测试范围

新增或扩展测试覆盖：

- 默认管理员 seed 创建成功。
- 现有剧集归属到默认管理员。
- 后台手机号密码登录成功和失败。
- 禁用后台账号不能登录。
- 机构自注册后为待审核状态。
- 管理员通过或驳回机构审核。
- 待审核机构不能提交剧集发布。
- 机构只能读取和修改自己的剧集。
- 机构不能通过猜 ID 修改其他机构剧集。
- 剧集审核通过后客户端可见。
- 剧集驳回后客户端不可见。
- OSS path 前缀校验拒绝越权 path。

完成实现前运行：

```bash
npm test
npm run build
```

## 实施顺序建议

1. 数据库迁移和 seed 默认管理员。
2. 后台 session、登录和鉴权中间层。
3. 机构注册、机构审核和管理员创建机构账号。
4. OSS 上传授权和 path 校验。
5. 剧集后台管理和整剧审核流。
6. 后台页面和交互接入。
7. 测试补齐和构建验证。
