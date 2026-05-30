import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '方直智胜',
  description: '方直智胜短剧会员平台',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
