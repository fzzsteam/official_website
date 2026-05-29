import { fail, ok } from '@/lib/api/response';
import { getSessionUserId } from '@/lib/auth/session';
import { query } from '@/lib/db/client';

interface UserRow {
  id: string;
  phone: string;
  membership_expires_at: Date | string | null;
}

function isVipActive(membershipExpiresAt: Date | string | null) {
  return membershipExpiresAt ? new Date(membershipExpiresAt).getTime() > Date.now() : false;
}

export async function GET() {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return ok({ user: null });
    }

    const users = await query<UserRow>(
      `SELECT id, phone, membership_expires_at
       FROM users
       WHERE id = :id
       LIMIT 1`,
      { id: userId },
    );
    const user = users[0];

    if (!user) {
      return ok({ user: null });
    }

    return ok({
      user: {
        id: user.id,
        phone: user.phone,
        isVip: isVipActive(user.membership_expires_at),
        membershipExpiresAt: user.membership_expires_at
          ? new Date(user.membership_expires_at).toISOString()
          : null,
      },
    });
  } catch {
    return fail('AUTH_CHECK_FAILED', '登录状态获取失败', 500);
  }
}
