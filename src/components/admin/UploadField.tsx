'use client';

import { AdminMediaUpload } from './AdminMediaUpload';

interface UploadFieldProps {
  fileKind: 'license' | 'cover' | 'poster' | 'trailer' | 'episode' | 'cast';
  value: string;
  onChange: (path: string) => void;
}

export function UploadField({ fileKind, value, onChange }: UploadFieldProps) {
  // Compatibility wrapper: upload flow still uses fetch('/api/admin/uploads/policy') inside AdminMediaUpload.
  return <AdminMediaUpload fileKind={fileKind} value={value} onChange={onChange} />;
}
