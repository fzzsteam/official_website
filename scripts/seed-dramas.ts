import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });

// ── ID helpers ────────────────────────────────────────────────────
const did  = (n: number) => `00000000-0000-0000-0001-${String(n).padStart(12, '0')}`;
const epid = (d: number, e: number) => `00000000-0000-0000-0002-${String(d).padStart(6, '0')}${String(e).padStart(6, '0')}`;
const gid  = (n: number) => `00000000-0000-0000-0003-${String(n).padStart(12, '0')}`;
const cid  = (d: number, n: number) => `00000000-0000-0000-0004-${String(d).padStart(6, '0')}${String(n).padStart(6, '0')}`;
const rid  = (n: number) => `00000000-0000-0000-0005-${String(n).padStart(12, '0')}`;

// ── Helpers ───────────────────────────────────────────────────────
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

async function upsertGenres(dramaId: string, genres: Array<{ id: string; code: string; name: string }>) {
  for (const g of genres) {
    await prisma.dramaGenre.upsert({
      where: { uk_drama_genres_drama_genre: { dramaId, genreCode: g.code } },
      create: { id: g.id, dramaId, genreCode: g.code, genreName: g.name },
      update: { genreName: g.name },
    });
  }
}

async function upsertEpisodes(dramaId: string, dramaIdx: number, ossPrefix: string, count: number) {
  for (let i = 1; i <= count; i++) {
    await prisma.episode.upsert({
      where: { uk_episodes_drama_episode: { dramaId, episodeNo: i } },
      create: {
        id: epid(dramaIdx, i),
        dramaId,
        episodeNo: i,
        title: `第${i}集`,
        videoPath: `${ossPrefix}/episodes/${i}.mp4`,
        durationSeconds: 0,
        accessLevel: 'member',
        status: 'published',
        publishedAt: new Date('2025-03-01'),
      },
      update: {
        title: `第${i}集`,
        videoPath: `${ossPrefix}/episodes/${i}.mp4`,
        accessLevel: 'member',
        status: 'published',
      },
    });
  }
}

