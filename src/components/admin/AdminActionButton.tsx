'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface AdminActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  tone?: 'default' | 'danger';
}

export function AdminActionButton({
  children,
  tone = 'default',
  className = '',
  disabled,
  ...props
}: AdminActionButtonProps) {
  const toneClassName =
    tone === 'danger'
      ? 'border-red-200 text-red-600 hover:bg-red-50'
      : 'border-slate-200 text-slate-700 hover:bg-slate-50';

  return (
    <button
      type="button"
      className={`inline-flex items-center rounded-md border px-3 py-1.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${toneClassName} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
