import React from 'react';
import { tokens } from '../episode-detail/tokens';

interface InnerPageProps {
  label: string;
  title: string;
  children: React.ReactNode;
}

export const InnerPage: React.FC<InnerPageProps> = ({ label, title, children }) => (
  <div style={pageBackgroundStyle}>
    <main style={innerPageStyle}>
      <span style={pageLabelStyle}>{label}</span>
      <h1 style={pageHeadingStyle}>{title}</h1>
      {children}
    </main>

    <footer style={footerStyle}>
      <span style={footerTextStyle}>© 2026 深圳市方直智胜科技有限公司</span>
      <span style={footerTextStyle}>粤ICP备2026044251号</span>
    </footer>
  </div>
);

export const PageSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section style={sectionStyle}>
    <div style={sectionTitleStyle}>{title}</div>
    {children}
  </section>
);

export const SectionBody: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p style={sectionBodyStyle}>{children}</p>
);

export const InfoRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={infoRowStyle}>
    <span style={infoLabelStyle}>{label}</span>
    <span>{children}</span>
  </div>
);

const pageBackgroundStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: `
    radial-gradient(circle at top center, rgba(255, 247, 231, 0.08) 0%, rgba(255, 247, 231, 0.02) 24%, rgba(255, 247, 231, 0) 52%),
    linear-gradient(180deg, rgba(46, 35, 28, 0.18), rgba(24, 18, 15, 0.28)),
    linear-gradient(135deg, #3b3028 0%, #4a3a2f 20%, #5b4738 46%, #3e3127 72%, #241d19 100%)
  `,
  color: tokens.textPrimary,
  paddingTop: 1,
};

const innerPageStyle: React.CSSProperties = {
  minHeight: 'calc(100vh - 105px)',
  padding: '130px 60px 100px',
  maxWidth: 860,
  margin: '0 auto',
};

const pageLabelStyle: React.CSSProperties = {
  fontFamily: tokens.fontCormorant,
  fontSize: 11,
  letterSpacing: '0.38em',
  color: tokens.accentGold,
  textTransform: 'uppercase',
  marginBottom: 18,
  display: 'block',
  fontStyle: 'italic',
};

const pageHeadingStyle: React.CSSProperties = {
  fontFamily: tokens.fontDisplay,
  fontSize: 'clamp(32px, 4.5vw, 56px)',
  fontWeight: 400,
  lineHeight: 1.2,
  color: tokens.textPrimary,
  margin: '0 0 56px',
  letterSpacing: '0.04em',
};

const sectionStyle: React.CSSProperties = {
  marginBottom: 48,
  paddingBottom: 48,
  borderBottom: '1px solid rgba(240,236,228,0.07)',
};

const sectionTitleStyle: React.CSSProperties = {
  fontFamily: tokens.fontCormorant,
  fontSize: 11,
  letterSpacing: '0.32em',
  color: tokens.accentGold,
  textTransform: 'uppercase',
  marginBottom: 18,
};

const sectionBodyStyle: React.CSSProperties = {
  fontFamily: tokens.fontBody,
  fontSize: 15,
  lineHeight: 2.1,
  color: 'rgba(240,237,232,0.72)',
  fontWeight: 300,
  letterSpacing: '0.04em',
  margin: 0,
};

const infoRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 20,
  marginBottom: 14,
  fontSize: 14,
  color: 'rgba(240,236,228,0.72)',
  lineHeight: 1.9,
  alignItems: 'baseline',
};

const infoLabelStyle: React.CSSProperties = {
  minWidth: 88,
  color: tokens.textMuted,
  fontFamily: tokens.fontCormorant,
  letterSpacing: '0.12em',
  fontSize: 12,
  flexShrink: 0,
};

const footerStyle: React.CSSProperties = {
  padding: '40px 60px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderTop: '1px solid rgba(240,236,228,0.07)',
  maxWidth: 860,
  margin: '0 auto',
  gap: 20,
};

const footerTextStyle: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: '0.12em',
  color: tokens.textMuted,
  fontWeight: 300,
  fontFamily: tokens.fontBody,
};
