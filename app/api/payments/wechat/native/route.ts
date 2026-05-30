import { z } from 'zod';
import { fail, ok } from '@/lib/api/response';
import { getSessionUserId } from '@/lib/auth/session';
import { createWechatNativeOrder } from '@/lib/payment/wechat-service';

export const dynamic = 'force-dynamic';

const nativeOrderSchema = z.object({
  planCode: z.string().trim().min(1),
});

export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return fail('AUTH_REQUIRED', '请先登录', 401);
    }

    const body = nativeOrderSchema.parse(await request.json());
    const order = await createWechatNativeOrder(userId, body.planCode);

    return ok(order);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail('INVALID_PARAMS', '参数错误', 400);
    }

    if (error instanceof Error && error.message === 'PLAN_NOT_FOUND') {
      return fail('PLAN_NOT_FOUND', '会员套餐不存在或不可用', 404);
    }

    return fail('WECHAT_NATIVE_ORDER_CREATE_FAILED', '创建微信支付订单失败', 500, error);
  }
}
