import { ok, fail } from '@/lib/api/response';
import { getCurrentAdminUser } from '@/lib/admin-auth/service';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentAdminUser();
  if (!user) {
    return fail('ADMIN_AUTH_REQUIRED', '请先登录后台', 401);
  }
  return ok({ user });
}
