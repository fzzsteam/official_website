# Drama 数据管道实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 写 OSS 上传脚本、数据库 seed 脚本，并把前端首页和剧集详情页从 mock 数据改为读真实 API。

**Architecture:** 两个独立脚本（上传/seed）+ 服务层加 signed URL 字段 + 前端 fetch API 替换 mock。coverPath 用竖版封面（推荐卡），posterPath 用横版封面（Hero）。

**Tech Stack:** TypeScript, ali-oss, Prisma, React, Next.js API Routes, Node test runner

---

## 文件清单

| 操作 | 路径 |
|------|------|
| 新建 | `scripts/upload-oss.ts` |
| 新建 | `scripts/seed-dramas.ts` |
| 改 | `src/lib/drama/drama-service.ts` |
| 改 | `src/types/drama.ts` |
| 改 | `src/components/HomePage.tsx` |
| 改 | `src/App.tsx` |
| 改 | `test/server-drama.test.cjs` |
| 改 | `test/frontend-api-wiring.test.cjs` |

---

## Task 1: OSS 上传脚本

**Files:**
- Create: `scripts/upload-oss.ts`

- [ ] **Step 1: 创建脚本**

```typescript
import OSS from 'ali-oss';
import * as path from 'path';
import * as fs from 'fs';

interface UploadEntry {
  localPath: string;
  ossKey: string;
}

const FORCE = process.argv.includes('--force');
const DRAMA_DIR = path.join(process.cwd(), 'drama');

function getOssClient(): OSS {
  const { OSS_REGION, OSS_BUCKET, OSS_ACCESS_KEY_ID, OSS_ACCESS_KEY_SECRET } = process.env;
  if (!OSS_REGION || !OSS_BUCKET || !OSS_ACCESS_KEY_ID || !OSS_ACCESS_KEY_SECRET) {
    throw new Error('Missing env vars: OSS_REGION, OSS_BUCKET, OSS_ACCESS_KEY_ID, OSS_ACCESS_KEY_SECRET');
  }
  return new OSS({ region: OSS_REGION, bucket: OSS_BUCKET, accessKeyId: OSS_ACCESS_KEY_ID, accessKeySecret: OSS_ACCESS_KEY_SECRET });
}

function buildUploadMap(): UploadEntry[] {
  const entries: UploadEntry[] = [];

  // ── Published dramas ──────────────────────────────────────────
  const published = [
    {
      dir: '疯狂的荔枝',
      slug: 'feng-kuang-de-lizhi',
      coverExt: 'jpg',
      bannerFile: 'poster1.jpg',   // 横版
      episodeCount: 10,
      extraPosters: ['poster2.jpg'],
      hasTrailer: true,
      castFiles: [
        { local: 'char-liuchengye.jpg', ossName: 'liuchengye.jpg' },
        { local: 'char-qinlie.jpg',     ossName: 'qinlie.jpg' },
        { local: 'char-shenmo.jpg',     ossName: 'shenmo.jpg' },
        { local: 'char-shitou.jpg',     ossName: 'shitou.jpg' },
        { local: 'char-sulingwei.jpg',  ossName: 'sulingwei.jpg' },
      ],
    },
    {
      dir: '周道与诸葛浪',
      slug: 'zhou-dao-yu-zhuge-lang',
      coverExt: 'png',
      bannerFile: 'cover-横板.png',  // 横版
      episodeCount: 4,
      extraPosters: [],
      hasTrailer: false,
      castFiles: [
        { local: '周道.png',   ossName: 'zhoudao.png' },
        { local: '诸葛浪.png', ossName: 'zhugelan.png' },
      ],
    },
    {
      dir: '醉后撩到冷面仙君',
      slug: 'zui-hou-liao-dao-leng-mian-xian-jun',
      coverExt: 'png',
      bannerFile: 'cover-横板.png',  // 横版
      episodeCount: 2,
      extraPosters: [],
      hasTrailer: false,
      castFiles: [
        { local: '姜梨酒.png',       ossName: 'jiangliqiu.png' },
        { local: '仙尊：容清晏.png', ossName: 'rong-qing-yan.png' },
        { local: '魔君：夜烬离.png', ossName: 'ye-jin-li.png' },
        { local: '冷面仙君：玄寂尘.png', ossName: 'xuan-ji-chen.png' },
      ],
    },
  ];

  for (const drama of published) {
    const dramaDir = path.join(DRAMA_DIR, drama.dir);
    const prefix = `dramas/${drama.slug}`;

    // 竖版封面
    entries.push({ localPath: path.join(dramaDir, `cover.${drama.coverExt}`), ossKey: `${prefix}/cover.${drama.coverExt}` });
    // 横版封面（banner/poster for hero）
    entries.push({ localPath: path.join(dramaDir, drama.bannerFile), ossKey: `${prefix}/poster.${drama.bannerFile.split('.').pop()}` });
    // 额外 poster
    for (const p of drama.extraPosters) {
      entries.push({ localPath: path.join(dramaDir, p), ossKey: `${prefix}/${p}` });
    }
    // Trailer
    if (drama.hasTrailer) {
      entries.push({ localPath: path.join(dramaDir, 'trailer.mp4'), ossKey: `${prefix}/trailer.mp4` });
    }
    // Episodes
    for (let i = 1; i <= drama.episodeCount; i++) {
      entries.push({ localPath: path.join(dramaDir, `${i}.mp4`), ossKey: `${prefix}/episodes/${i}.mp4` });
    }
    // Cast
    for (const c of drama.castFiles) {
      entries.push({ localPath: path.join(dramaDir, c.local), ossKey: `${prefix}/cast/${c.ossName}` });
    }
  }

  // ── Upcoming dramas (竖版封面只) ─────────────────────────────
  const upcoming: Array<{ filename: string; ossKey: string }> = [
    { filename: '天台来信.jpg',           ossKey: 'dramas/upcoming/tian-tai-lai-xin.jpg' },
    { filename: '海上旧梦.jpg',           ossKey: 'dramas/upcoming/hai-shang-jiu-meng.jpg' },
    { filename: '港城无声.jpg',           ossKey: 'dramas/upcoming/gang-cheng-wu-sheng.jpg' },
    { filename: '第七码头.jpg',           ossKey: 'dramas/upcoming/di-qi-ma-tou.jpg' },
    { filename: '迷雾追凶.jpg',           ossKey: 'dramas/upcoming/mi-wu-zhui-xiong.jpg' },
    { filename: '长安夜雨.jpg',           ossKey: 'dramas/upcoming/chang-an-ye-yu.jpg' },
    { filename: '雪落关山.jpg',           ossKey: 'dramas/upcoming/xue-luo-guan-shan.jpg' },
    { filename: '真千金她不装了.jpg',     ossKey: 'dramas/upcoming/zhen-qian-jin-ta-bu-zhuang-le.jpg' },
    { filename: '闪婚后上司宠我入骨.jpg', ossKey: 'dramas/upcoming/shan-hun-hou-shang-si-chong-wo-ru-gu.jpg' },
  ];
  const upcomingDir = path.join(DRAMA_DIR, '即将上线');
  for (const item of upcoming) {
    entries.push({ localPath: path.join(upcomingDir, item.filename), ossKey: item.ossKey });
  }

  return entries;
}

async function uploadAll(client: OSS, entries: UploadEntry[]): Promise<void> {
  const CONCURRENCY = 3;
  let idx = 0;
  let success = 0, skipped = 0, failed = 0;

  async function worker(): Promise<void> {
    while (true) {
      const i = idx++;
      if (i >= entries.length) break;
      const { localPath, ossKey } = entries[i];

      if (!fs.existsSync(localPath)) {
        console.log(`[跳过，本地不存在] ${localPath}`);
        skipped++;
        continue;
      }

      try {
        if (!FORCE) {
          try {
            await client.head(ossKey);
            console.log(`[跳过，已存在] ${ossKey}`);
            skipped++;
            continue;
          } catch {
            // not found, proceed
          }
        }
        console.log(`[上传中] ${ossKey}`);
        await client.put(ossKey, localPath);
        console.log(`[完成] ${ossKey}`);
        success++;
      } catch (e) {
        console.error(`[失败] ${ossKey}: ${e instanceof Error ? e.message : String(e)}`);
        failed++;
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log(`\n完成：成功 ${success}，跳过 ${skipped}，失败 ${failed}`);
  if (failed > 0) process.exit(1);
}

async function main(): Promise<void> {
  const client = getOssClient();
  const entries = buildUploadMap();
  console.log(`共 ${entries.length} 个文件（--force: ${FORCE}）`);
  await uploadAll(client, entries);
}

main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: 验证脚本语法**

```bash
npx ts-node --compiler-options '{"module":"CommonJS"}' --dry-run scripts/upload-oss.ts 2>&1 || true
```

- [ ] **Step 3: 提交**

```bash
git add scripts/upload-oss.ts
git commit -m "feat: add OSS upload script for drama assets"
```

---

## Task 2: 数据库 seed 脚本

**Files:**
- Create: `scripts/seed-dramas.ts`

- [ ] **Step 1: 创建脚本**

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });

// ── ID helpers ────────────────────────────────────────────────────
const did  = (n: number) => `00000000-0000-0000-0001-${String(n).padStart(12, '0')}`;
const epid = (d: number, e: number) => `00000000-0000-0000-0002-${String(d).padStart(6, '0')}${String(e).padStart(6, '0')}`;
const gid  = (n: number) => `00000000-0000-0000-0003-${String(n).padStart(12, '0')}`;
const cid  = (d: number, n: number) => `00000000-0000-0000-0004-${String(d).padStart(6, '0')}${String(n).padStart(6, '0')}`;
const rid  = (n: number) => `00000000-0000-0000-0005-${String(n).padStart(12, '0')}`;

// ── Helper ────────────────────────────────────────────────────────
async function upsertDrama(data: {
  id: string; slug: string; title: string; subtitle?: string; synopsis: string;
  coverPath: string; posterPath?: string; trailerPath?: string;
  status: string; releaseStatus: string; publishedAt: Date | null; sortOrder: number;
}) {
  const { id, slug, ...rest } = data;
  await prisma.drama.upsert({
    where: { slug },
    create: { id, slug, ...rest },
    update: rest,
  });
}

async function upsertGenres(dramaId: string, genres: Array<{ id: string; code: string; name: string }>, startIdx: number) {
  for (let i = 0; i < genres.length; i++) {
    const g = genres[i];
    await prisma.dramaGenre.upsert({
      where: { uk_drama_genres_drama_genre: { dramaId, genreCode: g.code } },
      create: { id: g.id, dramaId, genreCode: g.code, genreName: g.name },
      update: { genreName: g.name },
    });
  }
}

async function upsertEpisodes(dramaId: string, dramaIdx: number, count: number) {
  for (let i = 1; i <= count; i++) {
    const slug = dramaId; // not used, just for reference
    await prisma.episode.upsert({
      where: { uk_episodes_drama_episode: { dramaId, episodeNo: i } },
      create: {
        id: epid(dramaIdx, i),
        dramaId,
        episodeNo: i,
        title: `第${i}集`,
        videoPath: `${getDramaOssPrefix(dramaIdx)}/episodes/${i}.mp4`,
        durationSeconds: 0,
        accessLevel: 'member',
        status: 'published',
        publishedAt: new Date('2025-03-01'),
      },
      update: {
        title: `第${i}集`,
        videoPath: `${getDramaOssPrefix(dramaIdx)}/episodes/${i}.mp4`,
        accessLevel: 'member',
        status: 'published',
      },
    });
  }
}

function getDramaOssPrefix(dramaIdx: number): string {
  const prefixes: Record<number, string> = {
    1: 'dramas/feng-kuang-de-lizhi',
    2: 'dramas/zhou-dao-yu-zhuge-lang',
    3: 'dramas/zui-hou-liao-dao-leng-mian-xian-jun',
  };
  return prefixes[dramaIdx] ?? '';
}

// ── Main ──────────────────────────────────────────────────────────
async function main() {

  // ── 1. 疯狂的荔枝 ────────────────────────────────────────────
  await upsertDrama({
    id: did(1), slug: 'feng-kuang-de-lizhi', title: '疯狂的荔枝',
    subtitle: '一颗荔枝 · 一场传奇',
    synopsis: '大唐盛世，岭南荔枝声名远播。御史柳承业奉命押送一批珍贵荔枝进京，不料途中遭遇奇人异事，一颗小小的荔枝竟牵动出一段啼笑皆非的江湖恩怨。书生石头、侠女苏凌薇、神秘客秦烈，各怀心事，命运交织。荔枝传情，笑中有泪，疯狂之中自有真情。',
    coverPath: 'dramas/feng-kuang-de-lizhi/cover.jpg',
    posterPath: 'dramas/feng-kuang-de-lizhi/poster.jpg',
    trailerPath: 'dramas/feng-kuang-de-lizhi/trailer.mp4',
    status: 'published', releaseStatus: 'released',
    publishedAt: new Date('2025-03-01'), sortOrder: 1,
  });
  await upsertGenres(did(1), [
    { id: gid(1), code: 'costume', name: '古装' },
    { id: gid(2), code: 'comedy',  name: '喜剧' },
  ], 1);
  await upsertEpisodes(did(1), 1, 10);

  // Cast
  const cast1 = [
    { n: 1, name: '柳承业', role: '御史',   avatar: 'liuchengye.jpg' },
    { n: 2, name: '苏凌薇', role: '侠女',   avatar: 'sulingwei.jpg' },
    { n: 3, name: '秦烈',   role: '神秘客', avatar: 'qinlie.jpg' },
    { n: 4, name: '石头',   role: '书生',   avatar: 'shitou.jpg' },
    { n: 5, name: '沈默',   role: '暗卫',   avatar: 'shenmo.jpg' },
  ];
  for (const c of cast1) {
    await prisma.castMember.upsert({
      where: { id: cid(1, c.n) },
      create: { id: cid(1, c.n), dramaId: did(1), name: c.name, roleName: c.role, avatarPath: `dramas/feng-kuang-de-lizhi/cast/${c.avatar}`, sortOrder: c.n },
      update: { name: c.name, roleName: c.role, avatarPath: `dramas/feng-kuang-de-lizhi/cast/${c.avatar}`, sortOrder: c.n },
    });
  }

  // ── 2. 周道与诸葛浪 ─────────────────────────────────────────
  await upsertDrama({
    id: did(2), slug: 'zhou-dao-yu-zhuge-lang', title: '周道与诸葛浪',
    subtitle: '乱世情，江湖缘',
    synopsis: '落魄举子周道一朝遭奸人陷害，流落江湖。偶遇出身名门却不羁江湖的诸葛浪，两人性情相悖，却在一次次磕磕绊绊中渐生情愫。命运弄人，恩怨交织，一段乱世儿女情跃然而出。',
    coverPath: 'dramas/zhou-dao-yu-zhuge-lang/cover.png',
    posterPath: 'dramas/zhou-dao-yu-zhuge-lang/poster.png',
    status: 'published', releaseStatus: 'released',
    publishedAt: new Date('2025-04-01'), sortOrder: 2,
  });
  await upsertGenres(did(2), [
    { id: gid(3), code: 'costume', name: '古装' },
    { id: gid(4), code: 'romance', name: '爱情' },
  ], 3);
  await upsertEpisodes(did(2), 2, 4);

  const cast2 = [
    { n: 1, name: '周道',   role: '落魄举子', avatar: 'zhoudao.png' },
    { n: 2, name: '诸葛浪', role: '名门侠女', avatar: 'zhugelan.png' },
  ];
  for (const c of cast2) {
    await prisma.castMember.upsert({
      where: { id: cid(2, c.n) },
      create: { id: cid(2, c.n), dramaId: did(2), name: c.name, roleName: c.role, avatarPath: `dramas/zhou-dao-yu-zhuge-lang/cast/${c.avatar}`, sortOrder: c.n },
      update: { name: c.name, roleName: c.role, avatarPath: `dramas/zhou-dao-yu-zhuge-lang/cast/${c.avatar}`, sortOrder: c.n },
    });
  }

  // ── 3. 醉后撩到冷面仙君 ─────────────────────────────────────
  await upsertDrama({
    id: did(3), slug: 'zui-hou-liao-dao-leng-mian-xian-jun', title: '醉后撩到冷面仙君',
    subtitle: '一醉误撩，千年禁忌',
    synopsis: '仙界第一冷面战神闻清辞，端方肃穆，百年未逾矩。直到一夜误饮忘情酒，被凡间莽撞女子姜梨酒撞个正着。女子醉话连篇，句句撩动禁地，仙君从此破了清规，破了戒，也破了心。',
    coverPath: 'dramas/zui-hou-liao-dao-leng-mian-xian-jun/cover.png',
    posterPath: 'dramas/zui-hou-liao-dao-leng-mian-xian-jun/poster.png',
    status: 'published', releaseStatus: 'released',
    publishedAt: new Date('2025-05-01'), sortOrder: 3,
  });
  await upsertGenres(did(3), [
    { id: gid(5), code: 'xianxia', name: '仙侠' },
    { id: gid(6), code: 'romance', name: '爱情' },
  ], 5);
  await upsertEpisodes(did(3), 3, 2);

  const cast3 = [
    { n: 1, name: '姜梨酒', role: '凡间女子',  avatar: 'jiangliqiu.png' },
    { n: 2, name: '玄寂尘', role: '冷面仙君',  avatar: 'xuan-ji-chen.png' },
    { n: 3, name: '容清晏', role: '仙尊',      avatar: 'rong-qing-yan.png' },
    { n: 4, name: '夜烬离', role: '魔君',      avatar: 'ye-jin-li.png' },
  ];
  for (const c of cast3) {
    await prisma.castMember.upsert({
      where: { id: cid(3, c.n) },
      create: { id: cid(3, c.n), dramaId: did(3), name: c.name, roleName: c.role, avatarPath: `dramas/zui-hou-liao-dao-leng-mian-xian-jun/cast/${c.avatar}`, sortOrder: c.n },
      update: { name: c.name, roleName: c.role, avatarPath: `dramas/zui-hou-liao-dao-leng-mian-xian-jun/cast/${c.avatar}`, sortOrder: c.n },
    });
  }

  // ── Upcoming dramas ──────────────────────────────────────────
  const upcoming = [
    { n: 101, slug: 'tian-tai-lai-xin',                title: '天台来信',         subtitle: '误投的信，命定的缘', synopsis: '一封误投的信，一段跨越二十年的回忆。城市喧嚣中，两个陌生人在天台偶然相遇，信封里藏着的秘密，悄悄牵动着彼此的命运。', cover: 'dramas/upcoming/tian-tai-lai-xin.jpg',                    genres: [{ id: gid(7),  code: 'urban',   name: '都市' }, { id: gid(8),  code: 'romance',  name: '爱情' }], sortOrder: 101 },
    { n: 102, slug: 'hai-shang-jiu-meng',               title: '海上旧梦',         subtitle: '那片海，那段未说出口的爱', synopsis: '远洋渔船失事后，唯一的幸存者带着一段残缺的记忆上岸。那片海，那艘船，那段来不及说出口的爱……往事如浪，翻涌不休。', cover: 'dramas/upcoming/hai-shang-jiu-meng.jpg',               genres: [{ id: gid(9),  code: 'suspense', name: '悬疑' }, { id: gid(10), code: 'romance',  name: '爱情' }], sortOrder: 102 },
    { n: 103, slug: 'gang-cheng-wu-sheng',              title: '港城无声',         subtitle: '用眼睛读懂听不见的真相', synopsis: '南方港口，无声的城市暗流涌动。一名失聪的翻译官意外卷入跨国走私案，用眼睛读懂了别人听不见的真相。', cover: 'dramas/upcoming/gang-cheng-wu-sheng.jpg',              genres: [{ id: gid(11), code: 'suspense', name: '悬疑' }, { id: gid(12), code: 'urban',    name: '都市' }], sortOrder: 103 },
    { n: 104, slug: 'di-qi-ma-tou',                    title: '第七码头',         subtitle: '二十年前被封存的秘密', synopsis: '第七号码头，一个二十年前被封存的秘密。年轻警探只身入局，却发现真相远比想象中复杂，而危险也比想象中更近。', cover: 'dramas/upcoming/di-qi-ma-tou.jpg',                    genres: [{ id: gid(13), code: 'suspense', name: '悬疑' }, { id: gid(14), code: 'thriller', name: '惊悚' }], sortOrder: 104 },
    { n: 105, slug: 'mi-wu-zhui-xiong',                title: '迷雾追凶',         subtitle: '雾散之日，真相浮现', synopsis: '山中小镇接连发生离奇失踪案。刑警赵霁独自深入，在经年浓雾中追踪恶意的痕迹，每一步都走在生死边缘。', cover: 'dramas/upcoming/mi-wu-zhui-xiong.jpg',                genres: [{ id: gid(15), code: 'suspense', name: '悬疑' }, { id: gid(16), code: 'thriller', name: '惊悚' }], sortOrder: 105 },
    { n: 106, slug: 'chang-an-ye-yu',                  title: '长安夜雨',         subtitle: '雨停之日，命运已变', synopsis: '长安城一场突如其来的夜雨，将两个身份迥异的人困在同一间客栈。雨停之日，命运已悄然改变。', cover: 'dramas/upcoming/chang-an-ye-yu.jpg',                  genres: [{ id: gid(17), code: 'costume', name: '古装' }, { id: gid(18), code: 'romance',  name: '爱情' }], sortOrder: 106 },
    { n: 107, slug: 'xue-luo-guan-shan',               title: '雪落关山',         subtitle: '最后一战前的迟来信', synopsis: '大雪封山，关外铁骑压境。守城将领萧寒在最后一战前，收到了那封迟来十年的信。', cover: 'dramas/upcoming/xue-luo-guan-shan.jpg',               genres: [{ id: gid(19), code: 'costume', name: '古装' }, { id: gid(20), code: 'war',      name: '战争' }], sortOrder: 107 },
    { n: 108, slug: 'zhen-qian-jin-ta-bu-zhuang-le',   title: '真千金她不装了',   subtitle: '撕下伪装，步步为营', synopsis: '被错换身份的真千金，在家族恩怨与豪门博弈中步步为营。当她选择撕下伪装，所有人才发现，她从未是那个软弱的棋子。', cover: 'dramas/upcoming/zhen-qian-jin-ta-bu-zhuang-le.jpg',   genres: [{ id: gid(21), code: 'urban',   name: '都市' }, { id: gid(22), code: 'romance',  name: '爱情' }], sortOrder: 108 },
    { n: 109, slug: 'shan-hun-hou-shang-si-chong-wo-ru-gu', title: '闪婚后上司宠我入骨', subtitle: '协议闪婚，宠入骨髓', synopsis: '一纸协议闪婚，对象竟是职场冷面上司。婚后相处，外冷内热的他步步为营，将她宠进骨子里，再也不想放手。', cover: 'dramas/upcoming/shan-hun-hou-shang-si-chong-wo-ru-gu.jpg', genres: [{ id: gid(23), code: 'urban',   name: '都市' }, { id: gid(24), code: 'romance',  name: '爱情' }], sortOrder: 109 },
  ];

  for (const u of upcoming) {
    await upsertDrama({
      id: did(u.n), slug: u.slug, title: u.title, subtitle: u.subtitle, synopsis: u.synopsis,
      coverPath: u.cover, status: 'published', releaseStatus: 'upcoming',
      publishedAt: null, sortOrder: u.sortOrder,
    });
    await upsertGenres(did(u.n), u.genres, 0);
  }

  // ── Recommendations（已上线剧进全局推荐池）────────────────────
  for (let i = 1; i <= 3; i++) {
    await prisma.recommendation.upsert({
      where: { uk_recommendations_type_drama: { recommendationType: 'homepage', dramaId: did(i) } },
      create: { id: rid(i), dramaId: did(i), recommendationType: 'homepage', sortOrder: i, enabled: true },
      update: { sortOrder: i, enabled: true },
    });
  }

  console.log('Drama seed 完成');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 2: 验证语法**

```bash
npx ts-node --compiler-options '{"module":"CommonJS"}' --dry-run scripts/seed-dramas.ts 2>&1 || true
```

- [ ] **Step 3: 提交**

```bash
git add scripts/seed-dramas.ts
git commit -m "feat: add drama DB seed script"
```

---

## Task 3: 更新 drama-service.ts 加 signed URL

**Files:**
- Modify: `src/lib/drama/drama-service.ts`
- Test: `test/server-drama.test.cjs`

- [ ] **Step 1: 在 server-drama.test.cjs 加测试**

在文件末尾追加：

```javascript
test('drama service returns signed coverUrl and posterUrl in list', () => {
  const source = read('src/lib/drama/drama-service.ts');
  assert.match(source, /coverUrl/);
  assert.match(source, /posterUrl/);
  assert.match(source, /genreNames/);
});

