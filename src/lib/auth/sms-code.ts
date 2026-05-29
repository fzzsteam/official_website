import 'server-only';

import bcrypt from 'bcryptjs';
import { randomInt, randomUUID } from 'node:crypto';
import { prisma } from '@/lib/db/prisma';

const LOGIN_SCENE = 'login';
const CODE_EXPIRES_IN_MS = 5 * 60 * 1000;

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

  await prisma.smsCode.create({
    data: {
      id: randomUUID(),
      phone: normalizedPhone,
      codeHash,
      purpose: LOGIN_SCENE,
      expiresAt,
      requestIp: requestIp ?? null,
      status: 'pending',
    },
  });

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

  const rows = await prisma.smsCode.findMany({
    where: {
      phone: normalizedPhone,
      purpose: LOGIN_SCENE,
      status: 'pending',
      consumedAt: null,
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  const now = Date.now();

  for (const row of rows) {
    if (row.consumedAt || row.expiresAt.getTime() <= now) {
      continue;
    }

    const matched = await bcrypt.compare(trimmedCode, row.codeHash);

    if (!matched) {
      continue;
    }

    await prisma.smsCode.updateMany({
      where: { id: row.id, consumedAt: null },
      data: { consumedAt: new Date(), status: 'consumed' },
    });

    return true;
  }

  return false;
}
