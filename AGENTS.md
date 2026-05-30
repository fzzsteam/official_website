# Codex 项目指令

## 语言

- 与用户对话默认使用中文。
- 计划、说明、需求分析、技术方案、测试记录、交付总结等文档默认使用中文。
- 代码标识符、命令、日志、错误信息、协议字段、提交信息和第三方 API 原文按原样保留；必要时用中文解释。

## 项目方向

- 当前项目将从 `Vite + React + TypeScript` 重构为 `Next.js App Router + TypeScript` 单体应用。
- 保留现有页面视觉和组件体验，优先迁移路由、数据获取和后端能力，不重新设计 UI。
- 后端能力包括手机号验证码登录、会员、微信 Native 支付、MySQL 数据持久化、OSS private 资源鉴权和 SAE 部署。

## 数据库规范

- 所有业务表主键统一使用 UUID 字符串，字段名为 `id`。
- 所有业务表必须包含 `created_at` 和 `updated_at`。
- 时间字段统一使用 UTC 存储，接口返回 ISO 8601 字符串。
- 金额统一使用整数分，字段名使用 `*_cents`，禁止用浮点数存金额。
- OSS 资源字段只存 path，字段名使用 `*_path`，禁止存签名 URL 或公开 URL。
- 状态字段使用小写枚举字符串，例如 `pending`、`paid`、`closed`。
- 外键字段使用 `{entity}_id` 命名，例如 `user_id`、`drama_id`、`plan_id`。
- 数据库字段使用 `snake_case`；TypeScript 对象使用 `camelCase`，由数据访问层转换。
- 手机号、订单号、会员套餐 code 等业务唯一字段必须加唯一约束。

## 代码规范

- 全项目使用 TypeScript，禁止新增 JavaScript 业务文件。
- React 组件文件使用 `PascalCase.tsx`。
- 普通工具和服务文件使用 `kebab-case.ts` 或遵循同一目录既有约定。
- 服务端业务逻辑放在 `src/lib/**`，API route 只负责解析请求、调用服务、返回响应。
- 服务端模块按领域拆分：`auth`、`sms`、`payment`、`oss`、`membership`、`drama`、`db`。
- 不在 React 组件里直接拼接复杂业务 API 细节；复杂请求封装到客户端 API helper。
- 环境变量通过集中配置模块读取和校验，业务代码不直接散落读取 `process.env`。
- 服务端密钥只允许在 server-only 模块读取，不允许使用 `NEXT_PUBLIC_` 前缀。
- API 入参必须做服务端校验；前端校验只作为交互优化。

## API 返回规范

成功返回：

```json
{
  "data": {}
}
```

错误返回：

```json
{
  "error": {
    "code": "AUTH_REQUIRED",
    "message": "请先登录"
  }
}
```

## 安全规范

- 日志中禁止输出短信验证码、Cookie、微信支付密钥、OSS AccessKey、签名 URL 全量内容。
- 会员、支付、播放鉴权必须以服务端数据库状态为准，不能信任前端状态。
- 微信支付回调必须验签并做幂等处理。
- OSS private 资源必须由服务端按权限生成短时签名 URL。

## 响应式布局规范

- 断点约定：移动端 `< 768px`（默认），桌面端 `≥ 1024px`（`lg:` 前缀）。
- 所有布局属性（flex、grid、padding、width、display、响应式可见性）使用 Tailwind 类；装饰样式（复杂渐变、box-shadow）保留内联 style。
- 移动端优先：先写移动端样式，再用 `md:` / `lg:` 叠加桌面端覆盖。
- 视频播放器使用 `aspect-[9/16]`（竖屏 9:16），不使用 16:9。
- 导航栏：桌面显示导航链接（`hidden md:flex`），移动端显示汉堡菜单（`md:hidden`）+ 抽屉。
- 模态框：使用 `w-full max-w-[Xpx] mx-4 md:mx-0`，移动端两侧留 16px 间距。
- 剧集详情页：移动端单列（`flex-col`），桌面端左视频（`lg:max-w-[400px]`）+ 右侧边栏（`lg:flex`）。
- EpisodeSelector：桌面使用 `variant="sidebar"`（336px 面板），移动端使用 `variant="inline"`（8 列网格）。
- 首页 Hero：移动端内容从 `left-4 right-4 bottom-14` 定位，桌面端从 `lg:left-[72px] lg:bottom-[120px]`；箭头按钮 `hidden lg:flex`；描述文字 `line-clamp-2 lg:line-clamp-none`。
- InnerPage（关于/业务/联系）：内容区 `px-4 md:px-[60px]`，最大宽 `max-w-[860px] mx-auto`。

## 测试规范

- 新增共享逻辑必须有单元测试。
- 支付回调、会员有效期、验证码校验必须覆盖边界场景。
- 涉及页面迁移时必须保留关键文案和核心交互的回归测试。
- 完成实现前至少运行 `npm test` 和 `npm run build`。
