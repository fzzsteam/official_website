'use client';

import { FormEvent, useState } from 'react';
import { adminApi } from '@/lib/admin-ui/api';
import { FormField, adminInputClassName } from '@/components/admin/FormField';
import { UploadField } from '@/components/admin/UploadField';

export default function AdminNewDramaPage() {
  const [form, setForm] = useState({
    slug: '',
    title: '',
    subtitle: '',
    synopsis: '',
    coverPath: '',
    posterPath: '',
    trailerPath: '',
    releaseStatus: 'upcoming',
    sortOrder: 0,
  });
  const [error, setError] = useState('');

  function updateField(field: keyof typeof form, value: string | number) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    try {
      const data = await adminApi<{ drama: { id: string } }>('/api/admin/dramas', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      window.location.href = `/admin/dramas/${data.drama.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建剧集失败');
    }
  }

  return (
    <form className="space-y-4 rounded-md border border-white/10 bg-brand-card p-5" onSubmit={handleSubmit}>
      <h1 className="font-display text-3xl text-brand-gold">新建剧集</h1>
      <FormField label="Slug"><input className={adminInputClassName} value={form.slug} onChange={(event) => updateField('slug', event.target.value)} /></FormField>
      <FormField label="标题"><input className={adminInputClassName} value={form.title} onChange={(event) => updateField('title', event.target.value)} /></FormField>
      <FormField label="副标题"><input className={adminInputClassName} value={form.subtitle} onChange={(event) => updateField('subtitle', event.target.value)} /></FormField>
      <FormField label="简介"><textarea className={adminInputClassName} rows={4} value={form.synopsis} onChange={(event) => updateField('synopsis', event.target.value)} /></FormField>
      <FormField label="封面"><UploadField fileKind="cover" value={form.coverPath} onChange={(path) => updateField('coverPath', path)} /></FormField>
      <FormField label="海报"><UploadField fileKind="poster" value={form.posterPath} onChange={(path) => updateField('posterPath', path)} /></FormField>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      <button className="rounded-md bg-brand-gold px-4 py-2 text-sm text-stone-950" type="submit">创建</button>
    </form>
  );
}
