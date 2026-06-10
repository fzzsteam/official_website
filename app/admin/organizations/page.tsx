'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/admin-ui/api';
import { StatusBadge } from '@/components/admin/StatusBadge';

interface Organization {
  id: string;
  name: string;
  contactName: string;
  contactPhone: string;
  status: string;
  createdAt: string;
}

export default function AdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi<{ organizations: Organization[] }>('/api/admin/organizations')
      .then((data) => setOrganizations(data.organizations))
      .catch((err) => setError(err instanceof Error ? err.message : '获取机构失败'));
  }, []);

  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl text-brand-gold">机构管理</h1>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      <div className="overflow-hidden rounded-md border border-white/10 bg-brand-card">
        {organizations.map((organization) => (
          <Link key={organization.id} href={`/admin/organizations/${organization.id}`} className="grid gap-2 border-b border-white/10 p-4 last:border-b-0 md:grid-cols-[1fr_120px_160px]">
            <div>
              <p className="text-stone-100">{organization.name}</p>
              <p className="text-sm text-stone-400">{organization.contactName} · {organization.contactPhone}</p>
            </div>
            <StatusBadge status={organization.status} />
            <span className="text-sm text-stone-400">{organization.createdAt}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
