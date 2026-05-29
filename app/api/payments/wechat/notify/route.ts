import { fail, ok } from '@/lib/api/response';
import { handleWechatPaymentNotification } from '@/lib/payment/wechat-service';

export const dynamic = 'force-dynamic';

function toObjectPayload(value: unknown) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function getString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    const rawText = contentType.includes('application/json') ? '' : await request.text();
    const jsonBody = contentType.includes('application/json')
      ? await request.json()
      : rawText
        ? JSON.parse(rawText)
        : {};
    const body = toObjectPayload(jsonBody);
    const resource = toObjectPayload(body.resource);
    const amount = toObjectPayload(body.amount);
    const orderNo =
      getString(body.orderNo) ||
      getString(body.out_trade_no) ||
      getString(resource.orderNo) ||
      getString(resource.out_trade_no);
    const transactionId =
      getString(body.transactionId) ||
      getString(body.transaction_id) ||
      getString(resource.transactionId) ||
      getString(resource.transaction_id);

    if (!orderNo || !transactionId) {
      return fail('INVALID_WECHAT_NOTIFY', '缺少必要的微信支付回调字段', 400);
    }

    const result = await handleWechatPaymentNotification({
      orderNo,
      transactionId,
      eventId: getString(body.id),
      eventType: getString(body.event_type),
      resourceType: getString(body.resource_type),
      successTime: getString(body.success_time) || getString(resource.success_time) || null,
      amountCents:
        typeof amount.total === 'number'
          ? amount.total
          : typeof resource.amount === 'number'
            ? resource.amount
            : null,
      rawPayload: body,
    });

    return ok(result);
  } catch {
    return fail('WECHAT_NOTIFY_FAILED', '处理微信支付回调失败', 500);
  }
}
