import React, { useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { tokens } from './episode-detail/tokens';

const CrownIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
    <path d="M2 19h20v2H2v-2zm18-9l-6 4-2-7-2 7-6-4 2 11h12l2-11z" />
  </svg>
);
const UserAvatarIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

interface UserDropdownProps {
  onClose: () => void;
}

const UserDropdown: React.FC<UserDropdownProps> = ({ onClose }) => {
  const { user, openModal, logout } = useApp();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  if (!user) return null;

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute', top: 'calc(100% + 8px)', right: 0,
        width: 280, zIndex: 300,
        background: 'linear-gradient(180deg, #2c2118 0%, #201810 100%)',
        border: '1px solid rgba(201,145,42,0.2)',
        borderRadius: 8,
        boxShadow: '0 16px 56px rgba(0,0,0,0.55)',
        padding: '20px',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* User info row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: 'rgba(201,145,42,0.15)',
          border: `1px solid rgba(201,145,42,0.35)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: tokens.accentGold, flexShrink: 0,
        }}>
          <UserAvatarIcon />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontFamily: tokens.fontBody, fontSize: 14,
              color: tokens.textPrimary, fontWeight: 400,
              letterSpacing: '0.06em',
            }}>
              {user.phone}
            </span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              padding: '2px 7px', borderRadius: 2, fontSize: 10,
              fontFamily: tokens.fontBody, letterSpacing: '0.08em',
              ...(user.isVip
                ? {
                    background: 'linear-gradient(135deg, #C9912A, #d8a24d)',
                    color: '#1a0f00', fontWeight: 600,
                  }
                : {
                    background: 'rgba(240,237,232,0.1)',
                    border: '1px solid rgba(240,237,232,0.18)',
                    color: tokens.textMuted,
                  }),
            }}>
              {user.isVip && <CrownIcon />}
              {user.isVip ? '尊享会员' : '普通用户'}
            </span>
          </div>
        </div>
      </div>

      {/* VIP upsell (only for non-VIP) */}
      {!user.isVip && (
        <>
          <p style={{
            fontFamily: tokens.fontBody, fontSize: 11,
            color: tokens.textMuted, letterSpacing: '0.04em',
            textAlign: 'center', margin: '0 0 14px',
            lineHeight: 1.6,
          }}>
            开通会员，畅享全部剧集和专属权益
          </p>
          <button
            onClick={() => { openModal('vip'); onClose(); }}
            style={{
              width: '100%', padding: '11px 0',
              background: 'linear-gradient(135deg, #C9912A, #d8a24d)',
              border: 'none', borderRadius: 4, cursor: 'pointer',
              fontFamily: tokens.fontDisplay, fontSize: 14,
              color: '#1a0f00', letterSpacing: '0.14em',
              marginBottom: 8,
              transition: 'opacity 0.2s ease',
            }}
          >
            立即开通会员
          </button>
        </>
      )}

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(240,237,232,0.08)', margin: '8px 0' }} />

      {/* Logout */}
      <button
        onClick={() => { logout(); onClose(); }}
        style={{
          width: '100%', padding: '10px 0',
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: tokens.fontBody, fontSize: 13,
          color: tokens.textMuted, letterSpacing: '0.08em',
          transition: 'color 0.2s ease',
          textAlign: 'center',
        }}
      >
        退出登录
      </button>
    </div>
  );
};

export default UserDropdown;
