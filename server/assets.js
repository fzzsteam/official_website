const ASSET_PATHS = {
  lizhiCover: 'official_site/lizhi/cover.jpg',
  lizhiPoster1: 'official_site/lizhi/poster1.jpg',
  lizhiPoster2: 'official_site/lizhi/poster2.jpg',
  lizhiTrailer: 'official_site/lizhi/trailer.mp4',
  lizhiCharLiuchengy: 'official_site/lizhi/char-liuchengy.jpg',
  lizhiCharSulingwei: 'official_site/lizhi/char-sulingwei.jpg',
  lizhiCharQinlie: 'official_site/lizhi/char-qinlie.jpg',
  lizhiCharShitou: 'official_site/lizhi/char-shitou.jpg',
  lizhiCharShenmo: 'official_site/lizhi/char-shenmo.jpg',
  upcomingCover01: 'official_site/upcoming/cover-01.jpg',
  upcomingCover02: 'official_site/upcoming/cover-02.jpg',
  upcomingCover03: 'official_site/upcoming/cover-03.jpg',
  upcomingCover04: 'official_site/upcoming/cover-04.jpg',
  upcomingCover05: 'official_site/upcoming/cover-05.jpg',
  upcomingCover06: 'official_site/upcoming/cover-06.jpg',
  upcomingCover07: 'official_site/upcoming/cover-07.jpg',
  upcomingCover08: 'official_site/upcoming/cover-08.jpg',
  upcomingCover09: 'official_site/upcoming/cover-09.jpg'
};

const PAGE_ASSET_KEYS = {
  'index.html': [
    'lizhiPoster1',
    'upcomingCover01',
    'upcomingCover02',
    'upcomingCover03',
    'upcomingCover04',
    'upcomingCover05'
  ],
  'drama.html': [
    'lizhiCover',
    'lizhiPoster2',
    'lizhiTrailer',
    'lizhiCharLiuchengy',
    'lizhiCharSulingwei',
    'lizhiCharQinlie',
    'lizhiCharShitou',
    'lizhiCharShenmo'
  ],
  'about.html': [],
  'business.html': [],
  'contact.html': []
};

module.exports = {
  ASSET_PATHS,
  PAGE_ASSET_KEYS
};
