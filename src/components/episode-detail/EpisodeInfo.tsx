import React, { useState, useRef, useLayoutEffect } from 'react';
import { tokens } from './tokens';
import type { Drama } from '../../types/drama';
import { useApp } from '../../context/AppContext';

interface EpisodeInfoProps {
  drama: Drama;
  currentEpisode: number;
}

const ChevronDownIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const CrownSmIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
    <path d="M2 19h20v2H2v-2zm18-9l-6 4-2-7-2 7-6-4 2 11h12l2-11z" />
  </svg>
);

const EpisodeInfo: React.FC<EpisodeInfoProps> = ({
  drama,
  currentEpisode,
}) => {
  const { user } = useApp();
  const [expanded, setExpanded] = useState(false);
  const [needsExpand, setNeedsExpand] = useState(false);
  const descRef = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    const el = descRef.current;
    if (!el) return;
    setNeedsExpand(el.scrollHeight > el.clientHeight);
  }, [drama.description]);

  return (
    <div className="py-5 flex-1">
      {/* Title + meta */}
      <div className="flex items-start justify-between mb-2.5">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <h1 style={{
              fontFamily: tokens.fontDisplay,
              fontSize: 22, fontWeight: 400,
              color: tokens.textPrimary, letterSpacing: '0.05em',
              margin: 0,
            }}>
              {drama.title}
            </h1>
            {drama.isVip && (!user || !user.isVip) && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: 'linear-gradient(135deg, #C9912A, #d8a24d)',
                color: '#1a0f00', fontSize: 9, fontWeight: 600,
                padding: '2px 8px', borderRadius: 2,
                fontFamily: tokens.fontBody, letterSpacing: '0.1em',
              }}>
                会员·全集免费看
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5" style={{
            fontFamily: tokens.fontBody, fontSize: 12,
            color: tokens.textMuted, letterSpacing: '0.05em',
          }}>
            <span>共{drama.totalEpisodes}集</span>
            <span style={{ color: 'rgba(240,237,232,0.2)' }}>|</span>
            <span>每集{drama.episodeDuration}分钟</span>
            <span style={{ color: 'rgba(240,237,232,0.2)' }}>|</span>
            <span>{drama.year}</span>
            <span style={{ color: 'rgba(240,237,232,0.2)' }}>|</span>
            {drama.genres.map((g) => <span key={g}>{g}</span>)}
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="pr-0 md:pr-[60px]">
        <p ref={descRef} style={{
          fontFamily: tokens.fontBody, fontSize: 13, lineHeight: 2,
          color: 'rgba(240,237,232,0.65)', fontWeight: 300,
          letterSpacing: '0.04em', margin: 0,
          display: '-webkit-box',
          WebkitLineClamp: expanded ? 'unset' : 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          简介：{drama.description}
        </p>
        {needsExpand && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="inline-flex items-center gap-1 mt-2"
            style={{
              background: 'none', border: 'none',
              color: tokens.textMuted, cursor: 'pointer',
              fontFamily: tokens.fontBody, fontSize: 12,
              letterSpacing: '0.08em', padding: 0,
            }}
          >
            {expanded ? '收起' : '展开'}
            <span style={{
              display: 'inline-block',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease',
            }}>
              <ChevronDownIcon />
            </span>
          </button>
        )}
      </div>
    </div>
  );
};

export default EpisodeInfo;
