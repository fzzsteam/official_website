'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/admin-ui/api';
import { FormField, adminInputClassName } from '@/components/admin/FormField';
import { ReviewPanel } from '@/components/admin/ReviewPanel';
import { StatusBadge } from '@/components/admin/StatusBadge';

interface Drama {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  synopsis: string | null;
  coverPath: string;
  posterPath: string | null;
  trailerPath: string | null;
  releaseStatus: 'upcoming' | 'released';
  sortOrder: number;
  reviewStatus: string;
}

export default function AdminDramaDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [drama, setDrama] = useState<Drama | null>(null);
  const [error, setError] = useState('');

  async function load() {
    const data = await adminApi<{ drama: Drama }>(`/api/admin/dramas/${id}`);
    setDrama(data.drama);
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : '获取剧集失败'));
  }, [id]);

  async function save() {
    if (!drama) return;
    await adminApi(`/api/admin/dramas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(drama),
    });
    await load();
  }

  async function submit() {
    await adminApi(`/api/admin/dramas/${id}/submit`, { method: 'POST', body: '{}' });
    await load();
  }

  async function review(action: 'approve' | 'reject', reason?: string) {
    await adminApi(`/api/admin/dramas/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ action, reason }),
    });
    await load();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl text-brand-gold">剧集详情</h1>
        <Link className="rounded-md border border-white/10 px-3 py-2 text-sm text-stone-100" href={`/admin/dramas/${id}/episodes`}>分集</Link>
      </div>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {drama ? (
        <>
          <section className="space-y-4 rounded-md border border-white/10 bg-brand-card p-5">
            <div className="flex justify-end"><StatusBadge status={drama.reviewStatus} /></div>
            <FormField label="Slug"><input className={adminInputClassName} value={drama.slug} onChange={(event) => setDrama({ ...drama, slug: event.target.value })} /></FormField>
            <FormField label="标题"><input className={adminInputClassName} value={drama.title} onChange={(event) => setDrama({ ...drama, title: event.target.value })} /></FormField>
            <FormField label="副标题"><input className={adminInputClassName} value={drama.subtitle || ''} onChange={(event) => setDrama({ ...drama, subtitle: event.target.value })} /></FormField>
            <FormField label="简介"><textarea className={adminInputClassName} rows={4} value={drama.synopsis || ''} onChange={(event) => setDrama({ ...drama, synopsis: event.target.value })} /></FormField>
            <FormField label="封面 path"><input className={adminInputClassName} value={drama.coverPath} onChange={(event) => setDrama({ ...drama, coverPath: event.target.value })} /></FormField>
            <div className="flex gap-2">
              <button className="rounded-md bg-brand-gold px-4 py-2 text-sm text-stone-950" onClick={() => void save()}>保存</button>
              <button className="rounded-md border border-white/10 px-4 py-2 text-sm text-stone-100" onClick={() => void submit()}>提交审核</button>
            </div>
          </section>
          <ReviewPanel approveLabel="通过剧集" rejectLabel="驳回剧集" onReview={review} />
        </>
      ) : null}
    </div>
  );
}