test('drama service signs avatarUrl for cast members', () => {
  const source = read('src/lib/drama/drama-service.ts');
  assert.match(source, /avatarUrl/);
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
node --test test/server-drama.test.cjs 2>&1 | tail -20
```

Expected: 两个新测试 FAIL

- [ ] **Step 3: 更新 drama-service.ts**

在 `PublishedDrama` 接口添加字段，在实现中添加签名：

将 `PublishedDrama` 接口改为：

```typescript
export interface PublishedDrama {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  synopsis: string | null;
  coverPath: string;
  coverUrl: string;
  posterPath: string | null;
  posterUrl: string | null;
  trailerPath: string | null;
  releaseStatus: string;
  publishedAt: string | null;
  sortOrder: number;
  totalEpisodes: number;
  genreNames: string[];
}
```

将 `DramaDetail` cast 改为：

```typescript
cast: Array<{
  id: string;
  name: string;
  roleName: string | null;
  avatarPath: string | null;
  avatarUrl: string | null;
  sortOrder: number;
}>;
```

将 `DramaDetail` recommendations 改为：

```typescript
recommendations: Array<{
  id: string;
  slug: string;
  title: string;
  coverPath: string;
  coverUrl: string;
  sortOrder: number;
}>;
```

将 `getPublishedDramas()` 改为（含 genres include 和签名）：

```typescript
export async function getPublishedDramas(): Promise<PublishedDrama[]> {
  const dramas = await prisma.drama.findMany({
    where: { status: 'published' },
    orderBy: [{ sortOrder: 'asc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
    include: {
      _count: {
        select: { episodes: { where: { status: 'published' } } },
      },
      genres: true,
    },
  });

  return dramas.map((d) => ({
    id: d.id,
    slug: d.slug,
    title: d.title,
    subtitle: d.subtitle,
    synopsis: d.synopsis,
    coverPath: d.coverPath,
    coverUrl: signOssPath(d.coverPath),
    posterPath: d.posterPath,
    posterUrl: d.posterPath ? signOssPath(d.posterPath) : null,
    trailerPath: d.trailerPath,
    releaseStatus: d.releaseStatus,
    publishedAt: toIsoString(d.publishedAt),
    sortOrder: d.sortOrder,
    totalEpisodes: d._count.episodes,
    genreNames: d.genres.map((g) => g.genreName),
  }));
}
```

将 `getDramaDetail()` 返回值改为（在 `id: drama.id` 同层添加）：

```typescript
return {
  id: drama.id,
  slug: drama.slug,
  title: drama.title,
  subtitle: drama.subtitle,
  synopsis: drama.synopsis,
  coverPath: drama.coverPath,
  coverUrl: signOssPath(drama.coverPath),
  posterPath: drama.posterPath,
  posterUrl: drama.posterPath ? signOssPath(drama.posterPath) : null,
  trailerPath: drama.trailerPath,
  releaseStatus: drama.releaseStatus,
  publishedAt: toIsoString(drama.publishedAt),
  sortOrder: drama.sortOrder,
  totalEpisodes: drama._count.episodes,
  genreNames: genres.map((g) => g.genreName),
  genres: genres.map((g) => ({ code: g.genreCode, name: g.genreName })),
  cast: cast.map((c) => ({
    id: c.id,
    name: c.name,
    roleName: c.roleName,
    avatarPath: c.avatarPath,
    avatarUrl: c.avatarPath ? signOssPath(c.avatarPath) : null,
    sortOrder: c.sortOrder,
  })),
  episodes: episodes.map(mapDramaEpisode),
  recommendations: recommendations.map((r) => ({
    id: r.drama.id,
    slug: r.drama.slug,
    title: r.drama.title,
    coverPath: r.drama.coverPath,
    coverUrl: signOssPath(r.drama.coverPath),
    sortOrder: r.sortOrder,
  })),
};
```

- [ ] **Step 4: 运行测试确认通过**

```bash
node --test test/server-drama.test.cjs 2>&1 | tail -20
```

Expected: 全部 PASS

- [ ] **Step 5: 提交**

```bash
git add src/lib/drama/drama-service.ts test/server-drama.test.cjs
git commit -m "feat: add signed coverUrl/posterUrl/avatarUrl to drama service"
```

---

## Task 4: 更新 src/types/drama.ts 加 API 类型

**Files:**
- Modify: `src/types/drama.ts`

- [ ] **Step 1: 在文件末尾追加 API 类型**

```typescript
// API response types — what the server returns to client components
export interface ApiDrama {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  synopsis: string | null;
  coverUrl: string;
  posterUrl: string | null;
  releaseStatus: string;
  sortOrder: number;
  totalEpisodes: number;
  genreNames: string[];
}

export interface ApiDramaDetail extends ApiDrama {
  cast: Array<{
    id: string;
    name: string;
    roleName: string | null;
    avatarUrl: string | null;
  }>;
  recommendations: Array<{
    id: string;
    title: string;
    coverUrl: string;
  }>;
}
```

- [ ] **Step 2: 提交**

```bash
git add src/types/drama.ts
git commit -m "feat: add ApiDrama and ApiDramaDetail types"
```

---

## Task 5: 更新 HomePage.tsx 从 API 读数据

**Files:**
- Modify: `src/components/HomePage.tsx`
- Test: `test/frontend-api-wiring.test.cjs`

- [ ] **Step 1: 在 frontend-api-wiring.test.cjs 加测试**

在文件末尾追加：

```javascript
test('HomePage fetches drama list from API instead of hardcoded data', () => {
  const source = read('src/components/HomePage.tsx');
  assert.match(source, /\/api\/dramas/, 'should fetch from /api/dramas');
  assert.doesNotMatch(source, /const heroDramas.*=.*\[[\s\S]*?\]/, 'should not have hardcoded heroDramas array');
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
node --test test/frontend-api-wiring.test.cjs 2>&1 | tail -20
```

Expected: 新测试 FAIL

- [ ] **Step 3: 重写 HomePage.tsx**

用以下内容完整替换 `src/components/HomePage.tsx`：

```tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { tokens } from './episode-detail/tokens';
import { apiGet } from '../lib/api/client';
import type { ApiDrama } from '../types/drama';
import type { Drama } from '../types/drama';

// ── Icons ────────────────────────────────────────────────────────
const PlayIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
);
const ChevronLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const ChevronRightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
const ViewAllIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

function apiDramaToLegacy(d: ApiDrama): Drama {
  return {
    id: d.id,
    title: d.title,
    totalEpisodes: d.totalEpisodes,
    episodeDuration: 0,
    year: new Date().getFullYear(),
    genres: d.genreNames,
    description: d.synopsis ?? '',
    coverUrl: d.coverUrl,
    isVip: d.releaseStatus === 'released',
  };
}

const HomePage: React.FC = () => {
  const { user, navigateTo, openModal } = useApp();
  const [dramas, setDramas] = useState<ApiDrama[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    apiGet<{ dramas: ApiDrama[] }>('/api/dramas')
      .then((data) => setDramas(data.dramas))
      .catch(() => {/* keep empty */})
      .finally(() => setLoading(false));
  }, []);

  const heroDramas = dramas.filter((d) => d.releaseStatus === 'released');
  const hero = heroDramas[heroIndex] ?? null;

  const goTo = useCallback((idx: number) => {
    if (isTransitioning || heroDramas.length === 0) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setHeroIndex(idx);
      setIsTransitioning(false);
    }, 300);
  }, [isTransitioning, heroDramas.length]);

  const prev = () => goTo((heroIndex - 1 + heroDramas.length) % heroDramas.length);
  const next = useCallback(() => goTo((heroIndex + 1) % heroDramas.length), [goTo, heroIndex, heroDramas.length]);

  useEffect(() => {
    if (heroDramas.length < 2) return;
    const id = setInterval(next, 6000);
    return () => clearInterval(id);
  }, [next, heroDramas.length]);

  const handlePlayDrama = (drama: ApiDrama) => {
    if (drama.releaseStatus !== 'released') return;
    if (!user) { openModal('login'); return; }
    if (!user.isVip) { openModal('vip'); return; }
    navigateTo('episode-detail', apiDramaToLegacy(drama));
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#1a140f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: tokens.fontBody, fontSize: 14, color: tokens.textMuted, letterSpacing: '0.1em' }}>加载中…</span>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#1a140f' }}>

      {/* ── Hero ─────────────────────────────────────────── */}
      {hero && (
        <section style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>

          {/* Background: 横版封面图 */}
          <div style={{
            position: 'absolute', inset: 0,
            opacity: isTransitioning ? 0 : 1,
            transition: 'opacity 0.5s ease',
          }}>
            {hero.posterUrl ? (
              <img
                src={hero.posterUrl}
                alt={hero.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #2a1a10 0%, #5c3d28 100%)' }} />
            )}
            {/* Left gradient for text readability */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to right, rgba(12,8,4,0.92) 0%, rgba(12,8,4,0.65) 40%, rgba(12,8,4,0.15) 70%, transparent 100%)',
            }} />
            {/* Bottom fade */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: '35%',
              background: 'linear-gradient(to top, #1a140f 0%, transparent 100%)',
            }} />
          </div>

          {/* Content */}
          <div style={{
            position: 'absolute', left: 72, bottom: 120,
            opacity: isTransitioning ? 0 : 1,
            transform: isTransitioning ? 'translateY(12px)' : 'translateY(0)',
            transition: 'opacity 0.4s ease, transform 0.4s ease',
            maxWidth: 560,
          }}>
            {hero.subtitle && (
              <div style={{ fontFamily: tokens.fontBody, fontSize: 13, color: 'rgba(240,237,232,0.55)', letterSpacing: '0.28em', marginBottom: 12, fontWeight: 300 }}>
                {hero.subtitle}
              </div>
            )}
            <h1 style={{ fontFamily: tokens.fontDisplay, fontWeight: 400, fontSize: 'clamp(60px, 7vw, 96px)', color: tokens.textPrimary, letterSpacing: '0.04em', lineHeight: 1.05, margin: '0 0 18px', textShadow: '0 4px 32px rgba(0,0,0,0.5)' }}>
              {hero.title}
            </h1>
            {hero.genreNames.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: tokens.fontBody, fontSize: 13, color: 'rgba(240,237,232,0.6)', letterSpacing: '0.1em', marginBottom: 16 }}>
                {hero.genreNames.map((g, i) => (
                  <React.Fragment key={g}>
                    {i > 0 && <span style={{ color: 'rgba(240,237,232,0.25)', fontSize: 10 }}>/</span>}
                    <span>{g}</span>
                  </React.Fragment>
                ))}
              </div>
            )}
            {hero.synopsis && (
              <p style={{ fontFamily: tokens.fontBody, fontSize: 13, lineHeight: 1.9, color: 'rgba(240,237,232,0.55)', fontWeight: 300, letterSpacing: '0.04em', marginBottom: 32, maxWidth: 420 }}>
                {hero.synopsis.length > 80 ? hero.synopsis.slice(0, 80) + '…' : hero.synopsis}
              </p>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <button
                onClick={() => handlePlayDrama(hero)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'linear-gradient(135deg, #C9912A, #d8a24d)', border: 'none', borderRadius: 24, color: '#1a0f00', cursor: 'pointer', fontFamily: tokens.fontDisplay, fontSize: 15, letterSpacing: '0.12em', padding: '13px 28px', transition: 'transform 0.2s ease, box-shadow 0.2s ease', boxShadow: '0 8px 24px rgba(201,145,42,0.3)' }}
              >
                <PlayIcon /> 立即观看
              </button>
              <button
                onClick={() => navigateTo('episode-detail', apiDramaToLegacy(hero))}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(240,237,232,0.08)', border: '1px solid rgba(240,237,232,0.22)', borderRadius: 24, color: tokens.textPrimary, cursor: 'pointer', fontFamily: tokens.fontBody, fontSize: 13, letterSpacing: '0.1em', padding: '12px 22px', backdropFilter: 'blur(4px)', transition: 'background 0.2s ease, border-color 0.2s ease' }}
              >
                查看详情
              </button>
            </div>
          </div>

          {/* Arrow controls */}
          {heroDramas.length > 1 && (
            <>
              <button onClick={prev} style={{ ...arrowBtnStyle, left: 20 }}><ChevronLeftIcon /></button>
              <button onClick={next} style={{ ...arrowBtnStyle, right: 20 }}><ChevronRightIcon /></button>
            </>
          )}

          {/* Dots */}
          {heroDramas.length > 1 && (
            <div style={{ position: 'absolute', bottom: 70, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8 }}>
              {heroDramas.map((_, i) => (
                <button key={i} onClick={() => goTo(i)} style={{ width: i === heroIndex ? 24 : 8, height: 4, borderRadius: 2, border: 'none', background: i === heroIndex ? tokens.accentGold : 'rgba(240,237,232,0.3)', cursor: 'pointer', padding: 0, transition: 'width 0.3s ease, background 0.3s ease' }} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Hot Recommendations ──────────────────────────── */}
      <section style={{ padding: '48px 60px 80px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontFamily: tokens.fontCormorant, fontSize: 18, fontWeight: 500, color: tokens.accentGold, letterSpacing: '0.2em', margin: 0 }}>
            热门推荐
          </h2>
          <button style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: tokens.textMuted, cursor: 'pointer', fontFamily: tokens.fontBody, fontSize: 12, letterSpacing: '0.08em', padding: 0 }}>
            查看全部 <ViewAllIcon />
          </button>
        </div>
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {dramas.map((drama) => (
            <DramaCard key={drama.id} drama={drama} onPlay={handlePlayDrama} />
          ))}
        </div>
      </section>
    </div>
  );
};

// ── DramaCard ────────────────────────────────────────────────────
const DramaCard: React.FC<{ drama: ApiDrama; onPlay: (d: ApiDrama) => void }> = ({ drama, onPlay }) => {
  const [hovered, setHovered] = useState(false);
  const isReleased = drama.releaseStatus === 'released';

  return (
    <div
      onClick={() => isReleased && onPlay(drama)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ flex: '0 0 192px', cursor: isReleased ? 'pointer' : 'default', borderRadius: 4, overflow: 'hidden', border: `1px solid ${hovered && isReleased ? 'rgba(201,145,42,0.4)' : 'rgba(240,237,232,0.08)'}`, transform: hovered && isReleased ? 'translateY(-4px)' : 'translateY(0)', transition: 'all 0.3s ease', boxShadow: hovered && isReleased ? '0 12px 40px rgba(0,0,0,0.4)' : 'none' }}
    >
      {/* Cover */}
      <div style={{ aspectRatio: '2/3', position: 'relative', background: 'linear-gradient(135deg, #2a1a10, #4a2d1a)' }}>
        {drama.coverUrl ? (
          <img src={drama.coverUrl} alt={drama.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: tokens.fontDisplay, fontSize: 22, color: 'rgba(240,237,232,0.7)', textAlign: 'center', padding: '0 12px' }}>{drama.title}</span>
          </div>
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(8,5,2,0.9) 0%, transparent 50%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 10px 12px' }}>
          <div style={{ fontFamily: tokens.fontDisplay, fontSize: 15, color: tokens.textPrimary, letterSpacing: '0.08em' }}>{drama.title}</div>
        </div>
      </div>

      {/* Status */}
      <div style={{ background: '#1a140f', padding: '8px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: tokens.fontBody, fontSize: 10, letterSpacing: '0.06em', color: isReleased ? tokens.accentGold : tokens.textMuted }}>
          {isReleased ? '已上线' : '即将上线'}
        </span>
        {isReleased && (
          <span style={{ fontFamily: tokens.fontBody, fontSize: 10, letterSpacing: '0.06em', color: tokens.textMuted }}>立即观看 →</span>
        )}
        {!isReleased && (
          <span style={{ fontFamily: tokens.fontBody, fontSize: 10, letterSpacing: '0.06em', color: tokens.textMuted }}>敬请期待</span>
        )}
      </div>
    </div>
  );
};

const arrowBtnStyle: React.CSSProperties = {
  position: 'absolute', top: '50%', transform: 'translateY(-50%)',
  width: 44, height: 44, borderRadius: '50%',
  background: 'rgba(240,237,232,0.08)', border: '1px solid rgba(240,237,232,0.15)',
  color: tokens.textMuted, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  backdropFilter: 'blur(4px)', zIndex: 10,
  transition: 'background 0.2s ease, border-color 0.2s ease, color 0.2s ease',
};

export default HomePage;
```

- [ ] **Step 4: 运行测试**

```bash
node --test test/frontend-api-wiring.test.cjs 2>&1 | tail -20
```

Expected: 全部 PASS

- [ ] **Step 5: 提交**

```bash
git add src/components/HomePage.tsx test/frontend-api-wiring.test.cjs
git commit -m "feat: HomePage fetches drama list from API, drops mock data"
```

---

## Task 6: 更新 App.tsx 获取真实 cast 和 recommendations

**Files:**
- Modify: `src/App.tsx`
- Test: `test/frontend-api-wiring.test.cjs`

- [ ] **Step 1: 追加测试**

在 `test/frontend-api-wiring.test.cjs` 末尾追加：

```javascript
test('App fetches drama detail for cast and recommendations', () => {
  const source = read('src/App.tsx');
  assert.match(source, /\/api\/dramas/, 'App should fetch from /api/dramas');
  assert.doesNotMatch(source, /mockCast|mockRecommendations/, 'App should not use mock data');
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
node --test test/frontend-api-wiring.test.cjs 2>&1 | tail -20
```

Expected: 新测试 FAIL

- [ ] **Step 3: 更新 App.tsx**

用以下内容完整替换 `src/App.tsx`：

```tsx
import React, { useState, useEffect } from 'react';
import { useApp } from './context/AppContext';
import Navbar from './components/episode-detail/Navbar';
import HomePage from './components/HomePage';
import EpisodeDetailPage from './components/episode-detail';
import AboutPage from './components/pages/AboutPage';
import BusinessPage from './components/pages/BusinessPage';
import ContactPage from './components/pages/ContactPage';
import LoginModal from './components/LoginModal';
import VipModal from './components/VipModal';
import PaymentModal from './components/PaymentModal';
import { apiGet } from './lib/api/client';
import type { CastMember, RecommendedDrama } from './types/drama';
import type { ApiDramaDetail } from './types/drama';

interface DramaDetailState {
  cast: CastMember[];
  recommendations: RecommendedDrama[];
}

const AppContent: React.FC = () => {
  const { page, modal, selectedDrama } = useApp();
  const [dramaDetail, setDramaDetail] = useState<DramaDetailState | null>(null);

  useEffect(() => {
    if (page !== 'episode-detail' || !selectedDrama) {
      setDramaDetail(null);
      return;
    }

    let cancelled = false;

    apiGet<{ drama: ApiDramaDetail }>(`/api/dramas/${encodeURIComponent(selectedDrama.id)}`)
      .then((data) => {
        if (cancelled) return;
        setDramaDetail({
          cast: data.drama.cast.map((c) => ({
            id: c.id,
            name: c.name,
            role: c.roleName ?? '',
            avatarUrl: c.avatarUrl ?? '',
            characterRole: '主演',
          })),
          recommendations: data.drama.recommendations.map((r) => ({
            id: r.id,
            title: r.title,
            coverUrl: r.coverUrl,
          })),
        });
      })
      .catch(() => {
        if (!cancelled) setDramaDetail({ cast: [], recommendations: [] });
      });

    return () => { cancelled = true; };
  }, [page, selectedDrama?.id]);

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />

      {page === 'home' && <HomePage />}
      {page === 'about' && <AboutPage />}
      {page === 'business' && <BusinessPage />}
      {page === 'contact' && <ContactPage />}
      {page === 'episode-detail' && selectedDrama && (
        <EpisodeDetailPage
          drama={selectedDrama}
          cast={dramaDetail?.cast ?? []}
          recommendations={dramaDetail?.recommendations ?? []}
          initialEpisode={1}
        />
      )}

      {modal === 'login' && <LoginModal />}
      {modal === 'vip' && <VipModal />}
      {modal === 'payment' && <PaymentModal />}
    </div>
  );
};

const App: React.FC = () => <AppContent />;

export default App;
```

- [ ] **Step 4: 运行全部测试**

```bash
node --test test/*.test.cjs 2>&1 | tail -30
```

Expected: 全部 PASS

- [ ] **Step 5: 提交**

```bash
git add src/App.tsx test/frontend-api-wiring.test.cjs
git commit -m "feat: App fetches real cast and recommendations from API"
```

---

## 执行说明

```bash
# 本地上传 OSS（需提前 export 环境变量）
export OSS_REGION=xxx OSS_BUCKET=xxx OSS_ACCESS_KEY_ID=xxx OSS_ACCESS_KEY_SECRET=xxx
npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/upload-oss.ts

# 本地写入数据库
DATABASE_URL=mysql://... npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seed-dramas.ts

# 线上写入数据库（OSS 路径一致，只重新运行 seed）
DATABASE_URL=mysql://... npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seed-dramas.ts
```
