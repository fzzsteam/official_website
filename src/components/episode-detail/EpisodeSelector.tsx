import React, { useState } from 'react';
import { tokens } from './tokens';
import type { Drama } from '../../types/drama';

interface EpisodeSelectorProps {
  drama: Drama;
  currentEpisode: number;
  onSelectEpisode: (episode: number) => void;
  onViewAll?: () => void;
  onCalendar?: () => void;
}

const ChevronRightIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const PauseSmIcon = () => (
  <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
  </svg>
);

// Show episodes in pages of 30
const PAGE_SIZE = 30;

const EpisodeSelector: React.FC<EpisodeSelectorProps> = ({
  drama,
  currentEpisode,
  onSelectEpisode,
  onViewAll,
  onCalendar,
}) => {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(drama.totalEpisodes / PAGE_SIZE);
  const start = page * PAGE_SIZE;
  const episodes = Array.from(
    { length: Math.min(PAGE_SIZE, drama.totalEpisodes - start) },
    (_, i) => start + i + 1
  );

  return (
    <div style={{
      width: 336,
      flexShrink: 0,
      background: tokens.cardBg,
      borderLeft: '1px solid rgba(240,237,232,0.07)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '22px 20px 16px' }}>
        <h2 style={{
          fontFamily: tokens.fontDisplay,
          fontSize: 18, fontWeight: 400,
          color: tokens.textPrimary, letterSpacing: '0.05em',
          margin: '0 0 6px',
        }}>
          {drama.title}
        </h2>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontFamily: tokens.fontBody, fontSize: 11, color: tokens.textMuted, letterSpacing: '0.06em',
        }}>
          <span>共{drama.totalEpisodes}集</span>
          {drama.genres.map((g) => (
            <React.Fragment key={g}>
              <span style={{ color: 'rgba(240,237,232,0.18)' }}>·</span>
              <span>{g}</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* 选集 header */}
      <div style={{
        padding: '0 20px 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid rgba(240,237,232,0.07)',
      }}>
        <span style={{
          fontFamily: tokens.fontCormorant,
          fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase',
          color: tokens.textPrimary,
        }}>
          选集
        </span>
        <button
          onClick={onViewAll}
          style={{
            display: 'flex', alignItems: 'center', gap: 3,
            background: 'none', border: 'none', cursor: 'pointer',
            color: tokens.textMuted, fontFamily: tokens.fontBody,
            fontSize: 11, letterSpacing: '0.06em', padding: 0,
            transition: 'color 0.3s ease',
          }}
        >
          全{drama.totalEpisodes}集
          <ChevronRightIcon />
        </button>
      </div>

      {/* Episode grid */}
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: '14px 14px 0',
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 6,
        alignContent: 'start',
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(201,145,42,0.2) transparent',
      }}>
        {episodes.map((ep) => {
          const isActive = ep === currentEpisode;
          return (
            <button
              key={ep}
              onClick={() => onSelectEpisode(ep)}
              style={{
                aspectRatio: '1',
                background: isActive
                  ? `linear-gradient(135deg, rgba(201,145,42,0.25), rgba(201,145,42,0.15))`
                  : 'rgba(240,237,232,0.04)',
                border: isActive
                  ? `1px solid rgba(201,145,42,0.55)`
                  : '1px solid rgba(240,237,232,0.08)',
                color: isActive ? tokens.accentAmber : tokens.textMuted,
                cursor: 'pointer',
                fontFamily: tokens.fontBody,
                fontSize: 13, fontWeight: isActive ? 500 : 300,
                letterSpacing: '0.04em',
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                transition: 'all 0.2s ease',
              }}
            >
              {ep}
              {isActive && <PauseSmIcon />}
            </button>
          );
        })}
      </div>

      {/* Pagination (if more than 1 page) */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 8,
          padding: '10px 0',
        }}>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              style={{
                width: 24, height: 24,
                background: i === page ? 'rgba(201,145,42,0.2)' : 'transparent',
                border: `1px solid ${i === page ? 'rgba(201,145,42,0.5)' : 'rgba(240,237,232,0.15)'}`,
                color: i === page ? tokens.accentGold : tokens.textMuted,
                fontSize: 10, cursor: 'pointer', borderRadius: 2,
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* 追剧日历 */}
      <div style={{ padding: '14px 14px' }}>
        <button
          onClick={onCalendar}
          style={{
            width: '100%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 8,
            background: 'rgba(240,237,232,0.04)',
            border: '1px solid rgba(240,237,232,0.1)',
            color: tokens.textMuted, cursor: 'pointer',
            fontFamily: tokens.fontBody, fontSize: 12,
            letterSpacing: '0.12em', padding: '11px 0', borderRadius: 2,
            transition: 'border-color 0.3s ease, color 0.3s ease, background 0.3s ease',
          }}
        >
          <CalendarIcon />
          追剧日历
        </button>
      </div>
    </div>
  );
};

export default EpisodeSelector;
