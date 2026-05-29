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
      bannerFile: 'poster1.jpg',
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
      bannerFile: 'cover-横板.png',
      episodeCount: 4,
      extraPosters: [] as string[],
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
      bannerFile: 'cover-横板.png',
      episodeCount: 2,
      extraPosters: [] as string[],
      hasTrailer: false,
      castFiles: [
        { local: '姜梨酒.png',           ossName: 'jiangliqiu.png' },
        { local: '仙尊：容清晏.png',     ossName: 'rong-qing-yan.png' },
        { local: '魔君：夜烬离.png',     ossName: 'ye-jin-li.png' },
        { local: '冷面仙君：玄寂尘.png', ossName: 'xuan-ji-chen.png' },
      ],
    },
  ];

  for (const drama of published) {
    const dramaDir = path.join(DRAMA_DIR, drama.dir);
    const prefix = `dramas/${drama.slug}`;
    const bannerExt = drama.bannerFile.split('.').pop() ?? 'jpg';

    entries.push({ localPath: path.join(dramaDir, `cover.${drama.coverExt}`), ossKey: `${prefix}/cover.${drama.coverExt}` });
    entries.push({ localPath: path.join(dramaDir, drama.bannerFile), ossKey: `${prefix}/poster.${bannerExt}` });

    for (const p of drama.extraPosters) {
      entries.push({ localPath: path.join(dramaDir, p), ossKey: `${prefix}/${p}` });
    }

    if (drama.hasTrailer) {
      entries.push({ localPath: path.join(dramaDir, 'trailer.mp4'), ossKey: `${prefix}/trailer.mp4` });
    }

    for (let i = 1; i <= drama.episodeCount; i++) {
      entries.push({ localPath: path.join(dramaDir, `${i}.mp4`), ossKey: `${prefix}/episodes/${i}.mp4` });
    }

    for (const c of drama.castFiles) {
      entries.push({ localPath: path.join(dramaDir, c.local), ossKey: `${prefix}/cast/${c.ossName}` });
    }
  }

  // ── Upcoming dramas ───────────────────────────────────────────
  const upcoming: Array<{ filename: string; ossKey: string }> = [
    { filename: '天台来信.jpg',            ossKey: 'dramas/upcoming/tian-tai-lai-xin.jpg' },
    { filename: '海上旧梦.jpg',            ossKey: 'dramas/upcoming/hai-shang-jiu-meng.jpg' },
    { filename: '港城无声.jpg',            ossKey: 'dramas/upcoming/gang-cheng-wu-sheng.jpg' },
    { filename: '第七码头.jpg',            ossKey: 'dramas/upcoming/di-qi-ma-tou.jpg' },
    { filename: '迷雾追凶.jpg',            ossKey: 'dramas/upcoming/mi-wu-zhui-xiong.jpg' },
    { filename: '长安夜雨.jpg',            ossKey: 'dramas/upcoming/chang-an-ye-yu.jpg' },
    { filename: '雪落关山.jpg',            ossKey: 'dramas/upcoming/xue-luo-guan-shan.jpg' },
    { filename: '真千金她不装了.jpg',      ossKey: 'dramas/upcoming/zhen-qian-jin-ta-bu-zhuang-le.jpg' },
    { filename: '闪婚后上司宠我入骨.jpg',  ossKey: 'dramas/upcoming/shan-hun-hou-shang-si-chong-wo-ru-gu.jpg' },
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
            // not found in OSS, proceed with upload
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
