# 方直智胜官网

当前项目已改造成 `Node.js + Express + OSS SDK` 模式，适合部署到阿里云 `SAE`。  
页面由 Node 服务提供，图片和视频从私有 `OSS` 通过服务端临时签名后返回，不在页面里写死公网资源地址。

## 目录说明

- `server.js`：服务启动入口
- `server/app.js`：Express 应用与路由
- `server/config.js`：环境变量配置加载与 OSS 签名
- `server/assets.js`：页面资源与 OSS 对象键映射
- `server/render.js`：HTML 模板渲染与媒体地址注入
- `test/server.test.js`：服务端回归测试

## 本地启动

```bash
npm install
cp .env.example .env
npm start
```

默认端口为 `3000`。

## 环境变量

- `PORT`：服务监听端口，默认 `3000`
- `OSS_REGION`：OSS 区域，例如 `oss-cn-shenzhen`
- `OSS_BUCKET`：Bucket 名称，例如 `fangzhi-prod`
- `OSS_ACCESS_KEY_ID`：阿里云 AccessKey ID
- `OSS_ACCESS_KEY_SECRET`：阿里云 AccessKey Secret
- `OSS_URL_EXPIRES_SECONDS`：签名 URL 有效期，默认 `3600`

部署到 SAE 时直接配置这些环境变量即可，代码会自动读取。

## 媒体资源规则

页面中的媒体引用不再直接写固定 OSS 地址，而是由服务端在返回 HTML 时注入签名 URL。

你需要在 `OSS` 中保持这套目录结构：

```text
official_site/lizhi/
  cover.jpg
  poster1.jpg
  poster2.jpg
  trailer.mp4
  char-liuchengy.jpg
  char-sulingwei.jpg
  char-qinlie.jpg
  char-shitou.jpg
  char-shenmo.jpg

official_site/upcoming/
  cover-01.jpg
  cover-02.jpg
  cover-03.jpg
  cover-04.jpg
  cover-05.jpg
```

## API

服务提供了一个基础配置接口，便于后续前端或客户端扩展：

```http
GET /api/site-config
```

返回示例：

```json
{
  "bucket": "fangzhi-prod",
  "region": "oss-cn-shenzhen",
  "expiresInSeconds": 3600,
  "assets": {
    "lizhiTrailer": "https://..."
  }
}
```

## SAE 部署建议

### 方案 A：直接用源码构建

- 代码仓库上传到 SAE
- 启动命令使用：`npm install && npm start`
- 环境变量配置：
  - `PORT=3000`
  - `OSS_REGION=oss-cn-shenzhen`
  - `OSS_BUCKET=fangzhi-prod`
  - `OSS_ACCESS_KEY_ID=...`
  - `OSS_ACCESS_KEY_SECRET=...`
  - `OSS_URL_EXPIRES_SECONDS=3600`

### 方案 B：使用 Dockerfile

构建镜像后部署到 SAE，项目已包含 `Dockerfile`。

本地验证：

```bash
docker build -t official-website .
docker run --rm -p 3000:3000 \
  -e OSS_REGION=oss-cn-shenzhen \
  -e OSS_BUCKET=fangzhi-prod \
  -e OSS_ACCESS_KEY_ID=your-access-key-id \
  -e OSS_ACCESS_KEY_SECRET=your-access-key-secret \
  -e OSS_URL_EXPIRES_SECONDS=3600 \
  official-website
```

## OSS 配置建议

- Bucket 建议设置为私有
- SAE 使用 AK/SK 环境变量读取 OSS
- 当前项目中的对象路径约定为：
  - `official_site/lizhi/...`
  - `official_site/upcoming/...`

## GitHub Actions 流水线

项目已包含 GitHub Actions 文件 [`.github/workflows/docker.yml`](/home/yuanjiawei/AIProject/fzzs/official_website/.github/workflows/docker.yml:1)。

- 触发条件：`master` 分支每次 push 自动构建
- 产物镜像：
  - `crpi-7ajeyduewy90avu4.cn-shenzhen.personal.cr.aliyuncs.com/fzzs/official_website:latest`
  - `crpi-7ajeyduewy90avu4.cn-shenzhen.personal.cr.aliyuncs.com/fzzs/official_website:<时间戳-短SHA>`
- GitHub Secrets 需要提前配置：
  - `ACR_USERNAME`
  - `ACR_PASSWORD`

## 测试

```bash
npm test
```
