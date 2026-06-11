import { redirect } from 'next/navigation';
import { getCurrentAdminUser } from '@/lib/admin-auth/service';

export default async function AdminIndexPage() {
  const user = await getCurrentAdminUser();

  if (!user) {
    redirect('/admin/login');
  }

  if (user.role === 'organization') {
    redirect('/admin/dramas');
  }

  redirect('/admin/organizations');
}
