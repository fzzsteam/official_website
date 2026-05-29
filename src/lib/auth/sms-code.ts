import 'server-only';

import bcrypt from 'bcryptjs';
import { randomInt, randomUUID } from 'node:crypto';
import { query } from '@/lib/db/client';

const LOGIN_SCENE = 'login';
const CODE_EXPIRES_IN_MS = 5 * 60 * 1000;

interface SmsCodeRow {
  id: string;
  code_hash: string;
  expires_at: Date | string;
  consumed_at: Date | string | null;
}

export function normalizePhone(phone: string) {
  const normalized = phone.replace(/\s+/g, '').replace(/^\+86/, '');

  if (!/^1\d{10}$/.test(normalized)) {
    throw new Error('INVALID_PHONE');
  }

  return normalized;
}

export async function createSmsCode(phone: string, requestIp?: string | null) {
  const normalizedPhone = normalizePhone(phone);
  const code = String(randomInt(100000, 1000000));
  const expiresAt = new Date(Date.now() + CODE_EXPIRES_IN_MS);
  const codeHash = await bcrypt.hash(code, 10);

  await query(
    `INSERT INTO sms_codes (id, phone, code_hash, purpose, expires_at, request_ip, status)
     VALUES (:id, :phone, :codeHash, :scene, :expiresAt, :requestIp, 'pending')`,
    {
      id: randomUUID(),
      phone: normalizedPhone,
      codeHash,
      scene: LOGIN_SCENE,
      expiresAt,
      requestIp: requestIp ?? null,
    },
  );

  return {
    code,
    expiresAt: expiresAt.toISOString(),
  };
}

export async function verifySmsCode(phone: string, code: string) {
  const normalizedPhone = normalizePhone(phone);
  const trimmedCode = code.trim();

  if (!/^\d{6}$/.test(trimmedCode)) {
    return false;
  }

  const rows = await query<SmsCodeRow>(
    `SELECT id, code_hash, expires_at, consumed_at
     FROM sms_codes
     WHERE phone = :phone
       AND purpose = :scene
       AND status = 'pending'
       AND consumed_at IS NULL
     ORDER BY created_at DESC
     LIMIT 5`,
    {
      phone: normalizedPhone,
      scene: LOGIN_SCENE,
    },
  );

  const now = Date.now();

  for (const row of rows) {
    const expiresAt = new Date(row.expires_at).getTime();

    if (row.consumed_at || Number.isNaN(expiresAt) || expiresAt <= now) {
      continue;
    }

    const matched = await bcrypt.compare(trimmedCode, row.code_hash);

    if (!matched) {
      continue;
    }

    await query(
      `UPDATE sms_codes
       SET consumed_at = :consumedAt,
           status = 'consumed'
       WHERE id = :id
         AND consumed_at IS NULL`,
      {
        id: row.id,
        consumedAt: new Date(),
      },
    );

    return true;
  }

  return false;
}
