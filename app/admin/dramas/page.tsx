'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AdminDrawer } from '@/components/admin/AdminDrawer';
import { AdminListToolbar } from '@/components/admin/AdminListToolbar';
import { AdminMediaPreview } from '@/components/admin/AdminMediaPreview';
import { AdminMediaUpload } from '@/components/admin/AdminMediaUpload';
import { GenreMultiSelect } from '@/components/admin/GenreMultiSelect';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { adminApi } from '@/lib/admin-ui/api';

interface AdminDrama {
  id: string;
  title: string;
  subtitle: string | null;
  synopsis: string | null;
  coverPath: string;
  coverUrl: string | null;
  posterPath: string | null;
  posterUrl: string | null;
  reviewStatus: string;
  releaseStatus: 'upcoming' | 'released';
  sortOrder: number;
  updatedAt: string;
  genres?: Array<{ genreCode: string; genreName: string }>;
  _count?: { episodes: number };
}

const emptyForm = {
  title: '',
  subtitle: '',
  synopsis: '',
  coverPath: '',
  posterPath: '',
  releaseStatus: 'upcoming' as const,
  sortOrder: 0,
  genreCodes: [] as string[],
};

export default function AdminDramasPage() {
  const [dramas, setDramas] = useState<AdminDrama[]>([]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [releaseFilter, setReleaseFilter] = useState('all');
  const [reviewFilter, setReviewFilter] = useState('all');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedDrama, setSelectedDrama] = useState<AdminDrama | null>(null);
  const [form, setForm] = useState(emptyForm);

  async function load() {
    const data = await adminApi<{ dramas: AdminDrama[] }>('/api/admin/dramas');
    setDramas(data.dramas);
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : '获取剧集失败'));
  }, []);

  const visibleDramas = dramas.filter((drama) => {
    const matchesSearch = drama.title.includes(search);
    const matchesRelease = releaseFilter === 'all' || drama.releaseStatus === releaseFilter;
    const matchesReview = reviewFilter === 'all' || drama.reviewStatus === reviewFilter;
    return matchesSearch && matchesRelease && matchesReview;
  });

  function openCreateDrawer() {
    setSelectedDrama(null);
    setForm(emptyForm);
    setDrawerOpen(true);
  }

  function openEditDrawer(drama: AdminDrama) {
    setSelectedDrama(drama);
    setForm({
      title: drama.title,
      subtitle: drama.subtitle || '',
      synopsis: drama.synopsis || '',
      coverPath: drama.coverPath,
      posterPath: drama.posterPath || '',
      releaseStatus: drama.releaseStatus,
      sortOrder: drama.sortOrder,
      genreCodes: drama.genres?.map((genre) => genre.genreCode) || [],
    });
    setDrawerOpen(true);
  }

  async function submitForReview(dramaId: string) {
    await adminApi(`/api/admin/dramas/${dramaId}/submit`, { method: 'POST', body: '{}' });
    await load();
  }

  async function reviewDrama(dramaId: string, action: 'approve' | 'reject', reason?: string) {
    await adminApi(`/api/admin/dramas/${dramaId}/review`, {
      method: 'POST',
      body: JSON.stringify({ action, reason }),
    });
    await load();
  }

  async function updateRelease(dramaId: string, releaseStatus: 'upcoming' | 'released') {
    await adminApi(`/api/admin/dramas/${dramaId}/release`, {
      method: 'POST',
      body: JSON.stringify({ releaseStatus }),
    });
    await load();
  }

  async function saveDrama() {
    if (selectedDrama) {
      await adminApi(`/api/admin/dramas/${selectedDrama.id}`, {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      await adminApi(`/api/admin/dramas/${selectedDrama.id}/release`, {
        method: 'POST',
        body: JSON.stringify({ releaseStatus: form.releaseStatus }),
      });
    } else {
      await adminApi('/api/admin/dramas', {
        method: 'POST',
        body: JSON.stringify(form),
      });
    }

    setDrawerOpen(false);
    await load();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-brand-gold">剧集管理</h1>
          <p className="mt-1 text-sm text-slate-500">统一管理剧集资料、审核和上架状态。</p>
        </div>
        <button className="rounded-md bg-brand-gold px-3 py-2 text-sm text-stone-950" type="button" onClick={openCreateDrawer}>
          新建剧集
        </button>
      </div>

      <AdminListToolbar
        search={search}
        onSearchChange={setSearch}
        filterGroups={[
          {
            label: '上架状态',
            value: releaseFilter,
            onChange: setReleaseFilter,
            options: [
              { label: '全部', value: 'all' },
              { label: '待上架', value: 'upcoming' },
              { label: '已上架', value: 'released' },
            ],
          },
          {
            label: '审核状态',
            value: reviewFilter,
            onChange: setReviewFilter,
            options: [
              { label: '全部', value: 'all' },
              { label: '草稿', value: 'draft' },
              { label: '待审核', value: 'submitted' },
              { label: '已通过', value: 'approved' },
              { label: '已驳回', value: 'rejected' },
            ],
          },
        ]}
        action={<Link href="/admin/dramas" className="text-sm text-slate-500">刷新</Link>}
      />

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        {visibleDramas.map((drama) => (
          <div key={drama.id} className="grid gap-4 border-b border-slate-200 p-4 last:border-b-0 lg:grid-cols-[120px_1fr_240px]">
            <div className="overflow-hidden rounded-md bg-slate-100">
              {drama.posterUrl ? <img src={drama.posterUrl} alt={drama.title} className="h-28 w-full object-cover" /> : <div className="flex h-28 items-center justify-center text-xs text-slate-400">无海报</div>}
            </div>
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900">{drama.title}</h2>
                <StatusBadge status={drama.reviewStatus} />
                <StatusBadge status={drama.releaseStatus} />
              </div>
              <p className="text-sm text-slate-500">{drama.subtitle || '暂无副标题'}</p>
              <p className="text-xs text-slate-400">更新时间：{drama.updatedAt}</p>
              <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                {(drama.genres || []).map((genre) => (
                  <span key={genre.genreCode} className="rounded-md bg-slate-100 px-2 py-1">
                    {genre.genreName}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-start justify-end gap-2">
              {/* Row actions call /api/admin/dramas/${drama.id}/review and /api/admin/dramas/${drama.id}/release. */}
              <button className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700" type="button" onClick={() => openEditDrawer(drama)}>
                编辑
              </button>
              <Link className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700" href={`/admin/dramas/${drama.id}/episodes`}>
                分集
              </Link>
              <button className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700" type="button" onClick={() => void submitForReview(drama.id)}>
                提交审核
              </button>
              <button className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700" type="button" onClick={() => void reviewDrama(drama.id, 'approve')}>
                审核通过
              </button>
              <button className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700" type="button" onClick={() => void reviewDrama(drama.id, 'reject', '资料不完整')}>
                驳回
              </button>
              <button className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700" type="button" onClick={() => void updateRelease(drama.id, drama.releaseStatus === 'released' ? 'upcoming' : 'released')}>
                {drama.releaseStatus === 'released' ? '下架' : '上架'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <AdminDrawer
        open={drawerOpen}
        title={selectedDrama ? '编辑剧集' : '新建剧集'}
        subtitle={selectedDrama ? selectedDrama.title : '填写剧集基础信息'}
        onClose={() => setDrawerOpen(false)}
        footer={
          <div className="flex items-center justify-end gap-2">
            <button className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700" type="button" onClick={() => setDrawerOpen(false)}>
              取消
            </button>
            <button className="rounded-md bg-brand-gold px-3 py-2 text-sm text-stone-950" type="button" onClick={() => void saveDrama()}>
              保存
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm text-slate-600">标题</span>
            <input className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </label>
          <label className="block space-y-2">
            <span className="text-sm text-slate-600">副标题</span>
            <input className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.subtitle} onChange={(event) => setForm({ ...form, subtitle: event.target.value })} />
          </label>
          <label className="block space-y-2">
            <span className="text-sm text-slate-600">简介</span>
            <textarea className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" rows={4} value={form.synopsis} onChange={(event) => setForm({ ...form, synopsis: event.target.value })} />
          </label>
          <AdminMediaPreview type="image" url={selectedDrama?.posterUrl || null} label="海报预览" />
          <AdminMediaUpload fileKind="cover" mediaKind="image" value={form.coverPath} onChange={(path) => setForm({ ...form, coverPath: path })} onClear={() => setForm({ ...form, coverPath: '' })} />
          <AdminMediaUpload fileKind="poster" mediaKind="image" value={form.posterPath} onChange={(path) => setForm({ ...form, posterPath: path })} onClear={() => setForm({ ...form, posterPath: '' })} />
          <GenreMultiSelect value={form.genreCodes} onChange={(genreCodes) => setForm({ ...form, genreCodes })} />
        </div>
      </AdminDrawer>
    </div>
  );
}
