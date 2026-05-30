import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { ModalType, PageType } from '../../context/AppContext';
import { tokens } from './tokens';
import UserDropdown from '../UserDropdown';

interface NavbarProps {
  onSearch?: () => void;
  onHistory?: () => void;
}
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
const HamburgerIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);
const CloseMenuIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const navLinks: Array<{ label: string; page?: PageType; modal?: Exclude<ModalType, 'none'> }> = [
  { label: '首页', page: 'home' },
  { label: '会员中心', modal: 'vip' },
  { label: '关于我们', page: 'about' },
  { label: '业务介绍', page: 'business' },
  { label: '联系我们', page: 'contact' },
];

const Navbar: React.FC<NavbarProps> = () => {
  const { user, page, navigateTo, openModal } = useApp();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNavClick = (link: typeof navLinks[0]) => {
    setMenuOpen(false);
    if (link.modal) { openModal(link.modal); return; }
    if (link.page) navigateTo(link.page);
  };

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-between px-4 md:px-11 py-[18px]"
        style={{
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
          }}
        >
          方直智胜
        </button>

        {/* Nav links — desktop only */}
        <ul className="hidden md:flex gap-7 list-none m-0 mx-8 p-0">
          {navLinks.map((link) => (
            <li key={link.label}>
              <button
                onClick={() => handleNavClick(link)}
                style={{
                  fontFamily: tokens.fontBody,
                  fontSize: 12, fontWeight: 300,
                  letterSpacing: '0.12em',
                  color: (link.label === '短剧' ? page === 'episode-detail' : link.page === page)
                    ? tokens.textPrimary : tokens.textMuted,
                  background: 'none', border: 'none',
                  cursor: 'pointer', padding: 0,
                }}
              >
                {link.label}
              </button>
            </li>
          ))}
        </ul>

        {/* Right actions */}
        <div className="flex items-center gap-4">
          {/* User area */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                className="flex items-center gap-2"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
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
                <span className="hidden md:inline" style={{ fontFamily: tokens.fontBody, fontSize: 12, color: tokens.textMuted, letterSpacing: '0.06em' }}>
                  {user.phone}
                </span>
                {user.isVip && (
                  <span className="hidden md:inline-flex items-center gap-1" style={{
                    background: 'linear-gradient(135deg, #C9912A, #d8a24d)',
                    color: '#1a0f00', fontSize: 9, fontWeight: 600,
                    padding: '2px 6px', borderRadius: 2,
                    fontFamily: tokens.fontBody, letterSpacing: '0.08em',
                  }}>
                    会员
                  </span>
                )}
                <span className="hidden md:flex" style={{ color: tokens.textMuted }}>
                  <ChevronDownIcon />
                </span>
              </button>
              {dropdownOpen && <UserDropdown onClose={() => setDropdownOpen(false)} />}
            </div>
          ) : (
            <button
              onClick={() => openModal('login')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(201,145,42,0.15)',
                border: '1px solid rgba(201,145,42,0.4)',
                borderRadius: 4, cursor: 'pointer',
                color: tokens.accentGold,
                fontFamily: tokens.fontBody, fontSize: 12,
                letterSpacing: '0.1em', padding: '7px 16px',
              }}
            >
              登录 / 注册
            </button>
          )}

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="md:hidden flex items-center justify-center p-1"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: tokens.textMuted }}
          >
            {menuOpen ? <CloseMenuIcon /> : <HamburgerIcon />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-[199] md:hidden"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="absolute top-[57px] left-0 right-0 py-2"
            style={{
              background: 'rgba(20,15,10,0.98)',
              backdropFilter: 'blur(16px)',
              borderBottom: '1px solid rgba(240,237,232,0.08)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNavClick(link)}
                className="w-full text-left px-6 py-3 block"
                style={{
                  fontFamily: tokens.fontBody,
                  fontSize: 15, fontWeight: 300,
                  letterSpacing: '0.12em',
                  color: (link.label === '短剧' ? page === 'episode-detail' : link.page === page)
                    ? tokens.textPrimary : tokens.textMuted,
                  background: 'none', border: 'none', cursor: 'pointer',
                }}
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

const iconBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none',
  color: 'rgba(240,237,232,0.58)', cursor: 'pointer', padding: 0,
};

export default Navbar;
