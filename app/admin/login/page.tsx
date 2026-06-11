'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { adminApi } from '@/lib/admin-ui/api';
import { FormField, adminInputClassName } from '@/components/admin/FormField';

export default function AdminLoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await adminApi('/api/admin/auth/login', {
        method: 'POST',
        body: JSON.stringify({ phone, password }),
      });
      window.location.href = '/admin';
    } catch {
      // adminApi 已通过全局 toast 展示错误。
    }
  }

  return (
    <div className="mx-auto max-w-[420px] rounded-md border border-white/10 bg-brand-card p-6">
      <h1 className="font-display text-3xl text-brand-gold">后台登录</h1>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <FormField label="手机号">
          <input className={adminInputClassName} value={phone} onChange={(event) => setPhone(event.target.value)} />
        </FormField>
        <FormField label="密码">
          <input className={adminInputClassName} type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </FormField>
        <button className="w-full rounded-md bg-brand-gold px-4 py-2 text-sm font-medium text-stone-950" type="submit">
          登录
        </button>
      </form>
      <div className="mt-4 border-t border-white/10 pt-4 text-center text-sm text-stone-300">
        机构还没有账号？
        <Link className="ml-2 text-brand-gold hover:underline" href="/admin/register">
          机构注册
        </Link>
      </div>
    </div>
  );
}
