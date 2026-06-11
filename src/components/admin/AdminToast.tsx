'use client';

import { useEffect, useRef, useState } from 'react';
import { subscribeAdminToast, type AdminToastPayload } from '@/lib/admin-ui/toast';

interface AdminToastItem extends Required<AdminToastPayload> {
  id: number;
}

const toastStyle = {
  error: 'border-red-200 bg-red-50 text-red-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  info: 'border-slate-200 bg-white text-slate-700',
};

export function AdminToast() {
  const [toasts, setToasts] = useState<AdminToastItem[]>([]);
  const nextId = useRef(1);

  useEffect(() => {
    return subscribeAdminToast((payload) => {
      const id = nextId.current;
      nextId.current += 1;
      const toast: AdminToastItem = {
        id,
        type: payload.type || 'error',
        message: payload.message,
      };

      setToasts((current) => [...current, toast].slice(-3));
      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== id));
      }, 5000);
    });
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed left-1/2 top-6 z-[9999] flex w-[calc(100vw-32px)] max-w-[420px] -translate-x-1/2 flex-col items-stretch gap-2">
      {toasts.map((toast) => (
        <div key={toast.id} role="status" className={`rounded-md border px-4 py-3 text-center text-sm font-medium shadow-2xl ${toastStyle[toast.type]}`}>
          {toast.message}
        </div>
      ))}
    </div>
  );
}
