// Design tokens matching the existing style.css variables
export const tokens = {
  bg: '#1C1917',
  cardBg: '#272320',
  surfaceSoft: 'rgba(255, 248, 240, 0.08)',
  textPrimary: '#F0EDE8',
  textMuted: 'rgba(240,237,232,0.58)',
  accentGold: '#C9912A',
  accentAmber: '#d8a24d',
  // 字体角色：display=中文标题 / body=中文正文UI / accent=数字+英文装饰大写标签
  fontDisplay: "var(--font-display), serif",
  fontBody: "var(--font-body), sans-serif",
  fontAccent: "var(--font-accent), serif",
} as const;
