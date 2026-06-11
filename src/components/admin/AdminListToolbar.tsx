'use client';

import type { ReactNode } from 'react';

export interface AdminFilterOption {
  label: string;
  value: string;
}

export interface AdminFilterGroup {
  label: string;
  value: string;
  options: AdminFilterOption[];
  onChange: (value: string) => void;
}

interface AdminListToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  filterGroups: AdminFilterGroup[];
  action?: ReactNode;
}

export function AdminListToolbar({ search, onSearchChange, filterGroups, action }: AdminListToolbarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
      <input
        className="min-h-10 rounded-md border border-slate-300 px-3 text-sm"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="搜索"
      />
      <div className="flex flex-wrap items-center gap-3">
        {filterGroups.map((group) => (
          <label key={group.label} className="flex items-center gap-2 text-sm text-slate-600">
            {group.label}
            <select
              className="rounded-md border border-slate-300 bg-white px-2 py-2"
              value={group.value}
              onChange={(event) => group.onChange(event.target.value)}
            >
              {group.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ))}
        {action}
      </div>
    </div>
  );
}
