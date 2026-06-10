'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/admin-ui/api';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { ReviewPanel } from '@/components/admin/ReviewPanel';

interface Organization {
  id: string;
  name: string;
  contactName: string;
  contactPhone: string;
  email: string | null;
  creditCode: string;
  businessLicensePath: string;
  status: string;
  rejectReason: string | null;
}

export default function AdminOrganizationDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [error, setError] = useState('');

  async function load() {
    const data = await adminApi<{ organization: Organization }>(`/api/admin/organizations/${id}`);
    setOrganization(data.organization);
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : '获取机构失败'));
  }, [id]);

  async function review(action: 'approve' | 'reject', reason?: string) {
    await adminApi(`/api/admin/organizations/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ action, reason }),
    });
    await load();
  }

  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl text-brand-gold">机构详情</h1>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {organization ? (
        <>
          <section className="rounded-md border border-white/10 bg-brand-card p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl text-stone-100">{organization.name}</h2>
              <StatusBadge status={organization.status} />
            </div>
            <div className="mt-4 grid gap-3 text-sm text-stone-300 md:grid-cols-2">
              <p>联系人：{organization.contactName}</p>
              <p>电话：{organization.contactPhone}</p>
              <p>邮箱：{organization.email || '-'}</p>
              <p>信用代码：{organization.creditCode}</p>
              <p className="break-all md:col-span-2">营业执照：{organization.businessLicensePath}</p>
              {organization.rejectReason ? <p className="md:col-span-2">驳回原因：{organization.rejectReason}</p> : null}
            </div>
          </section>
          <ReviewPanel approveLabel="通过机构" rejectLabel="驳回机构" onReview={review} />
        </>
      ) : null}
    </div>
  );
}
