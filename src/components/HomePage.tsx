import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { tokens } from './episode-detail/tokens';
import type { Drama, RecommendedDrama } from '../types/drama';

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
const PlusIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const ViewAllIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

// ── Hero dramas data ─────────────────────────────────────────────
const heroDramas: Array<Drama & { tagline: string; titleEn: string; gradient: string }> = [
  {
    id: 'xue-luo-guan-shan', title: '雪落关山', titleEn: 'Snow Falls Beyond the Pass',
    tagline: '一颗荔枝 · 一场逆袭',
    totalEpisodes: 30, episodeDuration: 18, year: 2025,
    genres: ['古装', '爱情', '权谋'],
    description: '大唐盛世，岭南荔枝声名远播。御史柳承业奉命押送一批珍贵荔枝进京，不料途中遭遇奇人异事，一颗小小的荔枝竟牵动出一段啼笑皆非的江湖恩怨…',
    coverUrl: '', isVip: true,
    gradient: 'linear-gradient(135deg, #3b2a1a 0%, #5c3d28 40%, #7a5035 70%, #3a2518 100%)',
  },
  {
    id: 'feng-kuang-de-lizhi', title: '疯狂的荔枝', titleEn: 'The Crazy Lychee',
    tagline: '一颗荔枝 · 一场传奇',
    totalEpisodes: 24, episodeDuration: 15, year: 2025,
    genres: ['古装', '喜剧', '冒险'],
    description: '大唐盛世，一颗荔枝引发的江湖争斗。御史押送贡品进京，途中奇遇不断，笑料横生，真情自现…',
    coverUrl: '', isVip: false,
    gradient: 'linear-gradient(135deg, #2a1a10 0%, #4a2d1a 40%, #6b3d22 70%, #2a1a0e 100%)',
  },
  {
    id: 'di-qi-ma-tou', title: '第七码头', titleEn: 'Pier No. 7',
    tagline: '海浪之下 · 秘密涌动',
    totalEpisodes: 20, episodeDuration: 20, year: 2025,
    genres: ['悬疑', '惊悚', '都市'],
    description: '南方港口，第七号码头藏着一个二十年前的秘密。年轻警探只身入局，却发现真相远比想象中复杂…',
    coverUrl: '', isVip: true,
    gradient: 'linear-gradient(135deg, #0d1a2a 0%, #1a2e42 40%, #243d52 70%, #0d1a28 100%)',
  },
];

const recommendedDramas: Array<RecommendedDrama & { titleEn: string; status: string; gradient: string; exclusive?: boolean }> = [
  { id: 'feng-kuang-de-lizhi', title: '疯狂的荔枝', titleEn: 'The Crazy Lyches', status: '已上线', gradient: 'linear-gradient(160deg, #2a1a10, #6b3d22)', exclusive: false },
  { id: 'di-qi-ma-tou', title: '第七码头', titleEn: 'Pier No. 7', status: '即将上线', gradient: 'linear-gradient(160deg, #0d1a2a, #1e3a54)', coverUrl: '' },
  { id: 'xue-luo-guan-shan', title: '雪落关山', titleEn: 'Snow Falls Beyond the Pass', status: '即将上线', gradient: 'linear-gradient(160deg, #3b2a1a, #7a5035)', exclusive: true, coverUrl: '' },
  { id: 'gang-cheng-wu-sheng', title: '港城无声', titleEn: 'Silent Harbor', status: '即将上线', gradient: 'linear-gradient(160deg, #1a2a1a, #2e4a2e)', coverUrl: '' },
  { id: 'chang-an-ye-yu', title: '长安夜雨', titleEn: "Rain Over Chang'an", status: '即将上线', gradient: 'linear-gradient(160deg, #1a1a2a, #2e2e4a)', coverUrl: '' },
  { id: 'tian-tai-lai-xin', title: '天台来信', titleEn: 'Letters from the Rooftop', status: '即将上线', gradient: 'linear-gradient(160deg, #2a1a2a, #4a2e4a)', coverUrl: '' },
].map((d) => ({ ...d, coverUrl: d.coverUrl ?? '' }));

