import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import bcrypt from 'bcryptjs';

function loadEnvFile(filePath: string) {
  const abs = resolve(process.cwd(), filePath);
  if (!existsSync(abs)) return;
  for (const line of readFileSync(abs, 'utf-8').split('\n')) {
    const trimmed = line.split('#')[0].trim();
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (key && !process.env[key]) process.env[key] = val;
  }
}
loadEnvFile('.env.local');
loadEnvFile('.env');

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

const DEFAULT_ADMIN_ID = '00000000-0000-4000-8000-000000000001';

async function hashAdminPassword(password: string) {
  return bcrypt.hash(password, 10);
}

async function main() {
  // ── 默认管理员账号 ────────────────────────────────────────────
  const defaultAdminPhone = process.env.DEFAULT_ADMIN_PHONE || '13800000000';
  const defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin123456';
  const defaultAdminDisplayName = process.env.DEFAULT_ADMIN_DISPLAY_NAME || '系统管理员';
  const defaultAdminPasswordHash = await hashAdminPassword(defaultAdminPassword);

  await prisma.adminUser.upsert({
    where: { id: DEFAULT_ADMIN_ID },
    create: {
      id: DEFAULT_ADMIN_ID,
      phone: defaultAdminPhone,
      passwordHash: defaultAdminPasswordHash,
      role: 'admin',
      displayName: defaultAdminDisplayName,
      status: 'active',
    },
    update: {
      displayName: defaultAdminDisplayName,
      role: 'admin',
      status: 'active',
    },
  });

  // ── 会员套餐 ──────────────────────────────────────────────────
  await prisma.membershipPlan.upsert({
    where: { code: '30d' },
    create: { id: '3e1ca806-9bff-450c-8726-eee647287104', code: '30d',  name: '30天会员',  durationDays: 30,  priceCents: 2990,  enabled: true, sortOrder: 1, description: '30天会员套餐' },
    update: { name: '30天会员',  durationDays: 30,  priceCents: 2990,  enabled: true, sortOrder: 1, description: '30天会员套餐' },
  });
  await prisma.membershipPlan.upsert({
    where: { code: '365d' },
    create: { id: '6e39df5a-9a4f-4176-993f-51ef47540c28', code: '365d', name: '365天会员', durationDays: 365, priceCents: 19900, enabled: true, sortOrder: 2, description: '365天会员套餐' },
    update: { name: '365天会员', durationDays: 365, priceCents: 19900, enabled: true, sortOrder: 2, description: '365天会员套餐' },
  });

  // ── 1. 疯狂的荔枝 ────────────────────────────────────────────
  const d1 = '72e948fd-e0e1-4dab-ac14-0808ce283e5e';
  const p1 = `dramas/feng-kuang-de-lizhi`;
  await prisma.drama.upsert({
    where: { slug: 'feng-kuang-de-lizhi' },
    create: { id: d1, slug: 'feng-kuang-de-lizhi', title: '疯狂的荔枝', subtitle: '一颗荔枝 · 一场传奇', synopsis: '大唐盛世，岭南荔枝声名远播。御史柳承业奉命押送一批珍贵荔枝进京，不料途中遭遇奇人异事，一颗小小的荔枝竟牵动出一段啼笑皆非的江湖恩怨。书生石头、侠女苏凌薇、神秘客秦烈，各怀心事，命运交织。荔枝传情，笑中有泪，疯狂之中自有真情。', coverPath: `${p1}/poster.jpg`, posterPath: `${p1}/cover.jpg`, trailerPath: `${p1}/trailer.mp4`, status: 'published', releaseStatus: 'released', publishedAt: new Date('2025-03-01'), sortOrder: 1, ownerType: 'admin', ownerAdminUserId: DEFAULT_ADMIN_ID, reviewStatus: 'approved', reviewedByAdminUserId: DEFAULT_ADMIN_ID, reviewedAt: new Date() },
    update: { coverPath: `${p1}/poster.jpg`, posterPath: `${p1}/cover.jpg`, trailerPath: `${p1}/trailer.mp4`, ownerType: 'admin', ownerAdminUserId: DEFAULT_ADMIN_ID, reviewStatus: 'approved' },
  });
  for (const [id, code, name] of [['bad5b61b-cc01-494a-b1f8-f240b7467e5b','costume','古装'],['58a24916-e26a-4f82-ac04-b449318e816b','comedy','喜剧']] as const) {
    await prisma.dramaGenre.upsert({ where: { uk_drama_genres_drama_genre: { dramaId: d1, genreCode: code } }, create: { id, dramaId: d1, genreCode: code, genreName: name }, update: { genreName: name } });
  }
  for (const [id, no, path] of [
    ['5baaef6e-59c3-4557-b945-45818904616b', 1,  `${p1}/episodes/1.mp4`],
    ['9473cf62-af7a-4285-83c0-dc981b32e10c', 2,  `${p1}/episodes/2.mp4`],
    ['7c5ad9a4-4f01-4e24-a653-f0d29466c1a4', 3,  `${p1}/episodes/3.mp4`],
    ['0a4d091c-2e2d-422c-8968-f0883e957110', 4,  `${p1}/episodes/4.mp4`],
    ['a7eb4ad7-b947-468b-b586-72ac45e2ae1f', 5,  `${p1}/episodes/5.mp4`],
    ['d42a904d-559b-4e79-848f-cdf0bf0b4f15', 6,  `${p1}/episodes/6.mp4`],
    ['0f509919-8cae-400c-adf6-27cbbd41715c', 7,  `${p1}/episodes/7.mp4`],
    ['d0d61b77-3d23-498b-8e2f-d42a907b56c0', 8,  `${p1}/episodes/8.mp4`],
    ['2358bdce-e33e-4b5f-8a14-bb8dff03fded', 9,  `${p1}/episodes/9.mp4`],
    ['bece023c-4986-476a-a317-8d14e7e277cd', 10, `${p1}/episodes/10.mp4`],
  ] as const) {
    await prisma.episode.upsert({ where: { uk_episodes_drama_episode: { dramaId: d1, episodeNo: no } }, create: { id, dramaId: d1, episodeNo: no, title: `第${no}集`, videoPath: path, durationSeconds: 0, accessLevel: 'member', status: 'published', publishedAt: new Date('2025-03-01') }, update: { videoPath: path } });
  }
  for (const [id, name, role, avatar] of [
    ['4c9230e6-f8b1-439c-85ca-9afc62323696', '柳承业', '御史',   `${p1}/cast/liuchengye.jpg`],
    ['63b1a506-6a7f-46c9-bb4c-790148acb8f7', '苏凌薇', '侠女',   `${p1}/cast/sulingwei.jpg`],
    ['149097b0-06ba-487f-bfe0-db98ce681529', '秦烈',   '神秘客', `${p1}/cast/qinlie.jpg`],
    ['7ee00b91-c622-4323-9a39-65797f33f121', '石头',   '书生',   `${p1}/cast/shitou.jpg`],
    ['12281265-1d88-4e7a-ac30-df65f7936334', '沈默',   '暗卫',   `${p1}/cast/shenmo.jpg`],
  ] as const) {
    await prisma.castMember.upsert({ where: { id }, create: { id, dramaId: d1, name, roleName: role, avatarPath: avatar, sortOrder: ['4c9230e6-f8b1-439c-85ca-9afc62323696','63b1a506-6a7f-46c9-bb4c-790148acb8f7','149097b0-06ba-487f-bfe0-db98ce681529','7ee00b91-c622-4323-9a39-65797f33f121','12281265-1d88-4e7a-ac30-df65f7936334'].indexOf(id)+1 }, update: { avatarPath: avatar } });
  }

  // ── 2. 周道与诸葛浪 ──────────────────────────────────────────
  const d2 = '34e2714b-4a71-4f69-ad09-299c5b8d619a';
  const p2 = `dramas/zhou-dao-yu-zhuge-lang`;
  await prisma.drama.upsert({
    where: { slug: 'zhou-dao-yu-zhuge-lang' },
    create: { id: d2, slug: 'zhou-dao-yu-zhuge-lang', title: '周道与诸葛浪', subtitle: '乱世情，江湖缘', synopsis: '落魄举子周道一朝遭奸人陷害，流落江湖。偶遇出身名门却不羁江湖的诸葛浪，两人性情相悖，却在一次次磕磕绊绊中渐生情愫。命运弄人，恩怨交织，一段乱世儿女情跃然而出。', coverPath: `${p2}/cover.png`, posterPath: `${p2}/poster.png`, status: 'published', releaseStatus: 'released', publishedAt: new Date('2025-04-01'), sortOrder: 2, ownerType: 'admin', ownerAdminUserId: DEFAULT_ADMIN_ID, reviewStatus: 'approved', reviewedByAdminUserId: DEFAULT_ADMIN_ID, reviewedAt: new Date() },
    update: { coverPath: `${p2}/cover.png`, posterPath: `${p2}/poster.png`, ownerType: 'admin', ownerAdminUserId: DEFAULT_ADMIN_ID, reviewStatus: 'approved' },
  });
  for (const [id, code, name] of [['7943dcd5-59b7-4741-8b8d-058ed42155c8','costume','古装'],['c32cf5be-c653-4cc9-a838-43ec90fe1ee6','romance','爱情']] as const) {
    await prisma.dramaGenre.upsert({ where: { uk_drama_genres_drama_genre: { dramaId: d2, genreCode: code } }, create: { id, dramaId: d2, genreCode: code, genreName: name }, update: { genreName: name } });
  }
  for (const [id, no, path] of [
    ['b8b0ba29-190c-4521-81fb-fa844e75f0f2', 1, `${p2}/episodes/1.mp4`],
    ['46665e3c-bdac-42e9-babf-c9fcc624cfca', 2, `${p2}/episodes/2.mp4`],
    ['ba4294f9-7937-4d93-816c-fe483d4446f9', 3, `${p2}/episodes/3.mp4`],
    ['8255b847-f4b5-4f07-a1cc-bf0418bf705d', 4, `${p2}/episodes/4.mp4`],
  ] as const) {
    await prisma.episode.upsert({ where: { uk_episodes_drama_episode: { dramaId: d2, episodeNo: no } }, create: { id, dramaId: d2, episodeNo: no, title: `第${no}集`, videoPath: path, durationSeconds: 0, accessLevel: 'member', status: 'published', publishedAt: new Date('2025-04-01') }, update: { videoPath: path } });
  }
  for (const [id, no, name, role, avatar] of [
    ['d4f1bad6-c835-4569-a5b9-e5304b6b3405', 1, '周道',   '落魄举子', `${p2}/cast/zhoudao.png`],
    ['293f8cea-ad67-498e-aca4-24d2717f1ae1', 2, '诸葛浪', '名门侠女', `${p2}/cast/zhugelan.png`],
  ] as const) {
    await prisma.castMember.upsert({ where: { id }, create: { id, dramaId: d2, name, roleName: role, avatarPath: avatar, sortOrder: no }, update: { avatarPath: avatar } });
  }

  // ── 3. 醉后撩到冷面仙君 ──────────────────────────────────────
  const d3 = 'd17ed999-f922-4482-8d81-d705ed9fe33f';
  const p3 = `dramas/zui-hou-liao-dao-leng-mian-xian-jun`;
  await prisma.drama.upsert({
    where: { slug: 'zui-hou-liao-dao-leng-mian-xian-jun' },
    create: { id: d3, slug: 'zui-hou-liao-dao-leng-mian-xian-jun', title: '醉后撩到冷面仙君', subtitle: '一醉误撩，千年禁忌', synopsis: '仙界第一冷面战神闻清辞，端方肃穆，百年未逾矩。直到一夜误饮忘情酒，被凡间莽撞女子姜梨酒撞个正着。女子醉话连篇，句句撩动禁地，仙君从此破了清规，破了戒，也破了心。', coverPath: `${p3}/cover.png`, posterPath: `${p3}/poster.png`, status: 'published', releaseStatus: 'released', publishedAt: new Date('2025-05-01'), sortOrder: 3, ownerType: 'admin', ownerAdminUserId: DEFAULT_ADMIN_ID, reviewStatus: 'approved', reviewedByAdminUserId: DEFAULT_ADMIN_ID, reviewedAt: new Date() },
    update: { coverPath: `${p3}/cover.png`, posterPath: `${p3}/poster.png`, ownerType: 'admin', ownerAdminUserId: DEFAULT_ADMIN_ID, reviewStatus: 'approved' },
  });
  for (const [id, code, name] of [['8d184baf-805d-49bd-8e00-8ff231bc0786','xianxia','仙侠'],['66b71d32-1d92-4e66-bf5a-d0f222d1008e','romance','爱情']] as const) {
    await prisma.dramaGenre.upsert({ where: { uk_drama_genres_drama_genre: { dramaId: d3, genreCode: code } }, create: { id, dramaId: d3, genreCode: code, genreName: name }, update: { genreName: name } });
  }
  for (const [id, no, path] of [
    ['fb58c944-f996-4bf2-b435-6cb4779c8770', 1, `${p3}/episodes/1.mp4`],
    ['d0eef62d-3f80-418e-9755-18eede639736', 2, `${p3}/episodes/2.mp4`],
  ] as const) {
    await prisma.episode.upsert({ where: { uk_episodes_drama_episode: { dramaId: d3, episodeNo: no } }, create: { id, dramaId: d3, episodeNo: no, title: `第${no}集`, videoPath: path, durationSeconds: 0, accessLevel: 'member', status: 'published', publishedAt: new Date('2025-05-01') }, update: { videoPath: path } });
  }
  for (const [id, no, name, role, avatar] of [
    ['3a00c5ed-8cda-4a7a-8c2c-1d1d32026580', 1, '姜梨酒', '凡间女子', `${p3}/cast/jiangliqiu.png`],
    ['6c72efcb-4959-4e86-815d-5c9f3a20d1e7', 2, '玄寂尘', '冷面仙君', `${p3}/cast/xuan-ji-chen.png`],
    ['262fbcbd-0362-41cb-830f-58052df4f537', 3, '容清晏', '仙尊',     `${p3}/cast/rong-qing-yan.png`],
    ['f2788826-9329-4ed0-8483-ee5d478c964e', 4, '夜烬离', '魔君',     `${p3}/cast/ye-jin-li.png`],
  ] as const) {
    await prisma.castMember.upsert({ where: { id }, create: { id, dramaId: d3, name, roleName: role, avatarPath: avatar, sortOrder: no }, update: { avatarPath: avatar } });
  }

  // ── 即将上线 ──────────────────────────────────────────────────
  const upcoming = [
    { id: '483cc85e-69ab-4e3b-92be-ffb017f30d84', slug: 'tian-tai-lai-xin',                     title: '天台来信',           subtitle: '误投的信，命定的缘',       synopsis: '一封误投的信，一段跨越二十年的回忆。城市喧嚣中，两个陌生人在天台偶然相遇，信封里藏着的秘密，悄悄牵动着彼此的命运。',           cover: `dramas/upcoming/tian-tai-lai-xin.jpg`,                     sortOrder: 101, genres: [['d87e3cad-2811-43fc-88ea-0117e531a211','urban','都市'],  ['42ff71cb-778b-4ddf-bbb9-05a587def79f','romance','爱情']] },
    { id: '76718a6e-0e17-436d-9d4f-7dbae641582e', slug: 'hai-shang-jiu-meng',                   title: '海上旧梦',           subtitle: '那片海，那段未说出口的爱',  synopsis: '远洋渔船失事后，唯一的幸存者带着一段残缺的记忆上岸。那片海，那艘船，那段来不及说出口的爱……往事如浪，翻涌不休。',             cover: `dramas/upcoming/hai-shang-jiu-meng.jpg`,                   sortOrder: 102, genres: [['e7a7e26c-bf37-45e9-bbc6-90bb2adeeda8','suspense','悬疑'],['5d40256d-0274-41c5-aef7-baefd8d9d8c7','romance','爱情']] },
    { id: 'c2852159-338b-476e-aaf5-8e9745eb8799', slug: 'gang-cheng-wu-sheng',                  title: '港城无声',           subtitle: '用眼睛读懂听不见的真相',   synopsis: '南方港口，无声的城市暗流涌动。一名失聪的翻译官意外卷入跨国走私案，用眼睛读懂了别人听不见的真相。',                             cover: `dramas/upcoming/gang-cheng-wu-sheng.jpg`,                  sortOrder: 103, genres: [['acf788af-2252-4d6e-9c51-21d974a2fc73','suspense','悬疑'],['60ae4bc9-94bc-4ad4-921b-46d20ec3e72d','urban','都市']] },
    { id: 'bd8d649d-7cdd-40db-928c-c7bce0a07684', slug: 'di-qi-ma-tou',                         title: '第七码头',           subtitle: '二十年前被封存的秘密',     synopsis: '第七号码头，一个二十年前被封存的秘密。年轻警探只身入局，却发现真相远比想象中复杂，而危险也比想象中更近。',                       cover: `dramas/upcoming/di-qi-ma-tou.jpg`,                         sortOrder: 104, genres: [['a15660f0-a6a4-4586-9ccc-67bc3d3fce09','suspense','悬疑'],['e46eba65-cc6b-4c41-8dbb-e75bb295295c','thriller','惊悚']] },
    { id: '89a18f73-4fda-47f2-a399-9c5126dad2c6', slug: 'mi-wu-zhui-xiong',                     title: '迷雾追凶',           subtitle: '雾散之日，真相浮现',       synopsis: '山中小镇接连发生离奇失踪案。刑警赵霁独自深入，在经年浓雾中追踪恶意的痕迹，每一步都走在生死边缘。',                             cover: `dramas/upcoming/mi-wu-zhui-xiong.jpg`,                     sortOrder: 105, genres: [['e2b1c18f-da41-4b34-b6fd-9cc39c5b4dfc','suspense','悬疑'],['2df742a5-22c5-423c-8761-1478065cfb8c','thriller','惊悚']] },
    { id: 'cec37f01-52a5-44e1-ba92-3e76837653e7', slug: 'chang-an-ye-yu',                       title: '长安夜雨',           subtitle: '雨停之日，命运已变',       synopsis: '长安城一场突如其来的夜雨，将两个身份迥异的人困在同一间客栈。雨停之日，命运已悄然改变。',                                         cover: `dramas/upcoming/chang-an-ye-yu.jpg`,                       sortOrder: 106, genres: [['7a81bdc7-d154-4cd1-a43e-e6ff61190664','costume','古装'], ['af6a5f5b-e921-461c-a6a4-08da9f791b88','romance','爱情']] },
    { id: '264aed0e-b261-4335-b254-f51f57c68c03', slug: 'xue-luo-guan-shan',                    title: '雪落关山',           subtitle: '最后一战前的迟来信',       synopsis: '大雪封山，关外铁骑压境。守城将领萧寒在最后一战前，收到了那封迟来十年的信。',                                                   cover: `dramas/upcoming/xue-luo-guan-shan.jpg`,                    sortOrder: 107, genres: [['f0219475-d80b-4cd9-880b-c1f358e3409f','costume','古装'], ['c6cb010a-71c7-45d7-8f1f-eb6c85393bd0','war','战争']] },
    { id: '312303fb-56c5-4a8f-afe3-1670edc3bf37', slug: 'zhen-qian-jin-ta-bu-zhuang-le',        title: '真千金她不装了',     subtitle: '撕下伪装，步步为营',       synopsis: '被错换身份的真千金，在家族恩怨与豪门博弈中步步为营。当她选择撕下伪装，所有人才发现，她从未是那个软弱的棋子。',                   cover: `dramas/upcoming/zhen-qian-jin-ta-bu-zhuang-le.jpg`,        sortOrder: 108, genres: [['83aa55b6-7a45-4ba7-882e-d9de42759318','urban','都市'],  ['3c2da3a4-f6b1-4b99-8a37-dfe79bc3ec17','romance','爱情']] },
    { id: '633bc335-e82d-429b-a13a-e8c6056a4bdb', slug: 'shan-hun-hou-shang-si-chong-wo-ru-gu', title: '闪婚后上司宠我入骨', subtitle: '协议闪婚，宠入骨髓',       synopsis: '一纸协议闪婚，对象竟是职场冷面上司。婚后相处，外冷内热的他步步为营，将她宠进骨子里，再也不想放手。',                           cover: `dramas/upcoming/shan-hun-hou-shang-si-chong-wo-ru-gu.jpg`, sortOrder: 109, genres: [['0cbf23ba-0dc6-43e2-94a4-3cd0beeecb34','urban','都市'],  ['3832c51b-4c90-40ba-aa62-0073ffc22aaf','romance','爱情']] },
  ] as const;

  for (const u of upcoming) {
    await prisma.drama.upsert({
      where: { slug: u.slug },
      create: { id: u.id, slug: u.slug, title: u.title, subtitle: u.subtitle, synopsis: u.synopsis, coverPath: u.cover, status: 'published', releaseStatus: 'upcoming', publishedAt: null, sortOrder: u.sortOrder, ownerType: 'admin', ownerAdminUserId: DEFAULT_ADMIN_ID, reviewStatus: 'approved', reviewedByAdminUserId: DEFAULT_ADMIN_ID, reviewedAt: new Date() },
      update: { coverPath: u.cover, ownerType: 'admin', ownerAdminUserId: DEFAULT_ADMIN_ID, reviewStatus: 'approved' },
    });
    for (const [id, code, name] of u.genres) {
      await prisma.dramaGenre.upsert({ where: { uk_drama_genres_drama_genre: { dramaId: u.id, genreCode: code } }, create: { id, dramaId: u.id, genreCode: code, genreName: name }, update: { genreName: name } });
    }
  }

  // ── 首页推荐 ──────────────────────────────────────────────────
  for (const [id, dramaId, sortOrder] of [
    ['be7cb0bd-8e74-46e9-8245-68013607da00', d1, 1],
    ['dab41140-8ae9-4cff-96a3-a61666352fac', d2, 2],
    ['d2832f5e-38b1-4c07-b68b-0f79efeb284f', d3, 3],
  ] as const) {
    await prisma.recommendation.upsert({
      where: { uk_recommendations_type_drama: { recommendationType: 'homepage', dramaId } },
      create: { id, dramaId, recommendationType: 'homepage', sortOrder, enabled: true },
      update: { sortOrder, enabled: true },
    });
  }

  console.log('Seed 完成');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
