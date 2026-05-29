import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { ModalType, PageType } from '../../context/AppContext';
import { tokens } from './tokens';
import UserDropdown from '../UserDropdown';

interface NavbarProps {
  onSearch?: () => void;
  onHistory?: () => void;
}

const NavSearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
  </svg>
);
const HistoryIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);
const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const CrownIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
    <path d="M2 19h20v2H2v-2zm18-9l-6 4-2-7-2 7-6-4 2 11h12l2-11z" />
  </svg>
);
const ChevronDownIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const navLinks: Array<{ label: string; page?: PageType; modal?: Exclude<ModalType, 'none'> }> = [
  { label: '首页', page: 'home' },
  { label: '短剧', page: 'home' },
  { label: '会员中心', modal: 'vip' },
  { label: '关于我们', page: 'about' },
  { label: '业务介绍', page: 'business' },
  { label: '联系我们', page: 'contact' },
];

const Navbar: React.FC<NavbarProps> = ({ onSearch, onHistory }) => {
  const { user, page, navigateTo, openModal } = useApp();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleNavClick = (link: typeof navLinks[0]) => {
    if (link.modal) {
      openModal(link.modal);
      return;
    }
    if (link.page) navigateTo(link.page);
  };

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '18px 44px',
        background: 'linear-gradient(to bottom, rgba(20,15,10,0.96) 0%, rgba(20,15,10,0.7) 100%)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(240,237,232,0.05)',
      }}
    >
      {/* Brand */}
      <button
        onClick={() => navigateTo('home')}
        style={{
          fontFamily: tokens.fontCormorant,
          fontSize: 15, fontWeight: 400,
          letterSpacing: '0.28em',
          color: tokens.textPrimary,
          background: 'none', border: 'none',
          textTransform: 'uppercase', cursor: 'pointer',
          flexShrink: 0, padding: 0,
          transition: 'color 0.3s ease',
        }}
      >
        方直智胜
      </button>

      {/* Nav Links */}
      <ul style={{ display: 'flex', gap: 28, listStyle: 'none', margin: '0 32px', padding: 0 }}>
        {navLinks.map((link) => (
          <li key={link.label}>
            <button
              onClick={() => handleNavClick(link)}
              style={{
                fontFamily: tokens.fontBody,
                fontSize: 12, fontWeight: 300,
                letterSpacing: '0.12em',
                color: (link.label === '短剧' ? page === 'episode-detail' : link.page === page)
                  ? tokens.textPrimary
                  : tokens.textMuted,
                background: 'none', border: 'none',
                cursor: 'pointer', padding: 0,
                transition: 'color 0.3s ease',
              }}
            >
              {link.label}
            </button>
          </li>
        ))}
      </ul>

      {/* Right Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        {/* Search */}
        <button
          onClick={onSearch}
          style={iconBtnStyle}
        >
          <NavSearchIcon />
          <span style={{ fontFamily: tokens.fontBody, fontSize: 12, letterSpacing: '0.08em' }}>
            搜索剧名/演员
          </span>
        </button>

        {/* Watch History */}
        <button onClick={onHistory} style={iconBtnStyle}>
          <HistoryIcon />
          <span style={{ fontFamily: tokens.fontBody, fontSize: 12, letterSpacing: '0.08em' }}>
            观看历史
          </span>
        </button>

        {/* User area */}
        {user ? (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              }}
            >
              {/* Avatar circle */}
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: user.isVip
                  ? 'linear-gradient(135deg, rgba(201,145,42,0.3), rgba(201,145,42,0.15))'
                  : 'rgba(240,237,232,0.1)',
                border: `1px solid ${user.isVip ? 'rgba(201,145,42,0.5)' : 'rgba(240,237,232,0.2)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: user.isVip ? tokens.accentGold : tokens.textMuted, flexShrink: 0,
              }}>
                <UserIcon />
              </div>
              <span style={{ fontFamily: tokens.fontBody, fontSize: 12, color: tokens.textMuted, letterSpacing: '0.06em' }}>
                {user.phone}
              </span>
              {user.isVip && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                  background: 'linear-gradient(135deg, #C9912A, #d8a24d)',
                  color: '#1a0f00', fontSize: 9, fontWeight: 600,
                  padding: '2px 6px', borderRadius: 2,
                  fontFamily: tokens.fontBody, letterSpacing: '0.08em',
                }}>
                  <CrownIcon /> 尊享会员
                </span>
              )}
              <span style={{ color: tokens.textMuted, display: 'flex' }}>
                <ChevronDownIcon />
              </span>
            </button>

            {/* Dropdown */}
            {dropdownOpen && (
              <UserDropdown onClose={() => setDropdownOpen(false)} />
            )}
          </div>
        ) : (
          <button
            onClick={() => openModal('login')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(201,145,42,0.15)',
              border: `1px solid rgba(201,145,42,0.4)`,
              borderRadius: 4, cursor: 'pointer',
              color: tokens.accentGold,
              fontFamily: tokens.fontBody, fontSize: 12,
              letterSpacing: '0.1em', padding: '7px 16px',
              transition: 'all 0.2s ease',
            }}
          >
            登录 / 注册
          </button>
        )}
      </div>
    </nav>
  );
};

const iconBtnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6,
  background: 'none', border: 'none',
  color: tokens.textMuted, cursor: 'pointer',
  padding: 0, transition: 'color 0.3s ease',
};

export default Navbar;
