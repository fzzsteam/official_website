const statusText: Record<string, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已驳回',
  disabled: '已禁用',
  draft: '草稿',
  submitted: '待审核',
  published: '已发布',
  upcoming: '待上架',
  released: '已上架',
};

type StatusTone = 'success' | 'warning' | 'danger' | 'neutral';

const statusTone: Record<string, StatusTone> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  disabled: 'danger',
  draft: 'neutral',
  submitted: 'warning',
  published: 'success',
  upcoming: 'neutral',
  released: 'success',
};

const toneClassName: Record<StatusTone, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  danger: 'border-red-200 bg-red-50 text-red-700',
  neutral: 'border-slate-200 bg-slate-100 text-slate-600',
};

export function StatusBadge({ status }: { status: string }) {
  const tone = statusTone[status] || 'neutral';
  return (
    <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-medium ${toneClassName[tone]}`}>
      {statusText[status] || status}
    </span>
  );
}
