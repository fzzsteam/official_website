import 'server-only';

import { randomUUID } from 'node:crypto';
import { getEnv } from '@/lib/config/env';
import { prisma } from '@/lib/db/prisma';
import { calculateNextVipExpiry } from '@/lib/membership/membership-service';

const ORDER_STATUS_PENDING = 'pending';
const ORDER_STATUS_PAID = 'paid';
const PAYMENT_CHANNEL_WECHAT_NATIVE = 'wechat_native';

interface WechatNotificationPayload {
  orderNo: string;
  transactionId: string;
  rawPayload: Record<string, unknown> | string;
  eventId?: string;
  eventType?: string;
  resourceType?: string;
  successTime?: string | null;
  amountCents?: number | null;
}

export interface WechatNativeOrder {
  orderId: string;
  orderNo: string;
  status: 'pending';
  planCode: string;
  totalCents: number;
  codeUrl: string;
  expiresAt: string;
}

export interface WechatNotificationResult {
  orderNo: string;
  status: 'paid';
  alreadyProcessed: boolean;
  transactionId: string;
  vipExpiredAt: string | null;
}

// 支付回调事务中用于 FOR UPDATE 的原始查询类型
interface OrderForUpdate {
  id: string;
  order_no: string;
  user_id: string;
  membership_plan_id: string | null;
  total_cents: number;
  paid_cents: number;
  status: string;
  paid_at: Date | null;
  description: string | null;
  duration_days: number | null;
  vip_expired_at: Date | null;
}

function createOrderNo() {
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const suffix = randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase();
  return `WX${timestamp}${suffix}`;
}

function normalizeRawPayload(rawPayload: Record<string, unknown> | string) {
  return typeof rawPayload === 'string' ? { raw: rawPayload } : rawPayload;
}

async function requestWechatNativeCodeUrl(
  orderNo: string,
  description: string,
  amountCents: number,
) {
  const env = getEnv();

  return {
    codeUrl:
      `weixin://wxpay/bizpayurl?` +
      `appid=${encodeURIComponent(env.WECHAT_PAY_APPID)}` +
      `&mchid=${encodeURIComponent(env.WECHAT_PAY_MCH_ID)}` +
      `&out_trade_no=${encodeURIComponent(orderNo)}` +
      `&amount=${amountCents}` +
      `&desc=${encodeURIComponent(description)}`,
    notifyUrl: env.WECHAT_PAY_NOTIFY_URL,
  };
}

export async function createWechatNativeOrder(
  userId: string,
  planCode: string,
): Promise<WechatNativeOrder> {
  const plan = await prisma.membershipPlan.findFirst({
    where: { code: planCode, enabled: true },
  });

  if (!plan) {
    throw new Error('PLAN_NOT_FOUND');
  }

  const orderId = randomUUID();
  const orderNo = createOrderNo();
  const description = `${plan.name}会员充值`;
  const totalCents = plan.priceCents;
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  const wechatOrder = await requestWechatNativeCodeUrl(orderNo, description, totalCents);

  await prisma.order.create({
    data: {
      id: orderId,
      orderNo,
      userId,
      membershipPlanId: plan.id,
      totalCents,
      paidCents: 0,
      status: ORDER_STATUS_PENDING,
      paymentChannel: PAYMENT_CHANNEL_WECHAT_NATIVE,
      description,
    },
  });

  return {
    orderId,
    orderNo,
    status: ORDER_STATUS_PENDING,
    planCode: plan.code,
    totalCents,
    codeUrl: wechatOrder.codeUrl,
    expiresAt: expiresAt.toISOString(),
  };
}

export async function handleWechatPaymentNotification(
  payload: WechatNotificationPayload,
): Promise<WechatNotificationResult> {
  const rawPayloadJson = normalizeRawPayload(payload.rawPayload);
  const eventId = payload.eventId || `event:${payload.transactionId}`;
  const eventType = payload.eventType || 'TRANSACTION.SUCCESS';
  const resourceType = payload.resourceType || 'encrypt-resource';

  return prisma.$transaction(async (tx) => {
    // FOR UPDATE 需要原始 SQL 以获得行锁
    const orderRows = await tx.$queryRaw<OrderForUpdate[]>`
      SELECT
        o.id, o.order_no, o.user_id, o.membership_plan_id,
        o.total_cents, o.paid_cents, o.status, o.paid_at, o.description,
        mp.duration_days, u.vip_expired_at
      FROM orders o
      LEFT JOIN membership_plans mp ON mp.id = o.membership_plan_id
      LEFT JOIN users u ON u.id = o.user_id
      WHERE o.order_no = ${payload.orderNo}
      LIMIT 1
      FOR UPDATE
    `;

    const order = orderRows[0];

    if (!order) {
      throw new Error('ORDER_NOT_FOUND');
    }

    await tx.wechatPaymentNotification.upsert({
      where: { eventId },
      create: {
        id: randomUUID(),
        orderId: order.id,
        orderNo: order.order_no,
        transactionId: payload.transactionId,
        eventType,
        eventId,
        resourceType,
        rawPayloadJson,
        processed: false,
        processedAt: null,
      },
      update: {
        rawPayloadJson,
        updatedAt: new Date(),
      },
    });

    if (order.status === ORDER_STATUS_PAID) {
      await tx.wechatPaymentNotification.updateMany({
        where: { orderNo: order.order_no, transactionId: payload.transactionId },
        data: { processed: true, processedAt: new Date() },
      });

      return {
        orderNo: order.order_no,
        status: ORDER_STATUS_PAID,
        alreadyProcessed: true,
        transactionId: payload.transactionId,
        vipExpiredAt: order.vip_expired_at ? order.vip_expired_at.toISOString() : null,
      };
    }

    if (!order.membership_plan_id || !order.duration_days) {
      throw new Error('ORDER_PLAN_INVALID');
    }

    const paidCents = payload.amountCents ?? order.total_cents;

    if (paidCents !== order.total_cents) {
      throw new Error('ORDER_AMOUNT_MISMATCH');
    }

    const paidAt = payload.successTime ? new Date(payload.successTime) : new Date();
    const nextVipExpiry = calculateNextVipExpiry(order.vip_expired_at, order.duration_days, paidAt);

    await tx.order.update({
      where: { id: order.id },
      data: { status: ORDER_STATUS_PAID, paidCents, paidAt },
    });

    await tx.user.update({
      where: { id: order.user_id },
      data: { vipExpiredAt: nextVipExpiry },
    });

    await tx.wechatPaymentNotification.updateMany({
      where: { orderNo: order.order_no, transactionId: payload.transactionId },
      data: { processed: true, processedAt: new Date() },
    });

    return {
      orderNo: order.order_no,
      status: ORDER_STATUS_PAID,
      alreadyProcessed: false,
      transactionId: payload.transactionId,
      vipExpiredAt: nextVipExpiry.toISOString(),
    };
  });
}