// ── Component ────────────────────────────────────────────────────
const HomePage: React.FC = () => {
  const { user, navigateTo, openModal } = useApp();
  const [heroIndex, setHeroIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const hero = heroDramas[heroIndex];

  const goTo = useCallback((idx: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setHeroIndex(idx);
      setIsTransitioning(false);
    }, 300);
  }, [isTransitioning]);

  const prev = () => goTo((heroIndex - 1 + heroDramas.length) % heroDramas.length);
  const next = () => goTo((heroIndex + 1) % heroDramas.length);

  // Auto-advance
  useEffect(() => {
    const id = setInterval(next, 6000);
    return () => clearInterval(id);
  });

  const handlePlayDrama = (drama: Drama) => {
    if (!drama.isVip) {
      navigateTo('episode-detail', drama);
      return;
    }
    if (!user) { openModal('login'); return; }
    if (!user.isVip) { openModal('vip'); return; }
    navigateTo('episode-detail', drama);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#1a140f' }}>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>

        {/* Background */}
        <div style={{
          position: 'absolute', inset: 0,
          background: hero.gradient,
          opacity: isTransitioning ? 0 : 1,
          transition: 'opacity 0.5s ease',
        }}>
          {/* Texture */}
          <div style={{
            position: 'absolute', inset: 0,
            background: `
              radial-gradient(ellipse at 60% 50%, rgba(255,247,231,0.06) 0%, transparent 60%),
              repeating-linear-gradient(90deg, rgba(255,250,239,0.012) 0, rgba(255,250,239,0.012) 1px, transparent 1px, transparent 6px),
              repeating-linear-gradient(180deg, rgba(71,54,42,0.04) 0, rgba(71,54,42,0.04) 2px, transparent 2px, transparent 10px)
            `,
          }} />
          {/* Left gradient for text readability */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to right, rgba(12,8,4,0.88) 0%, rgba(12,8,4,0.6) 35%, rgba(12,8,4,0.1) 65%, transparent 100%)',
          }} />
          {/* Bottom fade */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%',
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
          {/* Tagline */}
          <div style={{
            fontFamily: tokens.fontBody, fontSize: 13,
            color: 'rgba(240,237,232,0.55)', letterSpacing: '0.28em',
            marginBottom: 12, fontWeight: 300,
          }}>
            {hero.tagline}
          </div>

          {/* Title */}
          <h1 style={{
            fontFamily: tokens.fontDisplay, fontWeight: 400,
            fontSize: 'clamp(60px, 7vw, 96px)',
            color: tokens.textPrimary, letterSpacing: '0.04em',
            lineHeight: 1.05, margin: '0 0 6px',
            textShadow: '0 4px 32px rgba(0,0,0,0.4)',
          }}>
            {hero.title}
          </h1>

          {/* English title */}
          <div style={{
            fontFamily: tokens.fontCormorant, fontSize: 12,
            letterSpacing: '0.38em', color: 'rgba(240,237,232,0.45)',
            fontStyle: 'italic', textTransform: 'uppercase', marginBottom: 18,
          }}>
            {hero.titleEn}
          </div>

          {/* Genres */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            fontFamily: tokens.fontBody, fontSize: 13,
            color: 'rgba(240,237,232,0.6)', letterSpacing: '0.1em',
            marginBottom: 16,
          }}>
            {hero.genres.map((g, i) => (
              <React.Fragment key={g}>
                {i > 0 && <span style={{ color: 'rgba(240,237,232,0.25)', fontSize: 10 }}>/</span>}
                <span>{g}</span>
              </React.Fragment>
            ))}
          </div>

          {/* Description */}
          <p style={{
            fontFamily: tokens.fontBody, fontSize: 13, lineHeight: 1.9,
            color: 'rgba(240,237,232,0.55)', fontWeight: 300,
            letterSpacing: '0.04em', marginBottom: 32,
            maxWidth: 420,
          }}>
            {hero.description}
          </p>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button
              onClick={() => handlePlayDrama(hero)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                background: 'linear-gradient(135deg, #C9912A, #d8a24d)',
                border: 'none', borderRadius: 24,
                color: '#1a0f00', cursor: 'pointer',
                fontFamily: tokens.fontDisplay, fontSize: 15,
                letterSpacing: '0.12em', padding: '13px 28px',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                boxShadow: '0 8px 24px rgba(201,145,42,0.3)',
              }}
            >
              <PlayIcon /> 立即观看
            </button>

            <button
              onClick={() => navigateTo('episode-detail', hero)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'rgba(240,237,232,0.08)',
                border: '1px solid rgba(240,237,232,0.22)',
                borderRadius: 24, color: tokens.textPrimary, cursor: 'pointer',
                fontFamily: tokens.fontBody, fontSize: 13,
                letterSpacing: '0.1em', padding: '12px 22px',
                backdropFilter: 'blur(4px)',
                transition: 'background 0.2s ease, border-color 0.2s ease',
              }}
            >
              查看详情
            </button>

            <button
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'none', border: 'none',
                color: 'rgba(240,237,232,0.6)', cursor: 'pointer',
                fontFamily: tokens.fontBody, fontSize: 13,
                letterSpacing: '0.1em', padding: '12px 8px',
                transition: 'color 0.2s ease',
              }}
            >
              <PlusIcon /> 加入追剧
            </button>
          </div>
        </div>

        {/* Arrow controls */}
        <button onClick={prev} style={{ ...arrowBtnStyle, left: 20 }}><ChevronLeftIcon /></button>
        <button onClick={next} style={{ ...arrowBtnStyle, right: 20 }}><ChevronRightIcon /></button>

        {/* Dots */}
        <div style={{
          position: 'absolute', bottom: 70, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: 8,
        }}>
          {heroDramas.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              style={{
                width: i === heroIndex ? 24 : 8,
                height: 4, borderRadius: 2, border: 'none',
                background: i === heroIndex ? tokens.accentGold : 'rgba(240,237,232,0.3)',
                cursor: 'pointer', padding: 0,
                transition: 'width 0.3s ease, background 0.3s ease',
              }}
            />
          ))}
        </div>
      </section>

      {/* ── Hot Recommendations ──────────────────────────── */}
      <section style={{ padding: '48px 60px 80px' }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 24,
        }}>
          <h2 style={{
            fontFamily: tokens.fontCormorant, fontSize: 18, fontWeight: 500,
            color: tokens.accentGold, letterSpacing: '0.2em', margin: 0,
          }}>
            热门推荐
          </h2>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'none', border: 'none',
            color: tokens.textMuted, cursor: 'pointer',
            fontFamily: tokens.fontBody, fontSize: 12,
            letterSpacing: '0.08em', padding: 0,
            transition: 'color 0.2s ease',
          }}>
            查看全部 <ViewAllIcon />
          </button>
        </div>

        {/* Cards row */}
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {recommendedDramas.map((drama) => (
            <DramaCard key={drama.id} drama={drama} onPlay={handlePlayDrama} />
          ))}
        </div>
      </section>
    </div>
  );
};

