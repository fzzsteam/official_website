import type { Drama, CastMember, RecommendedDrama } from '../types/drama';

export const mockDrama: Drama = {
  id: 'xue-luo-guan-shan',
  title: '雪落关山',
  totalEpisodes: 30,
  episodeDuration: 18,
  year: 2025,
  genres: ['古装', '爱情', '权谋'],
  description:
    '大唐盛世，岭南荔枝声名远播。御史柳承业奉命押送一批珍贵荔枝进京，不料途中遭遇奇人异事，一颗小小的荔枝竟牵动出一段啼笑皆非的江湖恩怨。书生石头、侠女苏凌薇、神秘客秦烈，各怀心事，命运交织。荔枝传情，笑中有泪，疯狂之中自有真情。',
  coverUrl: '',
  isVip: true,
};

export const mockCast: CastMember[] = [
  { id: '1', name: '柳承业', role: '御史·主演', avatarUrl: '', characterRole: '领衔主演' },
  { id: '2', name: '苏凌薇', role: '侠女·主演', avatarUrl: '', characterRole: '领衔主演' },
  { id: '3', name: '秦烈', role: '神秘客', avatarUrl: '', characterRole: '主演' },
  { id: '4', name: '石头', role: '书生', avatarUrl: '', characterRole: '主演' },
  { id: '5', name: '沈默', role: '暗卫', avatarUrl: '', characterRole: '主演' },
];

export const mockRecommendations: RecommendedDrama[] = [
  { id: 'chang-an-qiu-yu', title: '长安秋雨', coverUrl: '' },
  { id: 'gang-cheng-wu-sheng', title: '港城无声', coverUrl: '' },
  { id: 'tian-tai-lai-xin', title: '天台来信', coverUrl: '' },
  { id: 'di-qi-ma-tou', title: '第七码头', coverUrl: '' },
  { id: 'chen-mo-de-hui-xiang', title: '沉默的回响', coverUrl: '' },
  { id: 'wu-sheng-gao-bai', title: '无声告白', coverUrl: '' },
];
