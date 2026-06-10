import { fail, ok } from '@/lib/api/response';
import { clearSession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    clearSession();
    return ok({ success: true });
  } catch (error) {
    return fail('LOGOUT_FAILED', '退出登录失败', 500, error);
  }
}
