'use client';

import { FormEvent, useState } from 'react';
import { adminApi } from '@/lib/admin-ui/api';
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
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      await adminApi('/api/admin/register', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setMessage('注册已提交，请等待审核');
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败');
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
          <input className={adminInputClassName} value={form.contactPhone} onChange={(event) => updateField('contactPhone', event.target.value)} />
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
            <UploadField fileKind="license" value={form.businessLicensePath} onChange={(path) => updateField('businessLicensePath', path)} />
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
        {message ? <p className="text-sm text-brand-gold md:col-span-2">{message}</p> : null}
        {error ? <p className="text-sm text-red-300 md:col-span-2">{error}</p> : null}
        <button className="rounded-md bg-brand-gold px-4 py-2 text-sm font-medium text-stone-950 md:col-span-2" type="submit">
          提交注册
        </button>
      </form>
    </div>
  );
}
