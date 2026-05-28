import React, { useState } from 'react';
import { tokens } from './tokens';
import type { Drama } from '../../types/drama';

interface EpisodeInfoProps {
  drama: Drama;
  currentEpisode: number;
  isCollected?: boolean;
  onCollect?: () => void;
  onLike?: () => void;
  onShare?: () => void;
}

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? '#C9912A' : 'none'} stroke={filled ? '#C9912A' : 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const ThumbUpIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
    <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
  </svg>
);
const ShareIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);
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
  isCollected = false,
  onCollect,
  onLike,
  onShare,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [collected, setCollected] = useState(isCollected);

  const handleCollect = () => {
    setCollected((c) => !c);
    onCollect?.();
  };

  return (
    <div style={{ padding: '20px 0', flex: 1 }}>
      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <h1 style={{
              fontFamily: tokens.fontDisplay,
              fontSize: 22, fontWeight: 400,
              color: tokens.textPrimary, letterSpacing: '0.05em',
              margin: 0,
            }}>
              {drama.title}
            </h1>
            {drama.isVip && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: 'linear-gradient(135deg, #C9912A, #d8a24d)',
                color: '#1a0f00', fontSize: 9, fontWeight: 600,
                padding: '2px 8px', borderRadius: 2,
                fontFamily: tokens.fontBody, letterSpacing: '0.1em',
              }}>
                <CrownSmIcon />
                尊享会员·全集免费看
              </span>
            )}
          </div>

          {/* Meta info */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: tokens.fontBody, fontSize: 12,
            color: tokens.textMuted, letterSpacing: '0.05em',
          }}>
            <span>共{drama.totalEpisodes}集</span>
            <span style={{ color: 'rgba(240,237,232,0.2)' }}>|</span>
            <span>每集{drama.episodeDuration}分钟</span>
            <span style={{ color: 'rgba(240,237,232,0.2)' }}>|</span>
            <span>{drama.year}</span>
            <span style={{ color: 'rgba(240,237,232,0.2)' }}>|</span>
            {drama.genres.map((g) => (
              <span key={g}>{g}</span>
            ))}
          </div>
        </div>

        {/* Collect / Like / Share */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <ActionBtn icon={<StarIcon filled={collected} />} label="已收藏" onClick={handleCollect} active={collected} />
          <ActionBtn icon={<ThumbUpIcon />} label="点赞" onClick={onLike} />
          <ActionBtn icon={<ShareIcon />} label="分享" onClick={onShare} />
        </div>
      </div>

      {/* Description */}
      <div style={{ paddingRight: 60 }}>
        <p style={{
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

        <button
          onClick={() => setExpanded((e) => !e)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: 'none', border: 'none',
            color: tokens.textMuted, cursor: 'pointer',
            fontFamily: tokens.fontBody, fontSize: 12,
            letterSpacing: '0.08em', marginTop: 8, padding: 0,
            transition: 'color 0.3s ease',
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
      </div>
    </div>
  );
};

const ActionBtn: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
}> = ({ icon, label, onClick, active }) => (
  <button
    onClick={onClick}
    style={{
      background: 'none', border: 'none', cursor: 'pointer',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      color: active ? tokens.accentGold : tokens.textMuted,
      transition: 'color 0.3s ease',
      padding: 0,
    }}
  >
    {icon}
    <span style={{ fontFamily: tokens.fontBody, fontSize: 10, letterSpacing: '0.06em' }}>{label}</span>
  </button>
);

export default EpisodeInfo;
