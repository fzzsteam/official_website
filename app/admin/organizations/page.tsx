'use client';

import { useEffect, useState } from 'react';
import { AdminDrawer } from '@/components/admin/AdminDrawer';
import { AdminListToolbar } from '@/components/admin/AdminListToolbar';
import { AdminMediaPreview } from '@/components/admin/AdminMediaPreview';
import { AdminMediaUpload } from '@/components/admin/AdminMediaUpload';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { adminApi } from '@/lib/admin-ui/api';

interface Organization {
  id: string;
  name: string;
  contactName: string;
  contactPhone: string;
  email: string | null;
  creditCode: string;
  address: string | null;
  description: string | null;
  businessLicensePath: string;
  businessLicenseUrl: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const emptyOrganizationForm = {
  name: '',
  contactName: '',
  contactPhone: '',
  email: '',
  creditCode: '',
  address: '',
  description: '',
  businessLicensePath: '',
  password: '',
  initialStatus: 'approved' as 'approved' | 'pending',
};

export default function AdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [form, setForm] = useState(emptyOrganizationForm);

  async function load() {
    const data = await adminApi<{ organizations: Organization[] }>('/api/admin/organizations');
    setOrganizations(data.organizations);
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : '获取机构失败'));
  }, []);

  const visibleOrganizations = organizations.filter((organization) => {
    const matchesSearch = organization.name.includes(search);
    const matchesStatus = statusFilter === 'all' || organization.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  function openCreateDrawer() {
    setSelectedOrganization(null);
    setForm(emptyOrganizationForm);
    setDrawerOpen(true);
  }

  function openEditDrawer(organization: Organization) {
    setSelectedOrganization(organization);
    setForm({
      name: organization.name,
      contactName: organization.contactName,
      contactPhone: organization.contactPhone,
      email: organization.email || '',
      creditCode: organization.creditCode,
      address: organization.address || '',
      description: organization.description || '',
      businessLicensePath: organization.businessLicensePath,
      password: '',
      initialStatus: organization.status === 'approved' ? 'approved' : 'pending',
    });
    setDrawerOpen(true);
  }

  async function saveOrganization() {
    if (selectedOrganization) {
      await adminApi(`/api/admin/organizations/${selectedOrganization.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: form.name,
          contactName: form.contactName,
          contactPhone: form.contactPhone,
          email: form.email,
          creditCode: form.creditCode,
          address: form.address,
          description: form.description,
          businessLicensePath: form.businessLicensePath,
        }),
      });
    } else {
      await adminApi('/api/admin/organizations', {
        method: 'POST',
        body: JSON.stringify(form),
      });
    }

    setDrawerOpen(false);
    await load();
  }

  async function reviewOrganization(organizationId: string, action: 'approve' | 'reject', reason?: string) {
    await adminApi(`/api/admin/organizations/${organizationId}/review`, {
      method: 'POST',
      body: JSON.stringify({ action, reason }),
    });
    await load();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-brand-gold">机构管理</h1>
          <p className="mt-1 text-sm text-slate-500">创建机构账号并处理待审核主体。</p>
        </div>
        <button className="rounded-md bg-brand-gold px-3 py-2 text-sm text-stone-950" type="button" onClick={openCreateDrawer}>
          新建机构
        </button>
      </div>

      <AdminListToolbar
        search={search}
        onSearchChange={setSearch}
        filterGroups={[
          {
            label: '状态',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: '全部', value: 'all' },
              { label: '待审核', value: 'pending' },
              { label: '已通过', value: 'approved' },
              { label: '已驳回', value: 'rejected' },
            ],
          },
        ]}
      />

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        {visibleOrganizations.map((organization) => (
          <div key={organization.id} className="grid gap-4 border-b border-slate-200 p-4 last:border-b-0 lg:grid-cols-[1fr_220px]">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900">{organization.name}</h2>
                <StatusBadge status={organization.status} />
              </div>
              <p className="text-sm text-slate-500">{organization.contactName} · {organization.contactPhone}</p>
              <p className="text-xs text-slate-400">{organization.creditCode}</p>
            </div>
            <div className="flex flex-wrap items-start justify-end gap-2">
              {/* Pending row actions call /api/admin/organizations/${organization.id}/review. */}
              <button className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700" type="button" onClick={() => openEditDrawer(organization)}>
                编辑
              </button>
              {organization.status === 'pending' ? (
                <>
                  <button className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700" type="button" onClick={() => void reviewOrganization(organization.id, 'approve')}>
                    通过
                  </button>
                  <button className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700" type="button" onClick={() => void reviewOrganization(organization.id, 'reject', '资料待补充')}>
                    驳回
                  </button>
                </>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <AdminDrawer
        open={drawerOpen}
        title={selectedOrganization ? '编辑机构' : '新建机构'}
        subtitle={selectedOrganization ? selectedOrganization.name : '配置机构资料与账号状态'}
        onClose={() => setDrawerOpen(false)}
        footer={
          <div className="flex items-center justify-end gap-2">
            <button className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700" type="button" onClick={() => setDrawerOpen(false)}>
              取消
            </button>
            <button className="rounded-md bg-brand-gold px-3 py-2 text-sm text-stone-950" type="button" onClick={() => void saveOrganization()}>
              保存
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm text-slate-600">机构名称</span>
            <input className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </label>
          <label className="block space-y-2">
            <span className="text-sm text-slate-600">联系人</span>
            <input className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.contactName} onChange={(event) => setForm({ ...form, contactName: event.target.value })} />
          </label>
          <label className="block space-y-2">
            <span className="text-sm text-slate-600">手机号</span>
            <input className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.contactPhone} onChange={(event) => setForm({ ...form, contactPhone: event.target.value })} />
          </label>
          {!selectedOrganization ? (
            <>
              <label className="block space-y-2">
                <span className="text-sm text-slate-600">初始密码</span>
                <input className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
              </label>
              <div className="space-y-2">
                <span className="text-sm text-slate-600">账号状态</span>
                <div className="flex gap-2">
                  <button className={`rounded-md border px-3 py-2 text-sm ${form.initialStatus === 'approved' ? 'border-brand-gold bg-brand-gold/10 text-brand-gold' : 'border-slate-300 text-slate-700'}`} type="button" onClick={() => setForm({ ...form, initialStatus: 'approved' })}>
                    直接启用
                  </button>
                  <button className={`rounded-md border px-3 py-2 text-sm ${form.initialStatus === 'pending' ? 'border-brand-gold bg-brand-gold/10 text-brand-gold' : 'border-slate-300 text-slate-700'}`} type="button" onClick={() => setForm({ ...form, initialStatus: 'pending' })}>
                    待审核
                  </button>
                </div>
              </div>
            </>
          ) : null}
          <AdminMediaPreview type="file" url={selectedOrganization?.businessLicenseUrl || null} label="营业执照预览" />
          <AdminMediaUpload fileKind="license" mediaKind="file" value={form.businessLicensePath} onChange={(path) => setForm({ ...form, businessLicensePath: path })} onClear={() => setForm({ ...form, businessLicensePath: '' })} />
        </div>
      </AdminDrawer>
    </div>
  );
}
