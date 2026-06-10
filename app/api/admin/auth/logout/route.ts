import { fail, ok } from '@/lib/api/response';
import { clearAdminSession } from '@/lib/admin-auth/session';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    clearAdminSession();
    return ok({ success: true });
  } catch (error) {
    return fail('ADMIN_LOGOUT_FAILED', '退出登录失败', 500, error);
  }
}
