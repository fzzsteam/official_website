import { fail, ok } from '@/lib/api/response';
import { clearSession } from '@/lib/auth/session';

export async function POST() {
  try {
    clearSession();
    return ok({ success: true });
  } catch {
    return fail('LOGOUT_FAILED', '退出登录失败', 500);
  }
}
