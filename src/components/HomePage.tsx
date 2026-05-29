import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { tokens } from './episode-detail/tokens';
import { apiGet } from '../lib/api/client';
import type { ApiDrama, Drama } from '../types/drama';

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

// ── Component ────────────────────────────────────────────────────
const HomePage: React.FC = () => {
  const { user, navigateTo, openModal } = useApp();
  const [dramas, setDramas] = useState<ApiDrama[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    apiGet<{ dramas: ApiDrama[] }>('/api/dramas')
      .then((data) => setDramas(data.dramas))
      .catch(() => {/* keep empty on error */})
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

  const next = useCallback(
    () => goTo((heroIndex + 1) % Math.max(heroDramas.length, 1)),
    [goTo, heroIndex, heroDramas.length],
  );
  const prev = () => goTo((heroIndex - 1 + Math.max(heroDramas.length, 1)) % Math.max(heroDramas.length, 1));

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
              <div style={{
                fontFamily: tokens.fontBody, fontSize: 13,
                color: 'rgba(240,237,232,0.55)', letterSpacing: '0.28em',
                marginBottom: 12, fontWeight: 300,
              }}>
                {hero.subtitle}
              </div>
            )}

            <h1 style={{
              fontFamily: tokens.fontDisplay, fontWeight: 400,
              fontSize: 'clamp(60px, 7vw, 96px)',
              color: tokens.textPrimary, letterSpacing: '0.04em',
              lineHeight: 1.05, margin: '0 0 18px',
              textShadow: '0 4px 32px rgba(0,0,0,0.5)',
            }}>
              {hero.title}
            </h1>

            {hero.genreNames.length > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                fontFamily: tokens.fontBody, fontSize: 13,
                color: 'rgba(240,237,232,0.6)', letterSpacing: '0.1em',
                marginBottom: 16,
              }}>
                {hero.genreNames.map((g, i) => (
                  <React.Fragment key={g}>
                    {i > 0 && <span style={{ color: 'rgba(240,237,232,0.25)', fontSize: 10 }}>/</span>}
                    <span>{g}</span>
                  </React.Fragment>
                ))}
              </div>
            )}

            {hero.synopsis && (
              <p style={{
                fontFamily: tokens.fontBody, fontSize: 13, lineHeight: 1.9,
                color: 'rgba(240,237,232,0.55)', fontWeight: 300,
                letterSpacing: '0.04em', marginBottom: 32,
                maxWidth: 420,
              }}>
                {hero.synopsis.length > 80 ? hero.synopsis.slice(0, 80) + '…' : hero.synopsis}
              </p>
            )}

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
                onClick={() => navigateTo('episode-detail', apiDramaToLegacy(hero))}
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
          )}
        </section>
      )}

      {/* ── Hot Recommendations ──────────────────────────── */}
      <section style={{ padding: '48px 60px 80px' }}>
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
          }}>
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
const DramaCard: React.FC<{
  drama: ApiDrama;
  onPlay: (d: ApiDrama) => void;
}> = ({ drama, onPlay }) => {
  const [hovered, setHovered] = useState(false);
  const isReleased = drama.releaseStatus === 'released';

  return (
    <div
      onClick={() => isReleased && onPlay(drama)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: '0 0 192px', cursor: isReleased ? 'pointer' : 'default',
        borderRadius: 4, overflow: 'hidden',
        border: `1px solid ${hovered && isReleased ? 'rgba(201,145,42,0.4)' : 'rgba(240,237,232,0.08)'}`,
        transform: hovered && isReleased ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'all 0.3s ease',
        boxShadow: hovered && isReleased ? '0 12px 40px rgba(0,0,0,0.4)' : 'none',
      }}
    >
      {/* Cover: 竖版封面 */}
      <div style={{ aspectRatio: '2/3', position: 'relative', background: 'linear-gradient(135deg, #2a1a10, #4a2d1a)' }}>
        {drama.coverUrl ? (
          <img
            src={drama.coverUrl}
            alt={drama.title}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{
              fontFamily: tokens.fontDisplay, fontSize: 22,
              color: 'rgba(240,237,232,0.7)', textAlign: 'center', padding: '0 12px',
            }}>
              {drama.title}
            </span>
          </div>
        )}

        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(8,5,2,0.9) 0%, transparent 50%)',
        }} />

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 10px 12px' }}>
          <div style={{
            fontFamily: tokens.fontDisplay, fontSize: 15,
            color: tokens.textPrimary, letterSpacing: '0.08em',
          }}>
            {drama.title}
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
          color: isReleased ? tokens.accentGold : tokens.textMuted,
        }}>
          {isReleased ? '已上线' : '即将上线'}
        </span>
        {isReleased && (
          <span style={{ fontFamily: tokens.fontBody, fontSize: 10, letterSpacing: '0.06em', color: tokens.textMuted }}>
            立即观看 →
          </span>
        )}
        {!isReleased && (
          <span style={{ fontFamily: tokens.fontBody, fontSize: 10, letterSpacing: '0.06em', color: tokens.textMuted }}>
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