// ── DramaCard ────────────────────────────────────────────────────
const DramaCard: React.FC<{
  drama: typeof recommendedDramas[0];
  onPlay: (d: Drama) => void;
}> = ({ drama, onPlay }) => {
  const [hovered, setHovered] = useState(false);
  const dramaDef: Drama = {
    id: drama.id, title: drama.title, totalEpisodes: 20,
    episodeDuration: 18, year: 2025, genres: ['古装'],
    description: '', coverUrl: drama.coverUrl, isVip: true,
  };

  return (
    <div
      onClick={() => onPlay(dramaDef)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: '0 0 192px', cursor: 'pointer',
        borderRadius: 4, overflow: 'hidden',
        border: `1px solid ${hovered ? 'rgba(201,145,42,0.4)' : 'rgba(240,237,232,0.08)'}`,
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'all 0.3s ease',
        boxShadow: hovered ? '0 12px 40px rgba(0,0,0,0.4)' : 'none',
      }}
    >
      {/* Cover */}
      <div style={{ aspectRatio: '2/3', position: 'relative', background: drama.gradient }}>
        {drama.coverUrl ? (
          <img src={drama.coverUrl} alt={drama.title} loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <>
            <div style={{
              position: 'absolute', inset: 0,
              background: `
                radial-gradient(ellipse at 40% 30%, rgba(255,247,231,0.08) 0%, transparent 60%),
                repeating-linear-gradient(135deg, rgba(255,250,239,0.015) 0, rgba(255,250,239,0.015) 1px, transparent 1px, transparent 8px)
              `,
            }} />
            {/* Drama title watermark */}
            <div style={{
              position: 'absolute', inset: 0, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{
                fontFamily: tokens.fontDisplay, fontSize: 24,
                color: 'rgba(240,237,232,0.7)', letterSpacing: '0.08em',
                textShadow: '0 2px 12px rgba(0,0,0,0.5)',
                textAlign: 'center', padding: '0 12px',
              }}>
                {drama.title}
              </span>
            </div>
          </>
        )}

        {/* Exclusive badge */}
        {drama.exclusive && (
          <div style={{
            position: 'absolute', top: 8, right: 8,
            background: 'linear-gradient(135deg, #C9912A, #d8a24d)',
            color: '#1a0f00', fontSize: 9, fontWeight: 700,
            padding: '2px 6px', borderRadius: 2,
            fontFamily: tokens.fontBody, letterSpacing: '0.06em',
          }}>
            独家热播
          </div>
        )}

        {/* Bottom overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(8,5,2,0.9) 0%, transparent 50%)',
        }} />

        {/* Title */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 10px 12px',
        }}>
          <div style={{
            fontFamily: tokens.fontDisplay, fontSize: 15,
            color: tokens.textPrimary, letterSpacing: '0.08em',
            marginBottom: 2,
          }}>
            {drama.title}
          </div>
          <div style={{
            fontFamily: tokens.fontCormorant, fontSize: 10,
            color: 'rgba(240,237,232,0.5)', letterSpacing: '0.18em',
            fontStyle: 'italic',
          }}>
            {drama.titleEn}
          </div>
        </div>
      </div>

      {/* Status */}
      <div style={{
        background: '#1a140f', padding: '8px 10px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{
          fontFamily: tokens.fontBody, fontSize: 10, letterSpacing: '0.06em',
          color: drama.status === '已上线' ? tokens.accentGold : tokens.textMuted,
        }}>
          {drama.status}
        </span>
        {drama.status === '已上线' && (
          <span style={{
            fontFamily: tokens.fontBody, fontSize: 10, letterSpacing: '0.06em',
            color: tokens.textMuted,
          }}>
            立即观看 →
          </span>
        )}
        {drama.status === '即将上线' && (
          <span style={{
            fontFamily: tokens.fontBody, fontSize: 10, letterSpacing: '0.06em',
            color: tokens.textMuted,
          }}>
            敬请期待
          </span>
        )}
      </div>
    </div>
  );
};

const arrowBtnStyle: React.CSSProperties = {
  position: 'absolute', top: '50%', transform: 'translateY(-50%)',
  width: 44, height: 44, borderRadius: '50%',
  background: 'rgba(240,237,232,0.08)',
  border: '1px solid rgba(240,237,232,0.15)',
  color: tokens.textMuted, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  backdropFilter: 'blur(4px)', zIndex: 10,
  transition: 'background 0.2s ease, border-color 0.2s ease, color 0.2s ease',
};

export default HomePage;
