'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AdminDrawer } from '@/components/admin/AdminDrawer';
import { AdminListToolbar } from '@/components/admin/AdminListToolbar';
import { AdminMediaPreview } from '@/components/admin/AdminMediaPreview';
import { AdminMediaUpload } from '@/components/admin/AdminMediaUpload';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { adminApi } from '@/lib/admin-ui/api';

interface AdminEpisode {
  id: string;
  episodeNo: number;
  title: string;
  summary: string | null;
  videoPath: string;
  videoPreviewUrl: string | null;
  videoUrl: string | null;
  coverPath: string | null;
  coverUrl: string | null;
  durationSeconds: number;
  status: 'draft' | 'published';
  updatedAt: string;
}

const emptyEpisodeForm = {
  episodeNo: 1,
  title: '',
  summary: '',
  videoPath: '',
  coverPath: '',
  durationSeconds: 0,
  status: 'draft' as const,
};

export default function AdminDramaEpisodesPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [episodes, setEpisodes] = useState<AdminEpisode[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedEpisode, setSelectedEpisode] = useState<AdminEpisode | null>(null);
  const [form, setForm] = useState(emptyEpisodeForm);

  async function load() {
    const data = await adminApi<{ episodes: AdminEpisode[] }>(`/api/admin/dramas/${id}/episodes`);
    setEpisodes(data.episodes);
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : '获取分集失败'));
  }, [id]);

  const visibleEpisodes = episodes.filter((episode) => {
    const matchesSearch = episode.title.includes(search);
    const matchesStatus = statusFilter === 'all' || episode.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  function openCreateDrawer() {
    setSelectedEpisode(null);
    setForm(emptyEpisodeForm);
    setDrawerOpen(true);
  }

  function openEditDrawer(episode: AdminEpisode) {
    setSelectedEpisode(episode);
    setForm({
      episodeNo: episode.episodeNo,
      title: episode.title,
      summary: episode.summary || '',
      videoPath: episode.videoPath,
      coverPath: episode.coverPath || '',
      durationSeconds: episode.durationSeconds,
      status: episode.status,
    });
    setDrawerOpen(true);
  }

  async function saveEpisode() {
    if (selectedEpisode) {
      await adminApi(`/api/admin/dramas/${id}/episodes/${selectedEpisode.id}`, {
        method: 'PUT',
        body: JSON.stringify(form),
      });
    } else {
      await adminApi(`/api/admin/dramas/${id}/episodes`, {
        method: 'POST',
        body: JSON.stringify(form),
      });
    }

    setDrawerOpen(false);
    await load();
  }

  async function updateEpisodeStatus(episodeId: string, status: 'draft' | 'published') {
    await adminApi(`/api/admin/dramas/${id}/episodes/${episodeId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
    await load();
  }

  async function remove(episodeId: string) {
    await adminApi(`/api/admin/dramas/${id}/episodes/${episodeId}`, { method: 'DELETE' });
    await load();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-brand-gold">分集管理</h1>
          <p className="mt-1 text-sm text-slate-500">维护视频文件、封面和发布状态。</p>
        </div>
        <button className="rounded-md bg-brand-gold px-3 py-2 text-sm text-stone-950" type="button" onClick={openCreateDrawer}>
          新建分集
        </button>
      </div>

      <AdminListToolbar
        search={search}
        onSearchChange={setSearch}
        filterGroups={[
          {
            label: '状态',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: '全部', value: 'all' },
              { label: '草稿', value: 'draft' },
              { label: '已发布', value: 'published' },
            ],
          },
        ]}
      />

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        {visibleEpisodes.map((episode) => (
          <div key={episode.id} className="grid gap-4 border-b border-slate-200 p-4 last:border-b-0 lg:grid-cols-[220px_1fr_220px]">
            <AdminMediaPreview type="video" url={episode.videoPreviewUrl} label={`第${episode.episodeNo}集预览`} />
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900">第{episode.episodeNo}集 · {episode.title}</h2>
                <StatusBadge status={episode.status} />
              </div>
              <p className="text-sm text-slate-500">{episode.summary || '暂无简介'}</p>
              <p className="text-xs text-slate-400">videoPreviewUrl: {episode.videoPreviewUrl || '未生成'}</p>
            </div>
            <div className="flex flex-wrap items-start justify-end gap-2">
              <button className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700" type="button" onClick={() => openEditDrawer(episode)}>
                编辑
              </button>
              <button className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700" type="button" onClick={() => void updateEpisodeStatus(episode.id, episode.status === 'published' ? 'draft' : 'published')}>
                {episode.status === 'published' ? '撤回' : '发布'}
              </button>
              <button className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700" type="button" onClick={() => void remove(episode.id)}>
                删除
              </button>
            </div>
          </div>
        ))}
      </div>

      <AdminDrawer
        open={drawerOpen}
        title={selectedEpisode ? '编辑分集' : '新建分集'}
        subtitle={selectedEpisode ? selectedEpisode.title : '填写分集基础信息'}
        onClose={() => setDrawerOpen(false)}
        footer={
          <div className="flex items-center justify-end gap-2">
            <button className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700" type="button" onClick={() => setDrawerOpen(false)}>
              取消
            </button>
            <button className="rounded-md bg-brand-gold px-3 py-2 text-sm text-stone-950" type="button" onClick={() => void saveEpisode()}>
              保存
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm text-slate-600">集数</span>
            <input className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" type="number" value={form.episodeNo} onChange={(event) => setForm({ ...form, episodeNo: Number(event.target.value) })} />
          </label>
          <label className="block space-y-2">
            <span className="text-sm text-slate-600">标题</span>
            <input className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </label>
          <label className="block space-y-2">
            <span className="text-sm text-slate-600">简介</span>
            <textarea className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" rows={4} value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} />
          </label>
          <AdminMediaUpload fileKind="episode" mediaKind="video" value={form.videoPath} onChange={(path) => setForm({ ...form, videoPath: path })} onClear={() => setForm({ ...form, videoPath: '' })} />
          <AdminMediaUpload fileKind="cover" mediaKind="image" value={form.coverPath} onChange={(path) => setForm({ ...form, coverPath: path })} onClear={() => setForm({ ...form, coverPath: '' })} />
        </div>
      </AdminDrawer>
    </div>
  );
}
