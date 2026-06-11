'use client';

import { AdminMediaUpload } from './AdminMediaUpload';

interface UploadFieldProps {
  fileKind: 'license' | 'cover' | 'poster' | 'trailer' | 'episode' | 'cast';
  uploadScope?: 'admin' | 'registration';
  mediaKind?: 'image' | 'video' | 'file';
  previewSize?: 'portrait' | 'landscape' | 'document' | 'video';
  value: string;
  previewUrl?: string | null;
  onChange: (path: string) => void;
}

export function UploadField({ fileKind, uploadScope, mediaKind, previewSize, value, previewUrl, onChange }: UploadFieldProps) {
  return <AdminMediaUpload fileKind={fileKind} uploadScope={uploadScope} mediaKind={mediaKind} previewSize={previewSize} value={value} previewUrl={previewUrl} onChange={onChange} />;
}
