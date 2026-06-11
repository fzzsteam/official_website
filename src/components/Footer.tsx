import React from 'react';
import { tokens } from './episode-detail/tokens';

interface FooterProps {
  className?: string;
}

const Dot = () => (
  <span style={{ ...textStyle, color: 'rgba(240,237,232,0.28)' }} className="hidden md:inline">·</span>
);

const Footer: React.FC<FooterProps> = ({ className }) => (
  <footer
    className={`py-8 px-4 md:px-[60px] flex flex-col md:flex-row items-center justify-center gap-2 md:gap-5 ${className ?? ''}`}
    style={{ borderTop: '1px solid rgba(240,236,228,0.07)' }}
  >
    <span style={textStyle}>© 2026 深圳市方直智胜科技有限公司</span>
    <Dot />
    <a
      href="https://www.miit.gov.cn/index.html"
      target="_blank"
      rel="noopener noreferrer"
      style={textStyle}
      className="hover:opacity-80 transition-opacity"
    >
      粤ICP备2026044251号
    </a>
    <Dot />
    <a
      href="/terms"
      target="_blank"
      rel="noopener noreferrer"
      style={textStyle}
      className="hover:opacity-80 transition-opacity"
    >
      用户协议
    </a>
    <Dot />
    <a
      href="/privacy"
      target="_blank"
      rel="noopener noreferrer"
      style={textStyle}
      className="hover:opacity-80 transition-opacity"
    >
      隐私政策
    </a>
    <Dot />
    <a
      href="/admin/register"
      style={textStyle}
      className="hover:opacity-80 transition-opacity"
    >
      机构入驻
    </a>
  </footer>
);

const textStyle: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: '0.12em',
  color: tokens.textMuted,
  fontWeight: 300,
  fontFamily: tokens.fontBody,
  textDecoration: 'none',
};

export default Footer;
