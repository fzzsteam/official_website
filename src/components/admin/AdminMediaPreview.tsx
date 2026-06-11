'use client';

interface AdminMediaPreviewProps {
  type: 'image' | 'video' | 'file';
  url: string | null;
  label?: string;
}

export function AdminMediaPreview({ type, url, label }: AdminMediaPreviewProps) {
  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-slate-50">
      <div className="border-b border-slate-200 px-3 py-2 text-xs text-slate-500">{label || '媒体预览'}</div>
      <div className="flex min-h-32 items-center justify-center p-3">
        {!url ? <span className="text-sm text-slate-400">暂无文件</span> : null}
        {url && type === 'image' ? <img src={url} alt={label || '媒体预览'} className="max-h-52 rounded-md object-cover" /> : null}
        {url && type === 'video' ? <video src={url} controls className="max-h-52 w-full rounded-md bg-black" /> : null}
        {url && type === 'file' ? (
          <a href={url} target="_blank" rel="noreferrer" className="text-sm text-brand-gold underline">
            查看文件
          </a>
        ) : null}
      </div>
    </div>
  );
}
