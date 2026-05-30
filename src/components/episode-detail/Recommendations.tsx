import React, { useRef } from 'react';
import { tokens } from './tokens';
import type { RecommendedDrama } from '../../types/drama';

interface RecommendationsProps {
  items: RecommendedDrama[];
  onSelect?: (id: string) => void;
}

const ChevronLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const ChevronRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const Recommendations: React.FC<RecommendationsProps> = ({ items, onSelect }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction === 'left' ? -300 : 300, behavior: 'smooth' });
  };

  return (
    <section className="pt-6 pb-8 md:pt-8 md:pb-10">
      <div className="flex items-center justify-between mb-[18px] pl-4 md:pl-5">
        <h2 style={{
          fontFamily: tokens.fontCormorant,
          fontSize: 13, fontWeight: 500,
          letterSpacing: '0.28em', textTransform: 'uppercase',
          color: tokens.textPrimary, margin: 0,
        }}>
          猜你喜欢
        </h2>

        {/* Arrow controls — desktop only */}
        <div className="hidden md:flex gap-1.5 pr-5">
          {[{ dir: 'left' as const, Icon: ChevronLeftIcon }, { dir: 'right' as const, Icon: ChevronRightIcon }].map(({ dir, Icon }) => (
            <button
              key={dir}
              onClick={() => scroll(dir)}
              style={{
                width: 30, height: 30,
                background: 'rgba(240,237,232,0.06)',
                border: '1px solid rgba(240,237,232,0.12)',
                color: tokens.textMuted, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 2, transition: 'all 0.2s ease',
              }}
            >
              <Icon />
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable row */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto px-4 md:px-5"
        style={{ scrollbarWidth: 'none' }}
      >
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelect?.(item.id)}
            style={{
              flex: '0 0 148px', cursor: 'pointer', position: 'relative',
              borderRadius: 2, overflow: 'hidden',
              border: '1px solid rgba(240,237,232,0.08)',
              transition: 'border-color 0.3s ease, transform 0.3s ease',
            }}
          >
            {/* Cover image */}
            <div style={{ aspectRatio: '2/3', position: 'relative' }}>
              {item.coverUrl ? (
                <img
                  src={item.coverUrl}
                  alt={item.title}
                  loading="lazy"
                  style={{
                    width: '100%', height: '100%',
                    objectFit: 'cover',
                    filter: 'saturate(0.75) brightness(0.85)',
                    transition: 'filter 0.4s ease',
                    display: 'block',
                  }}
                />
              ) : (
                <div style={{
                  width: '100%', height: '100%',
                  background: `linear-gradient(135deg, #2a201a, #3a2a1f)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: tokens.fontDisplay, fontSize: 16, color: tokens.accentGold,
                  letterSpacing: '0.1em',
                }}>
                  {item.title}
                </div>
              )}

              {/* Title overlay */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, rgba(8,5,2,0.88) 0%, transparent 52%)',
              }} />
              <div style={{
                position: 'absolute', bottom: 8, left: 8, right: 8,
                fontFamily: tokens.fontDisplay, fontSize: 14,
                color: tokens.textPrimary, letterSpacing: '0.06em',
                lineHeight: 1.3,
              }}>
                {item.title}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Recommendations;
