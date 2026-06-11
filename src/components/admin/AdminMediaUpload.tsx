'use client';

import { useEffect, useId, useState } from 'react';
import { showAdminToast } from '@/lib/admin-ui/toast';

export type MediaKind = 'image' | 'video' | 'file';
export type FileKind = 'license' | 'cover' | 'poster' | 'trailer' | 'episode' | 'cast';
export type UploadScope = 'admin' | 'registration';

interface AdminMediaUploadProps {
  fileKind: FileKind;
  uploadScope?: UploadScope;
  mediaKind?: MediaKind;
  previewSize?: 'portrait' | 'landscape' | 'document' | 'video';
  label?: string;
  emptyLabel?: string;
  value: string;
  previewUrl?: string | null;
  onChange: (path: string) => void;
  onClear?: () => void;
}

export function AdminMediaUpload({
  fileKind,
  uploadScope = 'admin',
  mediaKind = 'file',
  previewSize,
  label,
  emptyLabel,
  value,
  previewUrl = null,
  onChange,
  onClear,
}: AdminMediaUploadProps) {
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (localPreviewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [localPreviewUrl]);

  async function handleFile(file: File) {
    const nextPreviewUrl = URL.createObjectURL(file);
    if (localPreviewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(localPreviewUrl);
    }
    setLocalPreviewUrl(nextPreviewUrl);

    setUploading(true);
    try {
      const policyResponse = await fetch('/api/admin/uploads/policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileKind, uploadScope }),
      });
      const payload = await policyResponse.json();
      if (!policyResponse.ok) throw new Error(payload?.error?.message || '获取上传凭证失败');

      const upload = payload.data.upload;
      const objectKey = `${upload.objectKey}-${file.name}`;
      const formData = new FormData();
      formData.append('key', objectKey);
      formData.append('policy', upload.policy);
      formData.append('OSSAccessKeyId', upload.accessKeyId);
      formData.append('signature', upload.signature);
      formData.append('file', file);

      const ossResponse = await fetch(upload.host, { method: 'POST', body: formData });
      if (!ossResponse.ok) throw new Error('文件上传失败');

      onChange(objectKey);
    } catch (error) {
      showAdminToast({
        type: 'error',
        message: error instanceof Error ? error.message : '文件上传失败',
      });
    } finally {
      setUploading(false);
    }
  }

  function handleClear() {
    if (localPreviewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(localPreviewUrl);
    }
    setLocalPreviewUrl(null);
    onClear?.();
  }

  const resolvedPreviewUrl = localPreviewUrl || previewUrl;
  const hasPreview = Boolean(resolvedPreviewUrl);
  const formatText =
    mediaKind === 'video'
      ? '支持 MP4、MOV 格式'
      : mediaKind === 'image'
        ? '支持 JPG、PNG、WEBP 格式'
        : '支持 PDF、JPG、PNG 格式';
  const resolvedPreviewSize =
    previewSize || (mediaKind === 'video' ? 'video' : mediaKind === 'image' ? 'landscape' : 'document');
  const previewSizeClassName =
    resolvedPreviewSize === 'portrait'
      ? 'aspect-[9/16] max-w-[110px]'
      : resolvedPreviewSize === 'landscape'
        ? 'aspect-video max-w-[180px]'
        : resolvedPreviewSize === 'video'
          ? 'aspect-video max-w-[210px]'
          : 'aspect-[4/3] max-w-[210px]';

  return (
    <div className="space-y-2">
      {label ? <p className="text-sm text-slate-600">{label}</p> : null}
      <div className={`relative w-full ${previewSizeClassName}`}>
        <input
          id={inputId}
          type="file"
          className="hidden"
          disabled={uploading}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void handleFile(file);
            }
            event.currentTarget.value = '';
          }}
        />
        {hasPreview && onClear ? (
          <button
            type="button"
            aria-label="清空上传文件"
            className="absolute right-1.5 top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-black/65 text-xs text-white transition hover:bg-black/80"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              handleClear();
            }}
          >
            ×
          </button>
        ) : null}
        {!resolvedPreviewUrl ? (
          <label
            htmlFor={inputId}
            className="flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 px-2 py-2 text-center transition hover:border-slate-400 hover:bg-slate-100"
          >
            <span className="text-lg leading-none text-slate-300">+</span>
            <span className="mt-1 text-xs font-medium text-slate-600">{emptyLabel || '上传文件'}</span>
            <span className="mt-0.5 text-[10px] text-slate-400">{formatText}</span>
          </label>
        ) : null}

        {resolvedPreviewUrl && mediaKind === 'image' ? (
          <label
            htmlFor={inputId}
            className="block h-full w-full cursor-pointer overflow-hidden rounded-md border border-slate-200 bg-slate-50"
          >
            <img src={resolvedPreviewUrl} alt="上传文件预览" className="h-full w-full object-cover" />
          </label>
        ) : null}

        {resolvedPreviewUrl && mediaKind === 'video' ? (
          <label
            htmlFor={inputId}
            className="block h-full w-full cursor-pointer overflow-hidden rounded-md border border-slate-200 bg-slate-950"
          >
            <video src={resolvedPreviewUrl} controls className="h-full w-full" />
          </label>
        ) : null}

        {resolvedPreviewUrl && mediaKind === 'file' ? (
          <label
            htmlFor={inputId}
            className="flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-center"
          >
            <span className="text-xs font-medium text-slate-700">上传文件</span>
            <span className="mt-0.5 text-[10px] text-slate-400">{formatText}</span>
            <a
              href={resolvedPreviewUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 text-xs text-brand-gold underline"
              onClick={(event) => event.stopPropagation()}
            >
              查看文件
            </a>
          </label>
        ) : null}

        {uploading && hasPreview ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-md bg-black/45 text-xs font-medium text-white">
            上传中...
          </div>
        ) : null}
      </div>
    </div>
  );
}
