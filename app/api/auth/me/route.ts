import { fail, ok } from '@/lib/api/response';
import { getSessionUserId } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

function isVipActive(vipExpiredAt: Date | null) {
  return vipExpiredAt ? vipExpiredAt.getTime() > Date.now() : false;
}

export async function GET() {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return ok({ user: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, phone: true, vipExpiredAt: true },
    });

    if (!user) {
      return ok({ user: null });
    }

    return ok({
      user: {
        id: user.id,
        phone: user.phone,
        isVip: isVipActive(user.vipExpiredAt),
        vipExpiredAt: user.vipExpiredAt ? user.vipExpiredAt.toISOString() : null,
      },
    });
  } catch (error) {
    return fail('AUTH_CHECK_FAILED', '登录状态获取失败', 500, error);
  }
}
