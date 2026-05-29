import { fail, ok } from '@/lib/api/response';
import { getSessionUserId } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return fail('AUTH_REQUIRED', '请先登录', 401);
    }

    const { searchParams } = new URL(request.url);
    const orderNo = searchParams.get('orderNo')?.trim() || '';

    if (!orderNo) {
      return fail('INVALID_PARAMS', '缺少订单号', 400);
    }

    const order = await prisma.order.findFirst({
      where: { orderNo, userId },
      select: { orderNo: true, status: true },
    });

    if (!order) {
      return fail('ORDER_NOT_FOUND', '订单不存在', 404);
    }

    return ok({
      orderNo: order.orderNo,
      status: order.status,
    });
  } catch {
    return fail('WECHAT_ORDER_STATUS_FAILED', '查询订单状态失败', 500);
  }
}
