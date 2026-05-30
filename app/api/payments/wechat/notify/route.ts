import { fail, ok } from '@/lib/api/response';
import { handleWechatPaymentNotificationRequest } from '@/lib/payment/wechat-service';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const timestamp = request.headers.get('Wechatpay-Timestamp') || '';
    const nonce = request.headers.get('Wechatpay-Nonce') || '';
    const signature = request.headers.get('Wechatpay-Signature') || '';
    const serial = request.headers.get('Wechatpay-Serial') || '';

    if (!rawBody || !timestamp || !nonce || !signature || !serial) {
      return fail('INVALID_WECHAT_NOTIFY', '缺少必要的微信支付回调字段', 400);
    }

    const result = await handleWechatPaymentNotificationRequest({
      rawBody,
      timestamp,
      nonce,
      signature,
      serial,
    });

    return ok(result);
  } catch (error) {
    return fail('WECHAT_NOTIFY_FAILED', '处理微信支付回调失败', 500, error);
  }
}
