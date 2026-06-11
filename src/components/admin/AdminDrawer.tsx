'use client';

import type { ReactNode } from 'react';

interface AdminDrawerProps {
  open: boolean;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
}

export function AdminDrawer({ open, title, subtitle, children, footer, onClose }: AdminDrawerProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-slate-950/40" aria-label="关闭抽屉背景" onClick={onClose} />
      <section
        role="dialog"
        aria-modal="true"
        className="fixed inset-y-0 right-0 flex w-full flex-col bg-white text-slate-950 shadow-2xl md:max-w-[560px]"
      >
        <header className="border-b border-slate-200 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">{title}</h2>
              {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
            </div>
            <button
              className="rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
              type="button"
              onClick={onClose}
            >
              关闭
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? <footer className="border-t border-slate-200 bg-slate-50 px-5 py-4">{footer}</footer> : null}
      </section>
    </div>
  );
}
