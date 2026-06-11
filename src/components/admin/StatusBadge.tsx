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

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className="inline-flex rounded-md border border-brand-gold/30 bg-brand-gold/10 px-2 py-1 text-xs text-brand-gold">
      {statusText[status] || status}
    </span>
  );
}
