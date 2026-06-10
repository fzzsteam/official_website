import type { ReactNode } from 'react';

export function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm text-stone-300">{label}</span>
      {children}
    </label>
  );
}

export const adminInputClassName = 'w-full rounded-md border border-white/10 bg-brand-card px-3 py-2 text-sm text-stone-100 outline-none focus:border-brand-gold';
