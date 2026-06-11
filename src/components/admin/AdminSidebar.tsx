'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/admin-ui/api';

interface CurrentAdminUser {
  role: 'admin' | 'organization';
}

const navItems = [
  { href: '/admin/organizations', label: '机构' },
  { href: '/admin/dramas', label: '剧集' },
];

export function AdminSidebar() {
  const [role, setRole] = useState<CurrentAdminUser['role'] | null>(null);

  useEffect(() => {
    adminApi<{ user: CurrentAdminUser }>('/api/admin/auth/me')
      .then((data) => setRole(data.user.role))
      .catch(() => setRole(null));
  }, []);

  const visibleNavItems = navItems.filter((item) => item.href !== '/admin/organizations' || role === 'admin');

  async function handleLogout() {
    await adminApi('/api/admin/auth/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  }

  return (
    <aside className="hidden w-56 border-r border-white/10 bg-brand-card px-4 py-5 md:flex md:min-h-screen md:flex-col">
      <div>
        <Link href="/admin" className="font-display text-2xl text-brand-gold">
          方直智胜
        </Link>
        <nav className="mt-8 space-y-1">
          {visibleNavItems.map((item) => (
            <Link key={item.href} href={item.href} className="block rounded-md px-3 py-2 text-sm text-stone-200 hover:bg-white/10">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="mt-auto space-y-2 pt-6">
        <button
          className="w-full rounded-md border border-white/10 px-3 py-2 text-left text-sm text-stone-200 hover:bg-white/10"
          type="button"
          onClick={() => void handleLogout().catch(() => {})}
        >
          退出登录
        </button>
      </div>
    </aside>
  );
}
