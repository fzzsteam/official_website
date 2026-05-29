import type { Metadata } from 'next';
import {
  Cormorant_Garamond,
  Noto_Sans_SC,
  ZCOOL_QingKe_HuangYou,
} from 'next/font/google';
import './globals.css';

const displayFont = ZCOOL_QingKe_HuangYou({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
});

const bodyFont = Noto_Sans_SC({
  weight: ['200', '300', '400', '500'],
  subsets: ['latin'],
  variable: '--font-body',
});

const cormorantFont = Cormorant_Garamond({
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-cormorant',
});

export const metadata: Metadata = {
  title: '方直智胜',
  description: '方直智胜短剧会员平台',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body
        className={`${displayFont.variable} ${bodyFont.variable} ${cormorantFont.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
