'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { adminApi } from '@/lib/admin-ui/api';
import { showAdminToast } from '@/lib/admin-ui/toast';
import { FormField, adminInputClassName } from '@/components/admin/FormField';
import { UploadField } from '@/components/admin/UploadField';

export default function AdminRegisterPage() {
  const [form, setForm] = useState({
    name: '',
    contactName: '',
    contactPhone: '',
    email: '',
    creditCode: '',
    address: '',
    description: '',
    businessLicensePath: '',
    password: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateContactPhone(value: string) {
    updateField('contactPhone', value.replace(/\D/g, '').slice(0, 11));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await adminApi('/api/admin/register', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      showAdminToast({ type: 'success', message: '注册已提交，请等待审核' });
      setSubmitted(true);
    } catch {
      // adminApi 已通过全局 toast 展示错误。
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-[640px] rounded-md border border-white/10 bg-brand-card p-6">
      <h1 className="font-display text-3xl text-brand-gold">机构注册</h1>
      <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <FormField label="机构名称">
          <input className={adminInputClassName} value={form.name} onChange={(event) => updateField('name', event.target.value)} />
        </FormField>
        <FormField label="联系人">
          <input className={adminInputClassName} value={form.contactName} onChange={(event) => updateField('contactName', event.target.value)} />
        </FormField>
        <FormField label="联系电话">
          <input
            className={adminInputClassName}
            inputMode="numeric"
            maxLength={11}
            value={form.contactPhone}
            onChange={(event) => updateContactPhone(event.target.value)}
          />
        </FormField>
        <FormField label="邮箱">
          <input className={adminInputClassName} value={form.email} onChange={(event) => updateField('email', event.target.value)} />
        </FormField>
        <FormField label="统一社会信用代码">
          <input className={adminInputClassName} value={form.creditCode} onChange={(event) => updateField('creditCode', event.target.value)} />
        </FormField>
        <FormField label="登录密码">
          <input className={adminInputClassName} type="password" value={form.password} onChange={(event) => updateField('password', event.target.value)} />
        </FormField>
        <div className="md:col-span-2">
          <FormField label="营业执照">
            <UploadField
              fileKind="license"
              uploadScope="registration"
              mediaKind="image"
              previewSize="document"
              value={form.businessLicensePath}
              onChange={(path) => updateField('businessLicensePath', path)}
            />
          </FormField>
        </div>
        <div className="md:col-span-2">
          <FormField label="地址">
            <input className={adminInputClassName} value={form.address} onChange={(event) => updateField('address', event.target.value)} />
          </FormField>
        </div>
        <div className="md:col-span-2">
          <FormField label="简介">
            <textarea className={adminInputClassName} rows={4} value={form.description} onChange={(event) => updateField('description', event.target.value)} />
          </FormField>
        </div>
        <button className="rounded-md bg-brand-gold px-4 py-2 text-sm font-medium text-stone-950 disabled:cursor-not-allowed disabled:opacity-60 md:col-span-2" disabled={submitting} type="submit">
          {submitting ? '提交中...' : '提交注册'}
        </button>
        {submitted ? (
          <p className="text-sm text-emerald-400 md:col-span-2">注册申请已提交，审核通过后即可登录。</p>
        ) : null}
        <p className="text-sm text-stone-300 md:col-span-2">
          已有账号？
          <Link className="ml-1 text-brand-gold hover:underline" href="/admin/login">
            前往登录
          </Link>
        </p>
      </form>
    </div>
  );
}
