import React, { useRef } from 'react';
import { tokens } from './tokens';
import type { CastMember } from '../../types/drama';

interface CastSectionProps {
  cast: CastMember[];
  onViewAll?: () => void;
}

const ChevronRightIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const CastSection: React.FC<CastSectionProps> = ({ cast, onViewAll }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div style={{ minWidth: 0, flex: '0 0 auto', width: 300 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{
          fontFamily: tokens.fontCormorant,
          fontSize: 13, fontWeight: 500, letterSpacing: '0.22em',
          color: tokens.textPrimary, margin: 0, textTransform: 'uppercase',
        }}>
          演员阵容
        </h2>
        <button
          onClick={onViewAll}
          style={{
            display: 'flex', alignItems: 'center', gap: 3,
            background: 'none', border: 'none', cursor: 'pointer',
            color: tokens.textMuted, fontFamily: tokens.fontBody,
            fontSize: 11, letterSpacing: '0.08em',
            padding: 0, transition: 'color 0.3s ease',
          }}
        >
          全部演员
          <ChevronRightIcon />
        </button>
      </div>

      {/* Cast scroll */}
      <div
        ref={scrollRef}
        style={{
          display: 'flex', gap: 14, overflowX: 'auto',
          scrollbarWidth: 'none', paddingBottom: 4,
        }}
      >
        {cast.map((member) => (
          <div
            key={member.id}
            style={{
              flex: '0 0 72px', textAlign: 'center',
              cursor: 'pointer',
            }}
          >
            {/* Circular avatar */}
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              overflow: 'hidden', margin: '0 auto 8px',
              border: '1px solid rgba(240,237,232,0.12)',
              position: 'relative',
            }}>
              {member.avatarUrl ? (
                <img
                  src={member.avatarUrl}
                  alt={member.name}
                  style={{
                    width: '100%', height: '100%',
                    objectFit: 'cover', objectPosition: 'top',
                    filter: 'saturate(0.75) brightness(0.9)',
                    transition: 'filter 0.4s ease',
                  }}
                />
              ) : (
                <div style={{
                  width: '100%', height: '100%',
                  background: `rgba(201,145,42,0.12)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: tokens.fontDisplay, fontSize: 18, color: tokens.accentGold,
                }}>
                  {member.name[0]}
                </div>
              )}
            </div>

            <div style={{
              fontFamily: tokens.fontDisplay, fontSize: 12,
              color: tokens.textPrimary, letterSpacing: '0.1em',
              marginBottom: 3,
            }}>
              {member.name}
            </div>
            <div style={{
              fontFamily: tokens.fontBody, fontSize: 10,
              color: tokens.textMuted, letterSpacing: '0.06em',
            }}>
              {member.characterRole}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CastSection;
