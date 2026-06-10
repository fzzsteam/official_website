import Link from 'next/link';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl text-brand-gold">后台概览</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Link className="rounded-md border border-white/10 bg-brand-card p-5 hover:border-brand-gold/60" href="/admin/organizations">
          <span className="text-lg text-stone-100">机构审核</span>
          <p className="mt-2 text-sm text-stone-400">查看注册机构并完成审核。</p>
        </Link>
        <Link className="rounded-md border border-white/10 bg-brand-card p-5 hover:border-brand-gold/60" href="/admin/dramas">
          <span className="text-lg text-stone-100">剧集管理</span>
          <p className="mt-2 text-sm text-stone-400">创建、提交和审核后台剧集。</p>
        </Link>
      </div>
    </div>
  );
}
