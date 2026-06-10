# Drama 数据管道设计

**日期：** 2026-05-30  
**状态：** 已批准

## 背景

网站首页和剧集详情页目前使用硬编码的 mock 数据（`src/data/mockData.ts`、`HomePage.tsx` 内的硬编码数组）。本次目标是：

1. 将本地 `drama/` 目录的素材上传到阿里云 OSS
2. 将剧集元数据写入 MySQL 数据库（通过 Prisma）
3. 前端从 API 读取真实数据，替换所有 mock

---

## 范围

### 已有剧集（已上线，全集付费）

| 剧名 | slug | 集数 | 演员图 |
|------|------|------|--------|
| 疯狂的荔枝 | feng-kuang-de-lizhi | 10 | ✅ char-*.jpg |
| 周道与诸葛浪 | zhou-dao-yu-zhuge-lang | 4 | 待补 |
| 醉后撩到冷面仙君 | zui-hou-liao-dao-leng-mian-xian-jun | 2 | 待补 |

### 即将上线（仅封面，无集数）

天台来信、海上旧梦、港城无声、第七码头、迷雾追凶、长安夜雨、雪落关山、真千金她不装了、闪婚后上司宠我入骨

---

## OSS 路径规则

本地目录 → OSS 路径（本地和线上 bucket 不同，但路径完全相同）：

```
drama/疯狂的荔枝/cover.jpg            → dramas/feng-kuang-de-lizhi/cover.jpg
drama/疯狂的荔枝/poster1.jpg          → dramas/feng-kuang-de-lizhi/poster1.jpg
drama/疯狂的荔枝/poster2.jpg          → dramas/feng-kuang-de-lizhi/poster2.jpg
drama/疯狂的荔枝/trailer.mp4          → dramas/feng-kuang-de-lizhi/trailer.mp4
drama/疯狂的荔枝/1.mp4               → dramas/feng-kuang-de-lizhi/episodes/1.mp4
drama/疯狂的荔枝/char-liuchengye.jpg  → dramas/feng-kuang-de-lizhi/cast/liuchengye.jpg
drama/疯狂的荔枝/char-qinlie.jpg      → dramas/feng-kuang-de-lizhi/cast/qinlie.jpg
drama/疯狂的荔枝/char-shenmo.jpg      → dramas/feng-kuang-de-lizhi/cast/shenmo.jpg
drama/疯狂的荔枝/char-shitou.jpg      → dramas/feng-kuang-de-lizhi/cast/shitou.jpg
drama/疯狂的荔枝/char-sulingwei.jpg   → dramas/feng-kuang-de-lizhi/cast/sulingwei.jpg

drama/周道与诸葛浪/cover.png          → dramas/zhou-dao-yu-zhuge-lang/cover.png
drama/周道与诸葛浪/1.mp4             → dramas/zhou-dao-yu-zhuge-lang/episodes/1.mp4
（2.mp4、3.mp4、4.mp4 同理）

drama/醉后撩到冷面仙君/cover.png      → dramas/zui-hou-liao-dao-leng-mian-xian-jun/cover.png
drama/醉后撩到冷面仙君/1.mp4         → dramas/zui-hou-liao-dao-leng-mian-xian-jun/episodes/1.mp4
drama/醉后撩到冷面仙君/2.mp4         → dramas/zui-hou-liao-dao-leng-mian-xian-jun/episodes/2.mp4

drama/即将上线/天台来信.jpg           → dramas/upcoming/tian-tai-lai-xin.jpg
drama/即将上线/海上旧梦.jpg           → dramas/upcoming/hai-shang-jiu-meng.jpg
drama/即将上线/港城无声.jpg           → dramas/upcoming/gang-cheng-wu-sheng.jpg
drama/即将上线/第七码头.jpg           → dramas/upcoming/di-qi-ma-tou.jpg
drama/即将上线/迷雾追凶.jpg           → dramas/upcoming/mi-wu-zhui-xiong.jpg
drama/即将上线/长安夜雨.jpg           → dramas/upcoming/chang-an-ye-yu.jpg
drama/即将上线/雪落关山.jpg           → dramas/upcoming/xue-luo-guan-shan.jpg
drama/即将上线/真千金她不装了.jpg     → dramas/upcoming/zhen-qian-jin-ta-bu-zhuang-le.jpg
drama/即将上线/闪婚后上司宠我入骨.jpg → dramas/upcoming/shan-hun-hou-shang-si-chong-wo-ru-gu.jpg
```

---

## Script 1：OSS 上传脚本 (`scripts/upload-oss.ts`)

**运行环境：** 本地，不需要 Next.js。需提前导出 OSS 相关环境变量：
`OSS_REGION`, `OSS_BUCKET`, `OSS_ACCESS_KEY_ID`, `OSS_ACCESS_KEY_SECRET`

