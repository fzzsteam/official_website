import { randomUUID } from 'node:crypto';
import { fail, ok } from '@/lib/api/response';
import { createSession } from '@/lib/auth/session';
import { normalizePhone, verifySmsCode } from '@/lib/auth/sms-code';
import { query } from '@/lib/db/client';

interface UserRow {
  id: string;
  phone: string;
  membership_expires_at: Date | string | null;
}

function isVipActive(membershipExpiresAt: Date | string | null) {
  return membershipExpiresAt ? new Date(membershipExpiresAt).getTime() > Date.now() : false;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const phone = normalizePhone(String(body?.phone || ''));
    const code = String(body?.code || '');
    const verified = await verifySmsCode(phone, code);

    if (!verified) {
      return fail('INVALID_SMS_CODE', '验证码错误或已过期', 400);
    }

    let users = await query<UserRow>(
      `SELECT id, phone, membership_expires_at
       FROM users
       WHERE phone = :phone
       LIMIT 1`,
      { phone },
    );

    if (users.length === 0) {
      const userId = randomUUID();
      await query(
        `INSERT INTO users (id, phone, last_login_at)
         VALUES (:id, :phone, :lastLoginAt)`,
        {
          id: userId,
          phone,
          lastLoginAt: new Date(),
        },
      );

      users = await query<UserRow>(
        `SELECT id, phone, membership_expires_at
         FROM users
         WHERE id = :id
         LIMIT 1`,
        { id: userId },
      );
    } else {
      await query(
        `UPDATE users
         SET last_login_at = :lastLoginAt
         WHERE id = :id`,
        {
          id: users[0].id,
          lastLoginAt: new Date(),
        },
      );
    }

    const user = users[0];

    if (!user) {
      return fail('LOGIN_FAILED', '登录失败', 500);
    }

    await createSession(user.id);

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
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_PHONE') {
      return fail('INVALID_PHONE', '手机号格式错误', 400);
    }

    return fail('LOGIN_FAILED', '登录失败', 500);
  }
}
