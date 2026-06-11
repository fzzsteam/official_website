'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { AdminSidebar } from './AdminSidebar';
import { AdminToast } from './AdminToast';

export function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/admin/login' || pathname === '/admin/register';

  if (isAuthPage) {
    return (
      <div className="flex min-h-screen flex-col bg-brand-bg px-4 py-10 text-stone-100">
        <AdminToast />
        <div className="flex flex-1 items-center justify-center">
          {children}
        </div>
        <footer className="pt-8 text-center text-xs leading-6 text-stone-500">
          © 2026 深圳市方直智胜科技有限公司·
          <a className="hover:text-brand-gold" href="https://beian.miit.gov.cn/" target="_blank" rel="noreferrer">
            粤ICP备2026044251号
          </a>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg text-slate-950">
      <AdminToast />
      <div className="flex min-h-screen">
        <AdminSidebar />
        <main className="flex-1 bg-slate-100 px-4 py-5 md:px-8">
          <div className="mb-5 rounded-md border border-white/10 bg-brand-card px-4 py-3 text-brand-gold md:hidden">
            方直智胜后台
          </div>
          <div className="mx-auto max-w-[1440px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
