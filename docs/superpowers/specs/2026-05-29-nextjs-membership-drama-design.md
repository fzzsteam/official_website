# Next.js 会员短剧后端设计

## 背景

当前项目是 `Vite + React + TypeScript` 前端应用，页面、登录弹窗、会员弹窗、支付弹窗、短剧详情和播放器已经完成，但业务逻辑仍是前端模拟。第一期目标是把项目重构为 `Next.js App Router + TypeScript` 单体应用，在保留现有 UI 的基础上补齐用户、会员、微信支付、短剧播放鉴权、OSS 私有资源和 MySQL 数据持久化。

第一期不做后台管理，短剧、剧集、演员、推荐和会员套餐等运营数据直接通过 MySQL 维护。

## 目标

- 手机号 + 短信验证码登录，未注册用户自动注册。
- 阿里云短信服务发送验证码。
- 两档会员：`30天会员` 和 `365天会员`。
- 微信 `Native` 支付开通会员。
- 短剧资源统一由 OSS 管理，bucket 为 private，数据库只存 OSS path。
- 免费剧集游客可看；收费剧集必须登录且会员有效。
- 生成短时 OSS 签名 URL 播放私有视频资源。
- 使用 MySQL 存储用户、会员、订单和短剧数据。
- Docker 部署到阿里云 SAE。
- GitHub Actions 自动构建和部署。
- 短信、微信支付、OSS、MySQL、Cookie 等敏感配置全部使用环境变量。

## 非目标

- 不做后台管理系统。
- 不做多支付渠道。
- 不做自动续费。
- 不做复杂优惠券、活动价、分销或退款流程。
- 不重做现有页面视觉设计。
- 不把 OSS AccessKey 或微信支付密钥暴露到前端。

## 技术方案

采用 `Next.js App Router + TypeScript` 单体应用。

```text
浏览器
  -> Next.js 页面
  -> Next.js API Route
  -> MySQL / 阿里短信 / 微信支付 / OSS
```

代码结构：

```text
app/
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
  components/
  lib/
    db/
    auth/
    sms/
    payment/
    oss/
    membership/
```

现有 `src/components` 尽量保留，只把页面入口、路由、数据获取和状态管理迁移到 Next.js。服务端模块集中放在 `src/lib`，避免 API route 里堆业务逻辑。

## 登录态设计

登录态使用 `HttpOnly + Secure + SameSite=Lax` Cookie。前端不直接保存可信 token，也不把会员状态作为客户端可信状态。

服务端 API 通过 Cookie 解析当前用户，并从 MySQL 查询最新会员状态。收费播放 URL 的生成必须以服务端数据库状态为准。

Cookie 过期时间建议 30 天。用户退出登录时清除 Cookie。

## 数据模型

### 用户与短信

```text
users
  id
  phone
  nickname
  avatar_path
  vip_expired_at
  created_at
  updated_at

sms_codes
  id
  phone
  code_hash
  scene
  expires_at
  consumed_at
  request_ip
  created_at
```

`vip_expired_at > NOW()` 表示会员有效。验证码只存 hash，不存明文。

### 会员与订单

```text
membership_plans
  id
  code
  name
  duration_days
  price_cents
  enabled
  sort_order

orders
  id
  order_no
  user_id
  plan_id
  amount_cents
  status
  payment_channel
  wechat_prepay_id
  code_url
  paid_at
  created_at
  updated_at

wechat_payment_notifications
  id
  order_no
  transaction_id
  raw_payload
  processed_at
  created_at
```

订单状态：`pending`、`paid`、`closed`。一期只支持 `wechat_native`。

会员默认种子数据：

```text
code    name       duration_days    price_cents
30d     30天会员    30               2990
365d    365天会员   365              19900
```

支付成功后，会员有效期计算规则：

- 如果用户不是会员或已过期，从当前时间开始增加套餐天数。
- 如果用户会员未过期，从现有 `vip_expired_at` 往后顺延套餐天数。
- 同一个 `order_no` 的微信回调只能开通一次会员。

### 短剧内容

```text
dramas
  id
  slug
  title
  subtitle
  description
  cover_path
  year
  total_episodes
  episode_duration_minutes
  is_vip
  is_published
  sort_order
  created_at
  updated_at

drama_genres
  id
  drama_id
  genre

episodes
  id
  drama_id
  episode_no
  title
  duration_seconds
  video_path
  poster_path
  is_free
  is_published
  created_at
  updated_at

cast_members
  id
  drama_id
  name
  role
  avatar_path
  character_role
  sort_order

recommendations
  id
  source_drama_id
  target_drama_id
  sort_order
```

播放权限以 `episodes.is_free` 为准：

- `is_free = true`：游客可播放。
- `is_free = false`：必须登录且会员有效。

`dramas.is_vip` 只作为页面展示标签，不作为最终播放鉴权依据。

## API 设计

### 认证

```text
POST /api/auth/send-code
  body: { phone }
  行为：校验手机号、频率限制、生成验证码、hash 入库、调用阿里云短信。

POST /api/auth/login
  body: { phone, code }
  行为：校验验证码；没有用户则自动注册；写入 HttpOnly Cookie；返回用户信息。

POST /api/auth/logout
  行为：清除 Cookie。

GET /api/auth/me
  行为：返回当前登录用户、会员状态。
```