**实现：**
- 使用 `ali-oss`（项目已有依赖）
- 内置一个静态的 `UPLOAD_MAP: Array<{ localPath, ossKey }>` 列表，按上述路径规则枚举全部文件
- 并发上传，限制并发数为 3，避免超时
- 每个文件打印 `[上传中] {ossKey}` / `[完成] {ossKey}` / `[跳过，已存在] {ossKey}`（可通过 `--force` 参数强制覆盖）
- 全部完成后打印成功统计

**运行方式：**
```bash
export OSS_REGION=oss-cn-xxx
export OSS_BUCKET=my-bucket
export OSS_ACCESS_KEY_ID=xxx
export OSS_ACCESS_KEY_SECRET=xxx
npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/upload-oss.ts
# 强制覆盖已存在文件：
npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/upload-oss.ts --force
```

---

## Script 2：数据库种子脚本 (`scripts/seed-dramas.ts`)

**运行环境：** 本地和线上均需执行，需要 `DATABASE_URL`。

**实现：**
- 遵循 `prisma/seed.ts` 的现有模式（`PrismaClient` + upsert）
- 所有 OSS 路径硬编码，与 Script 1 的路径规则完全一致
- 使用 `crypto.randomUUID()` 生成确定性 UUID（实际用固定 UUID，保证幂等）
- 操作顺序：Drama → DramaGenre → Episode → CastMember → Recommendation

**DB 字段映射：**

| 字段 | 已上线剧 | 即将上线剧 |
|------|----------|------------|
| status | published | published |
| releaseStatus | released | upcoming |
| accessLevel（Episode） | member | — |
| publishedAt | 当前时间 | null |

**剧集元数据（创作）：**

- **疯狂的荔枝**：类型=古装/喜剧，简介见下文
- **周道与诸葛浪**：类型=古装/爱情，简介见下文  
- **醉后撩到冷面仙君**：类型=仙侠/爱情，简介见下文
- 即将上线剧：类型和简介各自创作，无集数

演员（仅疯狂的荔枝，其余两部待补）：
- 柳承业 / 御史 / cast/liuchengye.jpg（sortOrder=1）
- 苏凌薇 / 侠女 / cast/sulingwei.jpg（sortOrder=2）
- 秦烈 / 神秘客 / cast/qinlie.jpg（sortOrder=3）
- 石头 / 书生 / cast/shitou.jpg（sortOrder=4）
- 沈默 / 暗卫 / cast/shenmo.jpg（sortOrder=5）

Recommendation 表：为每部已上线剧各插入一条 Recommendation 记录（recommendationType='homepage'）。`getDramaDetail()` 的推荐逻辑是：查询所有 `enabled=true` 且 `dramaId != 当前剧` 的 Recommendation 行，所以本质上是"全局推荐池"，不需要为每对剧都建关联。

**运行方式：**
```bash
DATABASE_URL=mysql://... npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seed-dramas.ts
```

---

## Part 3：前端改动

### 3.1 `src/lib/drama/drama-service.ts`

`getPublishedDramas()` 返回值增加 `coverUrl: string`（对 `coverPath` 调用 `signOssPath()`）。  
`getDramaDetail()` 同理增加 `coverUrl`。

### 3.2 `app/api/dramas/route.ts`

无需改动（已透传 service 的返回值）。

### 3.3 `src/components/HomePage.tsx`

- 删除硬编码的 `heroDramas` 和 `recommendedDramas` 常量
- 组件 mount 时 `apiGet<{ dramas: PublishedDrama[] }>('/api/dramas')` 获取数据（返回所有 `status=published` 的剧，含即将上线）
- `releaseStatus === 'released'` 的剧作为 hero 轮播
- 全部剧（含 `releaseStatus === 'upcoming'`）作为推荐区展示
- 加载中和加载失败的占位状态

### 3.4 `src/App.tsx`

- 删除 `mockCast`、`mockRecommendations` 引用
- `page === 'episode-detail'` 时，`apiGet('/api/dramas/{selectedDrama.id}')` 获取详情
- 将 cast 和 recommendations 从 API 响应映射到 `EpisodeDetailPage` 的 props
- 加载中期间显示加载状态

### 3.5 `src/types/drama.ts`

`Drama` 接口增加可选字段 `slug?: string`，供导航使用。

---

## 不在范围内

- 演员页面（剩余两部剧的演员后续 upsert）
- 视频时长自动检测（`durationSeconds` 先置 0）
- OSS 图片 CDN / 缓存策略
- 管理后台

---

## 执行顺序

1. 本地：运行 `upload-oss.ts`（上传到本地/测试 bucket）
2. 本地：运行 `seed-dramas.ts`（写入本地数据库）
3. 本地验证页面正常
4. 线上：运行 `upload-oss.ts`（上传到生产 bucket）
5. 线上：运行 `seed-dramas.ts`（写入生产数据库）
