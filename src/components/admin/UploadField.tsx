'use client';

import { useState } from 'react';

interface UploadFieldProps {
  fileKind: 'license' | 'cover' | 'poster' | 'trailer' | 'episode' | 'cast';
  value: string;
  onChange: (path: string) => void;
}

export function UploadField({ fileKind, value, onChange }: UploadFieldProps) {
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
    <div className="rounded-md border border-white/10 bg-brand-card p-3">
      <input
        type="file"
        className="text-sm text-stone-200"
        disabled={uploading}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
      {value ? <p className="mt-2 break-all text-xs text-stone-400">{value}</p> : null}
    </div>
  );
}
