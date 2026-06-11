'use client';

import { useState } from 'react';

export type MediaKind = 'image' | 'video' | 'file';
export type FileKind = 'license' | 'cover' | 'poster' | 'trailer' | 'episode' | 'cast';

interface AdminMediaUploadProps {
  fileKind: FileKind;
  mediaKind?: MediaKind;
  value: string;
  onChange: (path: string) => void;
  onClear?: () => void;
}

export function AdminMediaUpload({
  fileKind,
  mediaKind = 'file',
  value,
  onChange,
  onClear,
}: AdminMediaUploadProps) {
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const policyResponse = await fetch('/api/admin/uploads/policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileKind }),
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
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-md border border-slate-200 bg-white p-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-700">上传文件</p>
          <p className="text-xs text-slate-500">{mediaKind === 'video' ? '支持视频文件' : '仅保存 OSS 路径'}</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="inline-flex cursor-pointer items-center rounded-md bg-brand-gold px-3 py-2 text-sm font-medium text-stone-950">
            {uploading ? '上传中...' : '选择文件'}
            <input
              type="file"
              className="hidden"
              disabled={uploading}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void handleFile(file);
                }
              }}
            />
          </label>
          {onClear ? (
            <button
              type="button"
              className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
              onClick={onClear}
            >
              清空
            </button>
          ) : null}
        </div>
      </div>
      {value ? <p className="mt-3 break-all rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-500">{value}</p> : null}
    </div>
  );
}
