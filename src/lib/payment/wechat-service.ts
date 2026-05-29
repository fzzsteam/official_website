import 'server-only';

import { randomUUID } from 'node:crypto';
import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { getEnv } from '@/lib/config/env';
import { getPool, query } from '@/lib/db/client';
import { calculateNextVipExpiry } from '@/lib/membership/membership-service';

const ORDER_STATUS_PENDING = 'pending';
const ORDER_STATUS_PAID = 'paid';
const PAYMENT_CHANNEL_WECHAT_NATIVE = 'wechat_native';

interface MembershipPlanRow {
  id: string;
  code: string;
  name: string;
  duration_days: number;
  price_cents: number;
  enabled: number | boolean;
}

interface OrderRow extends RowDataPacket {
  id: string;
  order_no: string;
  user_id: string;
  membership_plan_id: string | null;
  total_cents: number;
  paid_cents: number;
  status: string;
  paid_at: Date | string | null;
  description: string | null;
  duration_days: number | null;
  vip_expired_at: Date | string | null;
}

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
  const plans = await query<MembershipPlanRow>(
    `SELECT id, code, name, duration_days, price_cents, enabled
     FROM membership_plans
     WHERE code = :code AND enabled = 1
     LIMIT 1`,
    { code: planCode },
  );

  const plan = plans[0];

  if (!plan) {
    throw new Error('PLAN_NOT_FOUND');
  }

  const orderId = randomUUID();
  const orderNo = createOrderNo();
  const description = `${plan.name}会员充值`;
  const totalCents = plan.price_cents;
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  const wechatOrder = await requestWechatNativeCodeUrl(orderNo, description, totalCents);

  await query(
    `INSERT INTO orders (
       id,
       order_no,
       user_id,
       membership_plan_id,
       total_cents,
       paid_cents,
       status,
       payment_channel,
       description
     ) VALUES (
       :id,
       :orderNo,
       :userId,
       :membershipPlanId,
       :totalCents,
       0,
       :status,
       :paymentChannel,
       :description
     )`,
    {
      id: orderId,
      orderNo,
      userId,
      membershipPlanId: plan.id,
      totalCents,
      status: ORDER_STATUS_PENDING,
      paymentChannel: PAYMENT_CHANNEL_WECHAT_NATIVE,
      description,
    },
  );

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
  const rawPayloadJson = JSON.stringify(normalizeRawPayload(payload.rawPayload));
  const connection = await getPool().getConnection();

  try {
    await connection.beginTransaction();

    const [orderRows] = await connection.execute<OrderRow[]>(
      `SELECT
         o.id,
         o.order_no,
         o.user_id,
         o.membership_plan_id,
         o.total_cents,
         o.paid_cents,
         o.status,
         o.paid_at,
         o.description,
         mp.duration_days,
         u.vip_expired_at
       FROM orders o
       LEFT JOIN membership_plans mp ON mp.id = o.membership_plan_id
       LEFT JOIN users u ON u.id = o.user_id
       WHERE o.order_no = :orderNo
       LIMIT 1
       FOR UPDATE`,
      { orderNo: payload.orderNo },
    );

    const order = orderRows[0];

    if (!order) {
      throw new Error('ORDER_NOT_FOUND');
    }

    const eventId = payload.eventId || `event:${payload.transactionId}`;
    const eventType = payload.eventType || 'TRANSACTION.SUCCESS';
    const resourceType = payload.resourceType || 'encrypt-resource';

    await connection.execute<ResultSetHeader>(
      `INSERT INTO wechat_payment_notifications (
         id,
         order_id,
         order_no,
         transaction_id,
         event_type,
         event_id,
         resource_type,
         raw_payload_json,
         processed,
         processed_at
       ) VALUES (
         :id,
         :orderId,
         :orderNo,
         :transactionId,
         :eventType,
         :eventId,
         :resourceType,
         CAST(:rawPayloadJson AS JSON),
         0,
         NULL
       )
       ON DUPLICATE KEY UPDATE
         raw_payload_json = VALUES(raw_payload_json),
         updated_at = CURRENT_TIMESTAMP(3)`,
      {
        id: randomUUID(),
        orderId: order.id,
        orderNo: order.order_no,
        transactionId: payload.transactionId,
        eventType,
        eventId,
        resourceType,
        rawPayloadJson,
      },
    );

    if (order.status === ORDER_STATUS_PAID) {
      await connection.execute(
        `UPDATE wechat_payment_notifications
         SET processed = 1,
             processed_at = COALESCE(processed_at, CURRENT_TIMESTAMP(3))
         WHERE order_no = :orderNo
           AND transaction_id = :transactionId`,
        {
          orderNo: order.order_no,
          transactionId: payload.transactionId,
        },
      );

      await connection.commit();

      return {
        orderNo: order.order_no,
        status: ORDER_STATUS_PAID,
        alreadyProcessed: true,
        transactionId: payload.transactionId,
        vipExpiredAt: order.vip_expired_at
          ? new Date(order.vip_expired_at).toISOString()
          : null,
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

    await connection.execute(
      `UPDATE orders
       SET status = :status,
           paid_cents = :paidCents,
           paid_at = :paidAt
       WHERE id = :id`,
      {
        id: order.id,
        status: ORDER_STATUS_PAID,
        paidCents,
        paidAt,
      },
    );

    await connection.execute(
      `UPDATE users
       SET vip_expired_at = :vipExpiredAt
       WHERE id = :userId`,
      {
        userId: order.user_id,
        vipExpiredAt: nextVipExpiry,
      },
    );

    await connection.execute(
      `UPDATE wechat_payment_notifications
       SET processed = 1,
           processed_at = CURRENT_TIMESTAMP(3)
       WHERE order_no = :orderNo
         AND transaction_id = :transactionId`,
      {
        orderNo: order.order_no,
        transactionId: payload.transactionId,
      },
    );

    await connection.commit();

    return {
      orderNo: order.order_no,
      status: ORDER_STATUS_PAID,
      alreadyProcessed: false,
      transactionId: payload.transactionId,
      vipExpiredAt: nextVipExpiry.toISOString(),
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
