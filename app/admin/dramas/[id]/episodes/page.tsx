'use client';

import { useParams } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { adminApi } from '@/lib/admin-ui/api';
import { FormField, adminInputClassName } from '@/components/admin/FormField';

interface Episode {
  id: string;
  episodeNo: number;
  title: string;
  videoPath: string;
  status: string;
}

export default function AdminDramaEpisodesPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [form, setForm] = useState({ episodeNo: 1, title: '', summary: '', videoPath: '', coverPath: '', durationSeconds: 0, accessLevel: 'member', status: 'draft' });
  const [error, setError] = useState('');

  async function load() {
    const data = await adminApi<{ episodes: Episode[] }>(`/api/admin/dramas/${id}/episodes`);
    setEpisodes(data.episodes);
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : '获取分集失败'));
  }, [id]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await adminApi(`/api/admin/dramas/${id}/episodes`, {
      method: 'POST',
      body: JSON.stringify(form),
    });
    await load();
  }

  async function remove(episodeId: string) {
    await adminApi(`/api/admin/dramas/${id}/episodes/${episodeId}`, { method: 'DELETE' });
    await load();
  }

  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl text-brand-gold">分集管理</h1>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      <form className="grid gap-4 rounded-md border border-white/10 bg-brand-card p-5 md:grid-cols-2" onSubmit={save}>
        <FormField label="集数"><input className={adminInputClassName} type="number" value={form.episodeNo} onChange={(event) => setForm({ ...form, episodeNo: Number(event.target.value) })} /></FormField>
        <FormField label="标题"><input className={adminInputClassName} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></FormField>
        <div className="md:col-span-2"><FormField label="视频 path"><input className={adminInputClassName} value={form.videoPath} onChange={(event) => setForm({ ...form, videoPath: event.target.value })} /></FormField></div>
        <button className="rounded-md bg-brand-gold px-4 py-2 text-sm text-stone-950 md:col-span-2" type="submit">保存分集</button>
      </form>
      <div className="overflow-hidden rounded-md border border-white/10 bg-brand-card">
        {episodes.map((episode) => (
          <div key={episode.id} className="flex items-center justify-between gap-3 border-b border-white/10 p-4 last:border-b-0">
            <div>
              <p className="text-stone-100">第{episode.episodeNo}集 · {episode.title}</p>
              <p className="break-all text-sm text-stone-400">{episode.videoPath}</p>
            </div>
            <button className="rounded-md border border-white/10 px-3 py-2 text-sm text-stone-100" onClick={() => void remove(episode.id)}>删除</button>
          </div>
        ))}
      </div>
    </div>
  );
}
