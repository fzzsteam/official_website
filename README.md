# 方直智胜官网

## 项目说明

这是一个基于 `Node.js + Express` 的官网项目。

主要目录：

- `server.js`：服务启动入口
- `server/`：服务端路由、配置和页面渲染逻辑
- `css/`：样式文件
- `js/`：前端脚本
- `assets/`：素材说明文件
- `test/`：接口与页面渲染测试

## 本地运行

先安装依赖：

```bash
npm install
```

复制环境变量模板：

```bash
cp .env.example .env
```

启动项目：

```bash
npm start
```

默认监听端口：

```text
3000
```

启动后可访问：

```text
http://127.0.0.1:3000
```

健康检查地址：

```text
http://127.0.0.1:3000/healthz
```

## 环境变量

参考 [`.env.example`](/home/yuanjiawei/AIProject/fzzs/official_website/.env.example:1)：

- `PORT`：服务端口，默认 `3000`
- `OSS_REGION`
- `OSS_BUCKET`
- `OSS_ACCESS_KEY_ID`
- `OSS_ACCESS_KEY_SECRET`
- `OSS_URL_EXPIRES_SECONDS`

## 测试

运行测试：

```bash
npm test
```
