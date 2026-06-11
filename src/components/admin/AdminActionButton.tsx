'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type AdminActionButtonTone = 'default' | 'primary' | 'success' | 'warning' | 'danger';

interface AdminActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  tone?: AdminActionButtonTone;
}

const toneClassName: Record<AdminActionButtonTone, string> = {
  default: 'border-slate-200 text-slate-700 hover:bg-slate-50',
  primary: 'border-blue-200 text-blue-600 hover:bg-blue-50',
  success: 'border-emerald-200 text-emerald-600 hover:bg-emerald-50',
  warning: 'border-amber-200 text-amber-600 hover:bg-amber-50',
  danger: 'border-red-200 text-red-600 hover:bg-red-50',
};

export function AdminActionButton({
  children,
  tone = 'default',
  className = '',
  disabled,
  ...props
}: AdminActionButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex items-center whitespace-nowrap rounded-md border px-3 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${toneClassName[tone]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