### 会员与支付

```text
GET /api/membership/plans
  返回：30天会员、365天会员、价格、是否推荐、是否启用。

POST /api/payments/wechat/native
  body: { planCode }
  行为：必须登录；按数据库套餐价格创建 pending 订单；调用微信 Native 下单；返回 orderNo 和 codeUrl。

GET /api/payments/wechat/status?orderNo=xxx
  行为：只允许查询当前用户自己的订单；返回订单状态；paid 后前端刷新用户会员状态。

POST /api/payments/wechat/notify
  行为：接收微信支付回调；验签；保存通知；幂等更新订单；开通或顺延会员。
```

### 短剧与播放

```text
GET /api/dramas
  返回：首页短剧列表、VIP 标签、封面签名 URL。

GET /api/dramas/[id]
  返回：短剧详情、演员、剧集、推荐。

GET /api/dramas/[id]/episodes/[episodeNo]/play-url
  行为：判断剧集是否免费；收费剧集检查登录和会员；通过后返回短时 OSS 签名播放 URL。
```

## 前端迁移

- `LoginModal` 从模拟登录改为调用 `send-code` 和 `login`。
- `VipModal` 从硬编码套餐改为请求 `/api/membership/plans`。
- `PaymentModal` 使用微信返回的 `codeUrl` 生成真实二维码，并轮询订单状态。
- `HomePage` 和短剧详情页从 mock 数据改为 API 数据。
- `VideoPlayer` 在选择剧集时请求 `play-url`，不直接持有固定视频 URL。
- 当前 UI 不重新设计，只调整数据来源、加载态、错误态和登录/会员跳转逻辑。

## 安全与错误处理

短信：

- 服务端二次校验手机号。
- 同手机号发送频率限制：60 秒一次、每天最多 10 次。
- 同 IP 频率限制，防止短信接口被刷。
- 验证码有效期 5 分钟。
- 登录成功后写入 `consumed_at`，防止验证码重复使用。
- 阿里云短信失败时返回错误，不创建登录态。

支付：

- 订单号由服务端生成。
- 金额以数据库套餐价格为准，前端价格不可信。
- 微信回调必须验签。
- 回调处理必须幂等，只有 `pending -> paid` 第一次转换时开通会员。
- 订单状态接口只能查询当前用户自己的订单。
- 回调原始数据落库，便于排查账务问题。

OSS：

- 数据库只存 path，例如 `dramas/xue-luo/ep01.mp4`。
- 服务端生成短时签名 URL，建议有效期 5-10 分钟。
- 收费剧集每次请求播放地址都重新校验会员状态。
- 签名 URL 不持久化到数据库。
- OSS AccessKey 不返回前端。

配置：

- 服务端密钥不能使用 `NEXT_PUBLIC_` 前缀。
- 运行时环境变量由 SAE 提供。
- GitHub Actions 只保存部署凭据，业务密钥放 SAE 环境变量。

## 环境变量

```text
DATABASE_URL
COOKIE_SECRET

ALIYUN_ACCESS_KEY_ID
ALIYUN_ACCESS_KEY_SECRET
ALIYUN_SMS_SIGN_NAME
ALIYUN_SMS_TEMPLATE_CODE

OSS_REGION
OSS_BUCKET
OSS_ACCESS_KEY_ID
OSS_ACCESS_KEY_SECRET
OSS_SIGNED_URL_EXPIRES_SECONDS

WECHAT_PAY_APPID
WECHAT_PAY_MCH_ID
WECHAT_PAY_API_V3_KEY
WECHAT_PAY_PRIVATE_KEY
WECHAT_PAY_CERT_SERIAL_NO
WECHAT_PAY_NOTIFY_URL

NEXT_PUBLIC_SITE_URL
```

`NEXT_PUBLIC_SITE_URL` 只放站点公开地址，不放任何密钥。

## 部署设计

Next.js 使用 `standalone` 输出，Docker 镜像只包含运行所需产物。

```text
next.config.js
  output: 'standalone'
```

SAE 运行一个 Next.js Node 服务，监听平台注入的 `PORT`。GitHub Actions 流程：

1. 安装依赖。
2. 运行测试。
3. 构建 Next.js。
4. 构建 Docker 镜像。
5. 推送镜像。
6. 触发 SAE 部署。

## 测试策略

- 单元测试：验证码校验、会员有效期顺延、订单幂等。
- API 测试：登录、发送验证码、下单、支付状态、免费播放、收费播放鉴权。
- 支付回调测试：使用 fixture 覆盖验签和重复通知处理。
- 构建测试：`npm run build`。
- 迁移测试：确保现有页面能在 Next.js 路由下正常渲染。

## 验收标准

- 游客可以浏览首页、详情页和播放免费剧集。
- 收费剧集游客访问播放地址时返回需要登录或开通会员。
- 手机号验证码登录成功后自动注册用户。
- 登录用户可以选择 `30天会员` 或 `365天会员` 发起微信 Native 支付。
- 支付成功回调后订单变为 `paid`，用户会员有效期正确开通或顺延。
- 会员用户可以获取收费剧集的 OSS 短时签名播放 URL。
- 所有业务密钥只通过服务端环境变量读取。
- 应用可通过 Docker 在 SAE 以一个服务运行。
