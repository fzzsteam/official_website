'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AdminActionButton } from '@/components/admin/AdminActionButton';
import { AdminDrawer } from '@/components/admin/AdminDrawer';
import { AdminLoadingState } from '@/components/admin/AdminLoadingState';
import { AdminListToolbar } from '@/components/admin/AdminListToolbar';
import { AdminMediaUpload } from '@/components/admin/AdminMediaUpload';
import { AdminMoreActions } from '@/components/admin/AdminMoreActions';
import { GenreMultiSelect } from '@/components/admin/GenreMultiSelect';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { adminApi } from '@/lib/admin-ui/api';
import { showAdminToast } from '@/lib/admin-ui/toast';

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

interface CurrentAdminUser {
  role: 'admin' | 'organization';
  displayName: string;
}

interface DramaFormState {
  title: string;
  subtitle: string;
  synopsis: string;
  coverPath: string;
  posterPath: string;
  releaseStatus: 'upcoming' | 'released';
  sortOrder: number;
  genreCodes: string[];
}

const emptyForm: DramaFormState = {
  title: '',
  subtitle: '',
  synopsis: '',
  coverPath: '',
  posterPath: '',
  releaseStatus: 'upcoming',
  sortOrder: 0,
  genreCodes: [],
};

export default function AdminDramasPage() {
  const [dramas, setDramas] = useState<AdminDrama[]>([]);
  const [search, setSearch] = useState('');
  const [releaseFilter, setReleaseFilter] = useState('all');
  const [reviewFilter, setReviewFilter] = useState('all');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedDrama, setSelectedDrama] = useState<AdminDrama | null>(null);
  const [form, setForm] = useState<DramaFormState>(emptyForm);
  const [currentUser, setCurrentUser] = useState<CurrentAdminUser | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load() {
    setPageLoading(true);
    try {
      const [dramaData, authData] = await Promise.all([
        adminApi<{ dramas: AdminDrama[] }>('/api/admin/dramas'),
        adminApi<{ user: CurrentAdminUser }>('/api/admin/auth/me'),
      ]);
      setDramas(dramaData.dramas);
      setCurrentUser(authData.user);
    } finally {
      setPageLoading(false);
    }
  }

  useEffect(() => {
    load().catch(ignoreHandledError);
  }, []);

  function ignoreHandledError() {
    // adminApi 已通过全局 toast 展示错误，这里只阻止开发态未处理异常覆盖页面。
  }

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
    setActionBusy(true);
    try {
      await adminApi(`/api/admin/dramas/${dramaId}/submit`, { method: 'POST', body: '{}' });
      showAdminToast({ type: 'success', message: '已提交审核' });
      await load();
    } finally {
      setActionBusy(false);
    }
  }

  async function reviewDrama(dramaId: string, action: 'approve' | 'reject', reason?: string) {
    setActionBusy(true);
    try {
      await adminApi(`/api/admin/dramas/${dramaId}/review`, {
        method: 'POST',
        body: JSON.stringify({ action, reason }),
      });
      showAdminToast({ type: 'success', message: action === 'approve' ? '审核已通过' : '已驳回' });
      await load();
    } finally {
      setActionBusy(false);
    }
  }

  async function updateRelease(dramaId: string, releaseStatus: 'upcoming' | 'released') {
    setActionBusy(true);
    try {
      await adminApi(`/api/admin/dramas/${dramaId}/release`, {
        method: 'POST',
        body: JSON.stringify({ releaseStatus }),
      });
      showAdminToast({ type: 'success', message: releaseStatus === 'released' ? '已上架' : '已下架' });
      await load();
    } finally {
      setActionBusy(false);
    }
  }

  async function saveDrama() {
    setSaving(true);
    try {
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

      showAdminToast({ type: 'success', message: selectedDrama ? '剧集已保存' : '剧集已创建' });
      setDrawerOpen(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  const isOrganizationUser = currentUser?.role === 'organization';
  const isAdminUser = currentUser?.role === 'admin';
  const disableActions = pageLoading || saving || actionBusy;

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

      {pageLoading ? <AdminLoadingState text="剧集数据加载中..." /> : null}

      {!pageLoading ? <div className="overflow-visible rounded-md border border-slate-200 bg-white">
        {visibleDramas.map((drama) => (
          <div key={drama.id} className="grid gap-4 border-b border-slate-200 p-4 last:border-b-0 lg:grid-cols-[112px_1fr_240px]">
            <div className="aspect-[9/16] overflow-hidden rounded-md bg-slate-100">
              {drama.coverUrl ? <img src={drama.coverUrl} alt={drama.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs text-slate-400">无封面</div>}
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
              <AdminActionButton disabled={disableActions} onClick={() => openEditDrawer(drama)}>
                查看
              </AdminActionButton>
              <Link className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700" href={`/admin/dramas/${drama.id}/episodes`}>
                分集
              </Link>
              <AdminMoreActions
                disabled={disableActions}
                actions={[
                  ...(isOrganizationUser && (drama.reviewStatus === 'draft' || drama.reviewStatus === 'rejected')
                    ? [{
                        label: '提交审核',
                        onClick: () => void submitForReview(drama.id).catch(ignoreHandledError),
                      }]
                    : []),
                  ...(isAdminUser && drama.reviewStatus === 'submitted'
                    ? [
                        {
                          label: '审核通过',
                          onClick: () => void reviewDrama(drama.id, 'approve').catch(ignoreHandledError),
                        },
                        {
                          label: '驳回',
                          tone: 'danger' as const,
                          onClick: () => void reviewDrama(drama.id, 'reject', '资料不完整').catch(ignoreHandledError),
                        },
                      ]
                    : []),
                  ...(isAdminUser
                    ? [{
                        label: drama.releaseStatus === 'released' ? '下架' : '上架',
                        disabled: drama.reviewStatus !== 'approved',
                        onClick: () => void updateRelease(drama.id, drama.releaseStatus === 'released' ? 'upcoming' : 'released').catch(ignoreHandledError),
                      }]
                    : []),
                ]}
              />
            </div>
          </div>
        ))}
      </div> : null}

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
            <button className="rounded-md bg-brand-gold px-3 py-2 text-sm text-stone-950 disabled:cursor-not-allowed disabled:opacity-60" disabled={saving} type="button" onClick={() => void saveDrama().catch(ignoreHandledError)}>
              {saving ? '保存中...' : '保存'}
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
          <AdminMediaUpload
            fileKind="cover"
            mediaKind="image"
            previewSize="portrait"
            label="封面图"
            emptyLabel="上传封面图"
            value={form.coverPath}
            previewUrl={selectedDrama?.coverPath === form.coverPath ? selectedDrama.coverUrl : null}
            onChange={(path) => setForm({ ...form, coverPath: path })}
            onClear={() => setForm({ ...form, coverPath: '' })}
          />
          <AdminMediaUpload
            fileKind="poster"
            mediaKind="image"
            previewSize="landscape"
            label="海报"
            emptyLabel="上传海报"
            value={form.posterPath}
            previewUrl={selectedDrama?.posterPath === form.posterPath ? selectedDrama.posterUrl : null}
            onChange={(path) => setForm({ ...form, posterPath: path })}
            onClear={() => setForm({ ...form, posterPath: '' })}
          />
          <GenreMultiSelect value={form.genreCodes} onChange={(genreCodes) => setForm({ ...form, genreCodes })} />
        </div>
      </AdminDrawer>
    </div>
  );
}
