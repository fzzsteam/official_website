import type { ReactNode } from 'react';
import { AdminSidebar } from './AdminSidebar';

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-bg text-slate-950">
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
