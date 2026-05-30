import 'server-only';

import { createDecipheriv, createSign, createVerify, randomUUID } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { Prisma } from '@prisma/client';
import { getEnv } from '@/lib/config/env';
import { prisma } from '@/lib/db/prisma';
import { calculateNextVipExpiry } from '@/lib/membership/membership-service';

const ORDER_STATUS_PENDING = 'pending';
const ORDER_STATUS_PAID = 'paid';
const PAYMENT_CHANNEL_WECHAT_NATIVE = 'wechat_native';
const WECHAT_PAY_NATIVE_URL = 'https://api.mch.weixin.qq.com/v3/pay/transactions/native';

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

interface WechatEncryptedResource {
  algorithm: string;
  ciphertext: string;
  nonce: string;
  associated_data?: string;
  original_type?: string;
}

interface WechatNotificationRequest {
  rawBody: string;
  timestamp: string;
  nonce: string;
  signature: string;
  serial: string;
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

function normalizeRawPayload(rawPayload: Record<string, unknown> | string): Prisma.InputJsonValue {
  const obj = typeof rawPayload === 'string' ? { raw: rawPayload } : rawPayload;
  return obj as Prisma.InputJsonValue;
}

function toObjectPayload(value: unknown) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function getString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function loadPem(value: string) {
  const normalized = value.replace(/\\n/g, '\n');

  if (normalized.includes('-----BEGIN')) {
    return normalized;
  }

  if (existsSync(value)) {
    return readFileSync(value, 'utf8');
  }

  return normalized;
}

function buildWechatPayMessage(method: string, pathWithQuery: string, timestamp: string, nonce: string, body: string) {
  return `${method}\n${pathWithQuery}\n${timestamp}\n${nonce}\n${body}\n`;
}

function signWechatPayRequest(method: string, url: URL, body: string) {
  const env = getEnv();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = randomUUID().replace(/-/g, '');
  const pathWithQuery = `${url.pathname}${url.search}`;
  const message = buildWechatPayMessage(method, pathWithQuery, timestamp, nonce, body);
  const signature = createSign('RSA-SHA256')
    .update(message, 'utf8')
    .sign(loadPem(env.WECHAT_PAY_PRIVATE_KEY), 'base64');

  return {
    authorization:
      `WECHATPAY2-SHA256-RSA2048 mchid="${env.WECHAT_PAY_MCH_ID}",` +
      `nonce_str="${nonce}",signature="${signature}",timestamp="${timestamp}",` +
      `serial_no="${env.WECHAT_PAY_CERT_SERIAL_NO}"`,
  };
}

export function verifyWechatpaySignature(request: WechatNotificationRequest) {
  const env = getEnv();

  if (request.serial !== env.WECHAT_PAY_PUBLIC_KEY_ID) {
    throw new Error('WECHAT_PAY_PUBLIC_KEY_ID_MISMATCH');
  }

  const message = `${request.timestamp}\n${request.nonce}\n${request.rawBody}\n`;
  const verified = createVerify('RSA-SHA256')
    .update(message, 'utf8')
    .verify(loadPem(env.WECHAT_PAY_PUBLIC_KEY), request.signature, 'base64');

  if (!verified) {
    throw new Error('WECHAT_PAY_NOTIFY_SIGNATURE_INVALID');
  }
}

export function decryptWechatResource(resource: WechatEncryptedResource) {
  const env = getEnv();
  const encrypted = Buffer.from(resource.ciphertext, 'base64');
  const authTag = encrypted.subarray(encrypted.length - 16);
  const ciphertext = encrypted.subarray(0, encrypted.length - 16);
  const decipher = createDecipheriv(
    'aes-256-gcm',
    Buffer.from(env.WECHAT_PAY_API_V3_KEY, 'utf8'),
    Buffer.from(resource.nonce, 'utf8'),
  );

  if (resource.associated_data) {
    decipher.setAAD(Buffer.from(resource.associated_data, 'utf8'));
  }

  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  return JSON.parse(decrypted) as Record<string, unknown>;
}

async function requestWechatNativeCodeUrl(
  orderNo: string,
  description: string,
  amountCents: number,
  expiresAt: Date,
) {
  const env = getEnv();
  const url = new URL(WECHAT_PAY_NATIVE_URL);
  const body = JSON.stringify({
    appid: env.WECHAT_PAY_APPID,
    mchid: env.WECHAT_PAY_MCH_ID,
    description,
    out_trade_no: orderNo,
    time_expire: expiresAt.toISOString(),
    notify_url: env.WECHAT_PAY_NOTIFY_URL,
    amount: {
      total: amountCents,
      currency: 'CNY',
    },
  });
  const { authorization } = signWechatPayRequest('POST', url, body);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: authorization,
      'Content-Type': 'application/json',
      'Wechatpay-Serial': env.WECHAT_PAY_PUBLIC_KEY_ID,
    },
    body,
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error('WECHAT_NATIVE_ORDER_REQUEST_FAILED');
  }

  verifyWechatpaySignature({
    rawBody: responseText,
    timestamp: response.headers.get('Wechatpay-Timestamp') || '',
    nonce: response.headers.get('Wechatpay-Nonce') || '',
    signature: response.headers.get('Wechatpay-Signature') || '',
    serial: response.headers.get('Wechatpay-Serial') || '',
  });

  const responseBody = JSON.parse(responseText) as { code_url?: unknown };
  const codeUrl = typeof responseBody.code_url === 'string' ? responseBody.code_url : '';

  if (!codeUrl) {
    throw new Error('WECHAT_NATIVE_ORDER_CODE_URL_MISSING');
  }

  return {
    codeUrl,
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

  const wechatOrder = await requestWechatNativeCodeUrl(orderNo, description, totalCents, expiresAt);

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

export async function handleWechatPaymentNotificationRequest(
  request: WechatNotificationRequest,
): Promise<WechatNotificationResult> {
  const env = getEnv();

  verifyWechatpaySignature(request);

  const body = toObjectPayload(JSON.parse(request.rawBody));
  const resource = toObjectPayload(body.resource) as Partial<WechatEncryptedResource>;

  if (
    resource.algorithm !== 'AEAD_AES_256_GCM' ||
    !resource.ciphertext ||
    !resource.nonce
  ) {
    throw new Error('WECHAT_NOTIFY_RESOURCE_INVALID');
  }

  const decrypted = decryptWechatResource({
    algorithm: resource.algorithm,
    ciphertext: resource.ciphertext,
    nonce: resource.nonce,
    associated_data: resource.associated_data,
    original_type: resource.original_type,
  });
  const amount = toObjectPayload(decrypted.amount);
  const orderNo = getString(decrypted.out_trade_no);
  const transactionId = getString(decrypted.transaction_id);
  const appid = getString(decrypted.appid);
  const mchid = getString(decrypted.mchid);
  const tradeState = getString(decrypted.trade_state);
  const paidCents = typeof amount.total === 'number' ? amount.total : null;

  if (!orderNo || !transactionId) {
    throw new Error('WECHAT_NOTIFY_TRANSACTION_INVALID');
  }

  if (appid !== env.WECHAT_PAY_APPID || mchid !== env.WECHAT_PAY_MCH_ID) {
    throw new Error('WECHAT_NOTIFY_MERCHANT_INVALID');
  }

  if (tradeState !== 'SUCCESS') {
    throw new Error('WECHAT_NOTIFY_TRADE_NOT_SUCCESS');
  }

  return handleWechatPaymentNotification({
    orderNo,
    transactionId,
    eventId: getString(body.id),
    eventType: getString(body.event_type),
    resourceType: getString(body.resource_type),
    successTime: getString(decrypted.success_time) || null,
    amountCents: paidCents,
    rawPayload: body,
  });
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
