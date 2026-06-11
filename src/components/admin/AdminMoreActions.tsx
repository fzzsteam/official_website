'use client';

import type { ReactNode } from 'react';

type MoreActionTone = 'default' | 'danger';

interface MoreAction {
  label: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: MoreActionTone;
}

interface AdminMoreActionsProps {
  actions: MoreAction[];
  disabled?: boolean;
}

const itemToneClassName: Record<MoreActionTone, string> = {
  default: 'text-slate-700 hover:bg-slate-50',
  danger: 'text-red-600 hover:bg-red-50',
};

export function AdminMoreActions({ actions, disabled }: AdminMoreActionsProps) {
  const activeActions = actions.filter(Boolean);

  if (activeActions.length === 0) {
    return null;
  }

  return (
    <div className="group relative inline-flex">
      <button
        type="button"
        className="inline-flex items-center whitespace-nowrap rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={disabled}
      >
        更多
      </button>
      <div className="invisible absolute right-0 top-full z-20 mt-1 min-w-[112px] rounded-md border border-slate-200 bg-white py-1 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
        {activeActions.map((action, index) => (
          <button
            key={index}
            type="button"
            className={`block w-full whitespace-nowrap px-3 py-2 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${itemToneClassName[action.tone || 'default']}`}
            disabled={disabled || action.disabled}
            onClick={action.onClick}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
