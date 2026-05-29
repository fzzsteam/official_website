import { fail, ok } from '@/lib/api/response';
import { getSessionUserId } from '@/lib/auth/session';
import { query } from '@/lib/db/client';

export const dynamic = 'force-dynamic';

interface OrderStatusRow {
  order_no: string;
  status: 'pending' | 'paid' | 'closed';
}

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

    const rows = await query<OrderStatusRow>(
      `SELECT order_no, status
       FROM orders
       WHERE order_no = :orderNo
         AND user_id = :userId
       LIMIT 1`,
      {
        orderNo,
        userId,
      },
    );

    const order = rows[0];

    if (!order) {
      return fail('ORDER_NOT_FOUND', '订单不存在', 404);
    }

    return ok({
      orderNo: order.order_no,
      status: order.status,
    });
  } catch {
    return fail('WECHAT_ORDER_STATUS_FAILED', '查询订单状态失败', 500);
  }
}
