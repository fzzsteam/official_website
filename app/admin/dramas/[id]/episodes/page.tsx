'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AdminActionButton } from '@/components/admin/AdminActionButton';
import { AdminDrawer } from '@/components/admin/AdminDrawer';
import { AdminLoadingState } from '@/components/admin/AdminLoadingState';
import { AdminListToolbar } from '@/components/admin/AdminListToolbar';
import { AdminMediaPreview } from '@/components/admin/AdminMediaPreview';
import { AdminMediaUpload } from '@/components/admin/AdminMediaUpload';
import { AdminMoreActions } from '@/components/admin/AdminMoreActions';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { adminApi } from '@/lib/admin-ui/api';
import { showAdminToast } from '@/lib/admin-ui/toast';

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

interface EpisodeFormState {
  episodeNo: number;
  title: string;
  videoPath: string;
  durationSeconds: number;
  status: 'draft' | 'published';
}

const emptyEpisodeForm: EpisodeFormState = {
  episodeNo: 1,
  title: '',
  videoPath: '',
  durationSeconds: 0,
  status: 'draft',
};

export default function AdminDramaEpisodesPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [episodes, setEpisodes] = useState<AdminEpisode[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedEpisode, setSelectedEpisode] = useState<AdminEpisode | null>(null);
  const [form, setForm] = useState<EpisodeFormState>(emptyEpisodeForm);
  const [pageLoading, setPageLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load() {
    setPageLoading(true);
    try {
      const data = await adminApi<{ episodes: AdminEpisode[] }>(`/api/admin/dramas/${id}/episodes`);
      setEpisodes(data.episodes);
    } finally {
      setPageLoading(false);
    }
  }

  useEffect(() => {
    load().catch(ignoreHandledError);
  }, [id]);

  function ignoreHandledError() {
    // adminApi 已通过全局 toast 展示错误，这里只阻止开发态未处理异常覆盖页面。
  }

  const visibleEpisodes = episodes.filter((episode) => {
    const matchesSearch = episode.title.includes(search);
    const matchesStatus = statusFilter === 'all' || episode.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  function openCreateDrawer() {
    setSelectedEpisode(null);
    const maxEpisodeNo = episodes.reduce((max, episode) => Math.max(max, episode.episodeNo), 0);
    setForm({ ...emptyEpisodeForm, episodeNo: maxEpisodeNo + 1 });
    setDrawerOpen(true);
  }

  function openEditDrawer(episode: AdminEpisode) {
    setSelectedEpisode(episode);
    setForm({
      episodeNo: episode.episodeNo,
      title: episode.title,
      videoPath: episode.videoPath,
      durationSeconds: episode.durationSeconds,
      status: episode.status,
    });
    setDrawerOpen(true);
  }

  async function saveEpisode() {
    setSaving(true);
    try {
      const payload = { ...form, summary: '', coverPath: '' };
      if (selectedEpisode) {
        await adminApi(`/api/admin/dramas/${id}/episodes/${selectedEpisode.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await adminApi(`/api/admin/dramas/${id}/episodes`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      showAdminToast({ type: 'success', message: selectedEpisode ? '分集已保存' : '分集已创建' });
      setDrawerOpen(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function updateEpisodeStatus(episodeId: string, status: 'draft' | 'published') {
    setActionBusy(true);
    try {
      await adminApi(`/api/admin/dramas/${id}/episodes/${episodeId}/status`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      });
      showAdminToast({ type: 'success', message: status === 'published' ? '分集已发布' : '分集已撤回' });
      await load();
    } finally {
      setActionBusy(false);
    }
  }

  async function remove(episodeId: string) {
    setActionBusy(true);
    try {
      await adminApi(`/api/admin/dramas/${id}/episodes/${episodeId}`, { method: 'DELETE' });
      showAdminToast({ type: 'success', message: '分集已删除' });
      await load();
    } finally {
      setActionBusy(false);
    }
  }

  const disableActions = pageLoading || saving || actionBusy;

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

      {pageLoading ? <AdminLoadingState text="分集数据加载中..." /> : null}

      {!pageLoading ? <div className="overflow-visible rounded-md border border-slate-200 bg-white">
        {visibleEpisodes.map((episode) => (
          <div key={episode.id} className="grid gap-4 border-b border-slate-200 p-4 last:border-b-0 lg:grid-cols-[220px_1fr_180px]">
            <AdminMediaPreview type="video" url={episode.videoPreviewUrl} label={`第${episode.episodeNo}集预览`} />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900">第{episode.episodeNo}集 · {episode.title}</h2>
                <StatusBadge status={episode.status} />
              </div>
              <p className="text-xs text-slate-400">更新时间：{episode.updatedAt}</p>
            </div>
            <div className="flex flex-wrap items-start justify-end gap-2">
              <AdminActionButton disabled={disableActions} onClick={() => openEditDrawer(episode)}>
                查看
              </AdminActionButton>
              <AdminMoreActions
                disabled={disableActions}
                actions={[
                  {
                    label: episode.status === 'published' ? '撤回' : '发布',
                    onClick: () => void updateEpisodeStatus(episode.id, episode.status === 'published' ? 'draft' : 'published').catch(ignoreHandledError),
                  },
                  {
                    label: '删除',
                    tone: 'danger',
                    onClick: () => void remove(episode.id).catch(ignoreHandledError),
                  },
                ]}
              />
            </div>
          </div>
        ))}
      </div> : null}

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
            <button className="rounded-md bg-brand-gold px-3 py-2 text-sm text-stone-950 disabled:cursor-not-allowed disabled:opacity-60" disabled={saving} type="button" onClick={() => void saveEpisode().catch(ignoreHandledError)}>
              {saving ? '保存中...' : '保存'}
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
          <AdminMediaUpload
            fileKind="episode"
            mediaKind="video"
            previewSize="video"
            label="分集视频"
            emptyLabel="上传分集视频"
            value={form.videoPath}
            previewUrl={selectedEpisode?.videoPath === form.videoPath ? selectedEpisode.videoPreviewUrl : null}
            onChange={(path) => setForm({ ...form, videoPath: path })}
            onClear={() => setForm({ ...form, videoPath: '' })}
          />
        </div>
      </AdminDrawer>
    </div>
  );
}
