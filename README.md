# 方直智胜官网

## 项目说明

这是一个基于 `Vite + React + TypeScript` 的官网项目。

主要目录：

- `index.html`：Vite HTML 入口
- `src/`：React 页面、组件、状态和类型
- `test/`：React 页面迁移与路由测试

## 本地运行

安装依赖：

```bash
npm install
```

启动开发服务：

```bash
npm run dev
```

运行前需要配置以下环境变量：

- `DATABASE_URL`
- `COOKIE_SECRET`
- `ALIYUN_ACCESS_KEY_ID`
- `ALIYUN_ACCESS_KEY_SECRET`
- `ALIYUN_SMS_SIGN_NAME`
- `ALIYUN_SMS_TEMPLATE_CODE`
- `OSS_REGION`
- `OSS_BUCKET`
- `OSS_ACCESS_KEY_ID`
- `OSS_ACCESS_KEY_SECRET`
- `OSS_SIGNED_URL_EXPIRES_SECONDS`
- `WECHAT_PAY_APPID`
- `WECHAT_PAY_MCH_ID`
- `WECHAT_PAY_API_V3_KEY`
- `WECHAT_PAY_PRIVATE_KEY`
- `WECHAT_PAY_CERT_SERIAL_NO`
- `WECHAT_PAY_NOTIFY_URL`
- `NEXT_PUBLIC_SITE_URL`

构建生产包：

```bash
npm run build
```

预览生产包：

```bash
npm run preview
```

## 测试

运行测试：

```bash
npm test
```

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
