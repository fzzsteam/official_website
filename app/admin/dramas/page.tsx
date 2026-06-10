'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/admin-ui/api';
import { StatusBadge } from '@/components/admin/StatusBadge';

interface Drama {
  id: string;
  title: string;
  slug: string;
  reviewStatus: string;
  updatedAt: string;
}

export default function AdminDramasPage() {
  const [dramas, setDramas] = useState<Drama[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi<{ dramas: Drama[] }>('/api/admin/dramas')
      .then((data) => setDramas(data.dramas))
      .catch((err) => setError(err instanceof Error ? err.message : '获取剧集失败'));
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl text-brand-gold">剧集管理</h1>
        <Link className="rounded-md bg-brand-gold px-3 py-2 text-sm text-stone-950" href="/admin/dramas/new">新建剧集</Link>
      </div>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      <div className="overflow-hidden rounded-md border border-white/10 bg-brand-card">
        {dramas.map((drama) => (
          <Link key={drama.id} href={`/admin/dramas/${drama.id}`} className="grid gap-2 border-b border-white/10 p-4 last:border-b-0 md:grid-cols-[1fr_120px_160px]">
            <div>
              <p className="text-stone-100">{drama.title}</p>
              <p className="text-sm text-stone-400">{drama.slug}</p>
            </div>
            <StatusBadge status={drama.reviewStatus} />
            <span className="text-sm text-stone-400">{drama.updatedAt}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
