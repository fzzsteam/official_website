import { randomUUID } from 'node:crypto';
import { fail, ok } from '@/lib/api/response';
import { createSession } from '@/lib/auth/session';
import { normalizePhone, verifySmsCode } from '@/lib/auth/sms-code';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

function isVipActive(vipExpiredAt: Date | null) {
  return vipExpiredAt ? vipExpiredAt.getTime() > Date.now() : false;
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

    let user = await prisma.user.findUnique({
      where: { phone },
      select: { id: true, phone: true, vipExpiredAt: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { id: randomUUID(), phone, lastLoginAt: new Date() },
        select: { id: true, phone: true, vipExpiredAt: true },
      });
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    }

    await createSession(user.id);

    return ok({
      user: {
        id: user.id,
        phone: user.phone,
        isVip: isVipActive(user.vipExpiredAt),
        vipExpiredAt: user.vipExpiredAt ? user.vipExpiredAt.toISOString() : null,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_PHONE') {
      return fail('INVALID_PHONE', '手机号格式错误', 400);
    }

    return fail('LOGIN_FAILED', '登录失败', 500, error);
  }
}