// ── Main ──────────────────────────────────────────────────────────
async function main() {

  // ── 1. 疯狂的荔枝 ────────────────────────────────────────────
  const slug1 = 'feng-kuang-de-lizhi';
  const prefix1 = `dramas/${slug1}`;
  await upsertDrama({
    id: did(1), slug: slug1, title: '疯狂的荔枝',
    subtitle: '一颗荔枝 · 一场传奇',
    synopsis: '大唐盛世，岭南荔枝声名远播。御史柳承业奉命押送一批珍贵荔枝进京，不料途中遭遇奇人异事，一颗小小的荔枝竟牵动出一段啼笑皆非的江湖恩怨。书生石头、侠女苏凌薇、神秘客秦烈，各怀心事，命运交织。荔枝传情，笑中有泪，疯狂之中自有真情。',
    coverPath: `${prefix1}/cover.jpg`,
    posterPath: `${prefix1}/poster.jpg`,
    trailerPath: `${prefix1}/trailer.mp4`,
    status: 'published', releaseStatus: 'released',
    publishedAt: new Date('2025-03-01'), sortOrder: 1,
  });
  await upsertGenres(did(1), [
    { id: gid(1), code: 'costume', name: '古装' },
    { id: gid(2), code: 'comedy',  name: '喜剧' },
  ]);
  await upsertEpisodes(did(1), 1, prefix1, 10);
  for (const c of [
    { n: 1, name: '柳承业', role: '御史',   avatar: 'liuchengye.jpg' },
    { n: 2, name: '苏凌薇', role: '侠女',   avatar: 'sulingwei.jpg' },
    { n: 3, name: '秦烈',   role: '神秘客', avatar: 'qinlie.jpg' },
    { n: 4, name: '石头',   role: '书生',   avatar: 'shitou.jpg' },
    { n: 5, name: '沈默',   role: '暗卫',   avatar: 'shenmo.jpg' },
  ]) {
    await prisma.castMember.upsert({
      where: { id: cid(1, c.n) },
      create: { id: cid(1, c.n), dramaId: did(1), name: c.name, roleName: c.role, avatarPath: `${prefix1}/cast/${c.avatar}`, sortOrder: c.n },
      update: { name: c.name, roleName: c.role, avatarPath: `${prefix1}/cast/${c.avatar}`, sortOrder: c.n },
    });
  }

  // ── 2. 周道与诸葛浪 ──────────────────────────────────────────
  const slug2 = 'zhou-dao-yu-zhuge-lang';
  const prefix2 = `dramas/${slug2}`;
  await upsertDrama({
    id: did(2), slug: slug2, title: '周道与诸葛浪',
    subtitle: '乱世情，江湖缘',
    synopsis: '落魄举子周道一朝遭奸人陷害，流落江湖。偶遇出身名门却不羁江湖的诸葛浪，两人性情相悖，却在一次次磕磕绊绊中渐生情愫。命运弄人，恩怨交织，一段乱世儿女情跃然而出。',
    coverPath: `${prefix2}/cover.png`,
    posterPath: `${prefix2}/poster.png`,
    status: 'published', releaseStatus: 'released',
    publishedAt: new Date('2025-04-01'), sortOrder: 2,
  });
  await upsertGenres(did(2), [
    { id: gid(3), code: 'costume', name: '古装' },
    { id: gid(4), code: 'romance', name: '爱情' },
  ]);
  await upsertEpisodes(did(2), 2, prefix2, 4);
  for (const c of [
    { n: 1, name: '周道',   role: '落魄举子', avatar: 'zhoudao.png' },
    { n: 2, name: '诸葛浪', role: '名门侠女', avatar: 'zhugelan.png' },
  ]) {
    await prisma.castMember.upsert({
      where: { id: cid(2, c.n) },
      create: { id: cid(2, c.n), dramaId: did(2), name: c.name, roleName: c.role, avatarPath: `${prefix2}/cast/${c.avatar}`, sortOrder: c.n },
      update: { name: c.name, roleName: c.role, avatarPath: `${prefix2}/cast/${c.avatar}`, sortOrder: c.n },
    });
  }

  // ── 3. 醉后撩到冷面仙君 ──────────────────────────────────────
  const slug3 = 'zui-hou-liao-dao-leng-mian-xian-jun';
  const prefix3 = `dramas/${slug3}`;
  await upsertDrama({
    id: did(3), slug: slug3, title: '醉后撩到冷面仙君',
    subtitle: '一醉误撩，千年禁忌',
    synopsis: '仙界第一冷面战神闻清辞，端方肃穆，百年未逾矩。直到一夜误饮忘情酒，被凡间莽撞女子姜梨酒撞个正着。女子醉话连篇，句句撩动禁地，仙君从此破了清规，破了戒，也破了心。',
    coverPath: `${prefix3}/cover.png`,
    posterPath: `${prefix3}/poster.png`,
    status: 'published', releaseStatus: 'released',
    publishedAt: new Date('2025-05-01'), sortOrder: 3,
  });
  await upsertGenres(did(3), [
    { id: gid(5), code: 'xianxia', name: '仙侠' },
    { id: gid(6), code: 'romance', name: '爱情' },
  ]);
  await upsertEpisodes(did(3), 3, prefix3, 2);
  for (const c of [
    { n: 1, name: '姜梨酒', role: '凡间女子', avatar: 'jiangliqiu.png' },
    { n: 2, name: '玄寂尘', role: '冷面仙君', avatar: 'xuan-ji-chen.png' },
    { n: 3, name: '容清晏', role: '仙尊',     avatar: 'rong-qing-yan.png' },
    { n: 4, name: '夜烬离', role: '魔君',     avatar: 'ye-jin-li.png' },
  ]) {
    await prisma.castMember.upsert({
      where: { id: cid(3, c.n) },
      create: { id: cid(3, c.n), dramaId: did(3), name: c.name, roleName: c.role, avatarPath: `${prefix3}/cast/${c.avatar}`, sortOrder: c.n },
      update: { name: c.name, roleName: c.role, avatarPath: `${prefix3}/cast/${c.avatar}`, sortOrder: c.n },
    });
  }

  // ── Upcoming dramas ───────────────────────────────────────────
  const upcoming = [
    { n: 101, slug: 'tian-tai-lai-xin',                    title: '天台来信',          subtitle: '误投的信，命定的缘',     synopsis: '一封误投的信，一段跨越二十年的回忆。城市喧嚣中，两个陌生人在天台偶然相遇，信封里藏着的秘密，悄悄牵动着彼此的命运。',           cover: 'dramas/upcoming/tian-tai-lai-xin.jpg',                    genres: [{ id: gid(7),  code: 'urban',    name: '都市' }, { id: gid(8),  code: 'romance',  name: '爱情' }], sortOrder: 101 },
    { n: 102, slug: 'hai-shang-jiu-meng',                  title: '海上旧梦',          subtitle: '那片海，那段未说出口的爱', synopsis: '远洋渔船失事后，唯一的幸存者带着一段残缺的记忆上岸。那片海，那艘船，那段来不及说出口的爱……往事如浪，翻涌不休。',             cover: 'dramas/upcoming/hai-shang-jiu-meng.jpg',                  genres: [{ id: gid(9),  code: 'suspense', name: '悬疑' }, { id: gid(10), code: 'romance',  name: '爱情' }], sortOrder: 102 },
    { n: 103, slug: 'gang-cheng-wu-sheng',                 title: '港城无声',          subtitle: '用眼睛读懂听不见的真相', synopsis: '南方港口，无声的城市暗流涌动。一名失聪的翻译官意外卷入跨国走私案，用眼睛读懂了别人听不见的真相。',                             cover: 'dramas/upcoming/gang-cheng-wu-sheng.jpg',                 genres: [{ id: gid(11), code: 'suspense', name: '悬疑' }, { id: gid(12), code: 'urban',    name: '都市' }], sortOrder: 103 },
    { n: 104, slug: 'di-qi-ma-tou',                        title: '第七码头',          subtitle: '二十年前被封存的秘密',   synopsis: '第七号码头，一个二十年前被封存的秘密。年轻警探只身入局，却发现真相远比想象中复杂，而危险也比想象中更近。',                       cover: 'dramas/upcoming/di-qi-ma-tou.jpg',                        genres: [{ id: gid(13), code: 'suspense', name: '悬疑' }, { id: gid(14), code: 'thriller', name: '惊悚' }], sortOrder: 104 },
    { n: 105, slug: 'mi-wu-zhui-xiong',                    title: '迷雾追凶',          subtitle: '雾散之日，真相浮现',     synopsis: '山中小镇接连发生离奇失踪案。刑警赵霁独自深入，在经年浓雾中追踪恶意的痕迹，每一步都走在生死边缘。',                             cover: 'dramas/upcoming/mi-wu-zhui-xiong.jpg',                    genres: [{ id: gid(15), code: 'suspense', name: '悬疑' }, { id: gid(16), code: 'thriller', name: '惊悚' }], sortOrder: 105 },
    { n: 106, slug: 'chang-an-ye-yu',                      title: '长安夜雨',          subtitle: '雨停之日，命运已变',     synopsis: '长安城一场突如其来的夜雨，将两个身份迥异的人困在同一间客栈。雨停之日，命运已悄然改变。',                                         cover: 'dramas/upcoming/chang-an-ye-yu.jpg',                      genres: [{ id: gid(17), code: 'costume',  name: '古装' }, { id: gid(18), code: 'romance',  name: '爱情' }], sortOrder: 106 },
    { n: 107, slug: 'xue-luo-guan-shan',                   title: '雪落关山',          subtitle: '最后一战前的迟来信',     synopsis: '大雪封山，关外铁骑压境。守城将领萧寒在最后一战前，收到了那封迟来十年的信。',                                                   cover: 'dramas/upcoming/xue-luo-guan-shan.jpg',                   genres: [{ id: gid(19), code: 'costume',  name: '古装' }, { id: gid(20), code: 'war',      name: '战争' }], sortOrder: 107 },
    { n: 108, slug: 'zhen-qian-jin-ta-bu-zhuang-le',       title: '真千金她不装了',    subtitle: '撕下伪装，步步为营',     synopsis: '被错换身份的真千金，在家族恩怨与豪门博弈中步步为营。当她选择撕下伪装，所有人才发现，她从未是那个软弱的棋子。',                   cover: 'dramas/upcoming/zhen-qian-jin-ta-bu-zhuang-le.jpg',       genres: [{ id: gid(21), code: 'urban',    name: '都市' }, { id: gid(22), code: 'romance',  name: '爱情' }], sortOrder: 108 },
    { n: 109, slug: 'shan-hun-hou-shang-si-chong-wo-ru-gu', title: '闪婚后上司宠我入骨', subtitle: '协议闪婚，宠入骨髓',   synopsis: '一纸协议闪婚，对象竟是职场冷面上司。婚后相处，外冷内热的他步步为营，将她宠进骨子里，再也不想放手。',                           cover: 'dramas/upcoming/shan-hun-hou-shang-si-chong-wo-ru-gu.jpg', genres: [{ id: gid(23), code: 'urban',    name: '都市' }, { id: gid(24), code: 'romance',  name: '爱情' }], sortOrder: 109 },
  ];

  for (const u of upcoming) {
    await upsertDrama({
      id: did(u.n), slug: u.slug, title: u.title, subtitle: u.subtitle, synopsis: u.synopsis,
      coverPath: u.cover, status: 'published', releaseStatus: 'upcoming',
      publishedAt: null, sortOrder: u.sortOrder,
    });
    await upsertGenres(did(u.n), u.genres);
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
