'use client';

import { useEffect, useState } from 'react';
import { AdminActionButton } from '@/components/admin/AdminActionButton';
import { AdminDrawer } from '@/components/admin/AdminDrawer';
import { AdminLoadingState } from '@/components/admin/AdminLoadingState';
import { AdminListToolbar } from '@/components/admin/AdminListToolbar';
import { AdminMediaUpload } from '@/components/admin/AdminMediaUpload';
import { AdminMoreActions } from '@/components/admin/AdminMoreActions';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { adminApi } from '@/lib/admin-ui/api';
import { showAdminToast } from '@/lib/admin-ui/toast';

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

interface OrganizationFormState {
  name: string;
  contactName: string;
  contactPhone: string;
  email: string;
  creditCode: string;
  address: string;
  description: string;
  businessLicensePath: string;
  password: string;
  initialStatus: 'approved' | 'pending';
}

const emptyOrganizationForm: OrganizationFormState = {
  name: '',
  contactName: '',
  contactPhone: '',
  email: '',
  creditCode: '',
  address: '',
  description: '',
  businessLicensePath: '',
  password: '',
  initialStatus: 'approved',
};

export default function AdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [form, setForm] = useState<OrganizationFormState>(emptyOrganizationForm);
  const [pageLoading, setPageLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load() {
    setPageLoading(true);
    try {
      const data = await adminApi<{ organizations: Organization[] }>('/api/admin/organizations');
      setOrganizations(data.organizations);
    } finally {
      setPageLoading(false);
    }
  }

  useEffect(() => {
    load().catch(ignoreHandledError);
  }, []);

  function ignoreHandledError() {
    // adminApi 已通过全局 toast 展示错误，这里只阻止开发态未处理异常覆盖页面。
  }

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

  function updateForm<K extends keyof OrganizationFormState>(key: K, value: OrganizationFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function saveOrganization() {
    setSaving(true);

    try {
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

      showAdminToast({ type: 'success', message: selectedOrganization ? '机构已保存' : '机构已创建' });
      setDrawerOpen(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function reviewOrganization(organizationId: string, action: 'approve' | 'reject', reason?: string) {
    setActionBusy(true);
    try {
      await adminApi(`/api/admin/organizations/${organizationId}/review`, {
        method: 'POST',
        body: JSON.stringify({ action, reason }),
      });
      showAdminToast({ type: 'success', message: action === 'approve' ? '机构审核已通过' : '机构已驳回' });
      await load();
    } finally {
      setActionBusy(false);
    }
  }

  async function resetPassword(organizationId: string) {
    setActionBusy(true);
    try {
      await adminApi(`/api/admin/organizations/${organizationId}/reset-password`, {
        method: 'POST',
      });
      showAdminToast({ type: 'success', message: '密码已重置为手机号后 8 位' });
    } finally {
      setActionBusy(false);
    }
  }

  const disableActions = pageLoading || saving || actionBusy;

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

      {pageLoading ? <AdminLoadingState text="机构数据加载中..." /> : null}

      {!pageLoading ? <div className="overflow-visible rounded-md border border-slate-200 bg-white">
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
              <AdminActionButton disabled={disableActions} onClick={() => openEditDrawer(organization)}>
                查看
              </AdminActionButton>
              <AdminMoreActions
                disabled={disableActions}
                actions={[
                  ...(organization.status === 'pending'
                    ? [
                        {
                          label: '通过',
                          onClick: () => void reviewOrganization(organization.id, 'approve').catch(ignoreHandledError),
                        },
                        {
                          label: '驳回',
                          tone: 'danger' as const,
                          onClick: () => void reviewOrganization(organization.id, 'reject', '资料待补充').catch(ignoreHandledError),
                        },
                      ]
                    : []),
                  {
                    label: '重置密码',
                    tone: 'danger',
                    onClick: () => void resetPassword(organization.id).catch(ignoreHandledError),
                  },
                ]}
              />
            </div>
          </div>
        ))}
      </div> : null}

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
            <button className="rounded-md bg-brand-gold px-3 py-2 text-sm text-stone-950 disabled:cursor-not-allowed disabled:opacity-60" disabled={saving} type="button" onClick={() => void saveOrganization().catch(ignoreHandledError)}>
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm text-slate-600">机构名称</span>
            <input className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.name} onChange={(event) => updateForm('name', event.target.value)} />
          </label>
          <label className="block space-y-2">
            <span className="text-sm text-slate-600">联系人</span>
            <input className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.contactName} onChange={(event) => updateForm('contactName', event.target.value)} />
          </label>
          <label className="block space-y-2">
            <span className="text-sm text-slate-600">手机号</span>
            <input className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.contactPhone} onChange={(event) => updateForm('contactPhone', event.target.value.replace(/\D/g, '').slice(0, 11))} />
          </label>
          <label className="block space-y-2">
            <span className="text-sm text-slate-600">统一社会信用代码</span>
            <input className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.creditCode} onChange={(event) => updateForm('creditCode', event.target.value)} />
          </label>
          <label className="block space-y-2">
            <span className="text-sm text-slate-600">邮箱</span>
            <input className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" type="email" value={form.email} onChange={(event) => updateForm('email', event.target.value)} />
          </label>
          <label className="block space-y-2">
            <span className="text-sm text-slate-600">联系地址</span>
            <input className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.address} onChange={(event) => updateForm('address', event.target.value)} />
          </label>
          <label className="block space-y-2">
            <span className="text-sm text-slate-600">机构描述</span>
            <textarea className="min-h-[96px] w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.description} onChange={(event) => updateForm('description', event.target.value)} />
          </label>
          {!selectedOrganization ? (
            <>
              <label className="block space-y-2">
                <span className="text-sm text-slate-600">初始密码</span>
                <input className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" type="password" value={form.password} onChange={(event) => updateForm('password', event.target.value)} />
                <p className="text-xs text-slate-400">密码至少 8 位。</p>
              </label>
              <div className="space-y-2">
                <span className="text-sm text-slate-600">账号状态</span>
                <div className="flex gap-2">
                  <button className={`rounded-md border px-3 py-2 text-sm ${form.initialStatus === 'approved' ? 'border-brand-gold bg-brand-gold/10 text-brand-gold' : 'border-slate-300 text-slate-700'}`} type="button" onClick={() => updateForm('initialStatus', 'approved')}>
                    直接启用
                  </button>
                  <button className={`rounded-md border px-3 py-2 text-sm ${form.initialStatus === 'pending' ? 'border-brand-gold bg-brand-gold/10 text-brand-gold' : 'border-slate-300 text-slate-700'}`} type="button" onClick={() => updateForm('initialStatus', 'pending')}>
                    待审核
                  </button>
                </div>
              </div>
            </>
          ) : null}
          <AdminMediaUpload
            fileKind="license"
            mediaKind="image"
            previewSize="document"
            label="营业执照"
            emptyLabel="上传营业执照"
            value={form.businessLicensePath}
            previewUrl={selectedOrganization?.businessLicensePath === form.businessLicensePath ? selectedOrganization.businessLicenseUrl : null}
            onChange={(path) => updateForm('businessLicensePath', path)}
            onClear={() => updateForm('businessLicensePath', '')}
          />
        </div>
      </AdminDrawer>
    </div>
  );
}
