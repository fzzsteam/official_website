# 上线部署文档

## 一、准备环境变量

在 SAE 控制台配置以下环境变量（对应本地 `.env.local`）。

### 数据库

| 变量名 | 说明 |
|--------|------|
| `DATABASE_URL` | MySQL 连接串，格式：`mysql://user:password@host:3306/dbname` |

### 阿里云基础服务

| 变量名 | 说明 |
|--------|------|
| `ALIYUN_ACCESS_KEY_ID` | 阿里云 AccessKey ID |
| `ALIYUN_ACCESS_KEY_SECRET` | 阿里云 AccessKey Secret |

### 短信服务（阿里云 SMS）

| 变量名 | 说明 |
|--------|------|
| `ALIYUN_SMS_SIGN_NAME` | 短信签名名称 |
| `ALIYUN_SMS_TEMPLATE_CODE` | 短信模板 CODE |

### OSS 对象存储

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `OSS_REGION` | OSS 地域 | `oss-cn-shenzhen` |
| `OSS_BUCKET` | Bucket 名称 | `fzzs-official-website` |
| `OSS_ACCESS_KEY_ID` | OSS AccessKey ID（可与阿里云主 AK 相同） |  |
| `OSS_ACCESS_KEY_SECRET` | OSS AccessKey Secret |  |
| `OSS_SIGNED_URL_EXPIRES_SECONDS` | 签名 URL 有效期（秒） | `3600` |

### 微信支付

| 变量名 | 说明 |
|--------|------|
| `WECHAT_PAY_APPID` | 微信 AppID |
| `WECHAT_PAY_MCH_ID` | 商户号 |
| `WECHAT_PAY_API_V3_KEY` | APIv3 密钥 |
| `WECHAT_PAY_PRIVATE_KEY` | 商户私钥（`.pem` 内容，换行用 `\n` 替代） |
| `WECHAT_PAY_CERT_SERIAL_NO` | 商户证书序列号 |
| `WECHAT_PAY_NOTIFY_URL` | 支付回调地址，如 `https://yourdomain.com/api/pay/notify` |

### 站点

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `NEXT_PUBLIC_SITE_URL` | 站点公开地址（前端可访问） | `https://yourdomain.com` |
| `COOKIE_SECRET` | Cookie 签名密钥，随机字符串，建议 32 位以上 |  |

> **生成 COOKIE_SECRET 的命令：**
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

---

## 二、准备 SAE 环境

在阿里云 SAE（Serverless 应用引擎）控制台完成以下操作：

1. **创建命名空间**（如已有可跳过）
   - 建议生产命名空间与测试命名空间分开

2. **创建应用**
   - 运行时：Docker 镜像
   - 实例规格：根据实际流量评估，初期 1 核 2G × 1 实例即可
   - 端口：`3000`

3. **配置 VPC 和数据库网络**
   - 确保 SAE 应用与 RDS MySQL 在同一 VPC，或已配置对等连接
   - `DATABASE_URL` 中使用内网地址

4. **配置环境变量**
   - 在应用「环境变量」页面填入第一节所有变量

5. **配置日志采集**（可选但建议）
   - 开启标准输出日志采集，接入 SLS

---

## 三、构建镜像

### 前置条件

- 本地已安装 Docker
- 已登录阿里云容器镜像服务 ACR

```bash
# 登录 ACR（替换为你的 registry 地址）
docker login --username=<阿里云账号> registry.cn-shenzhen.aliyuncs.com
```

### 构建并推送

```bash
# 1. 构建镜像（在项目根目录执行）
docker build -t registry.cn-shenzhen.aliyuncs.com/<命名空间>/<镜像名>:latest .

# 2. 推送到 ACR
docker push registry.cn-shenzhen.aliyuncs.com/<命名空间>/<镜像名>:latest
```

> 建议用 git commit hash 做 tag，方便回滚：
> ```bash
> TAG=$(git rev-parse --short HEAD)
> docker build -t registry.cn-shenzhen.aliyuncs.com/<命名空间>/<镜像名>:$TAG .
> docker push registry.cn-shenzhen.aliyuncs.com/<命名空间>/<镜像名>:$TAG
> ```

---

## 四、SAE 第一次部署

### 4.1 部署应用

在 SAE 控制台「部署应用」页面：
- 镜像地址填入上一步推送的镜像 tag
- 点击确认部署，等待实例启动

启动时 `docker-entrypoint.sh` 会自动执行：
```
npx prisma migrate deploy   ← 建表 / 执行结构迁移
exec node server.js         ← 启动应用
```

### 4.2 初始化种子数据（仅首次）

应用启动成功后，**手动执行一次 seed**，写入剧集、会员套餐等初始数据：

```bash
# 进入 SAE 应用实例的控制台（Exec 进入容器）
npx prisma db seed
```

> 之后每次部署无需重复执行，数据已持久化在数据库中。  
> 如果需要更新种子数据（如新增剧集），修改 `prisma/seed.ts` 后重新执行即可。

### 4.3 验证

```bash
# 检查接口是否正常
curl https://yourdomain.com/api/dramas
```

---

## 后续部署

每次迭代只需重新构建镜像并在 SAE 更新版本：

```bash
TAG=$(git rev-parse --short HEAD)
docker build -t registry.cn-shenzhen.aliyuncs.com/<命名空间>/<镜像名>:$TAG .
docker push registry.cn-shenzhen.aliyuncs.com/<命名空间>/<镜像名>:$TAG
# 然后在 SAE 控制台更新镜像 tag 并部署
```
