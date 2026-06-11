'use client';

interface AdminLoadingStateProps {
  text?: string;
  variant?: 'banner' | 'panel';
}

export function AdminLoadingState({ text = '加载中...', variant = 'panel' }: AdminLoadingStateProps) {
  if (variant === 'banner') {
    return (
      <div className="flex items-center justify-center gap-2 rounded-md border border-brand-gold/30 bg-brand-gold/10 px-3 py-2 text-sm text-brand-gold">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-gold/30 border-t-brand-gold" aria-hidden="true" />
        {text}
      </div>
    );
  }

  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-3 text-sm text-slate-500">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-brand-gold" aria-hidden="true" />
      {text}
    </div>
  );
}
