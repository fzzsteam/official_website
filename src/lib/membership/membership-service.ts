import 'server-only';

import { prisma } from '@/lib/db/prisma';

export interface MembershipPlan {
  id: string;
  code: string;
  name: string;
  durationDays: number;
  priceCents: number;
  enabled: boolean;
  sortOrder: number;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export function calculateNextVipExpiry(
  currentVipExpiredAt: Date | string | null,
  durationDays: number,
  now = new Date(),
) {
  const currentExpiry = currentVipExpiredAt ? new Date(currentVipExpiredAt) : null;
  const baseTime =
    currentExpiry && currentExpiry.getTime() > now.getTime() ? currentExpiry : now;

  return new Date(baseTime.getTime() + durationDays * 24 * 60 * 60 * 1000);
}

export async function getEnabledMembershipPlans(): Promise<MembershipPlan[]> {
  const rows = await prisma.membershipPlan.findMany({
    where: { enabled: true },
    orderBy: { sortOrder: 'asc' },
  });

  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    durationDays: row.durationDays,
    priceCents: row.priceCents,
    enabled: row.enabled,
    sortOrder: row.sortOrder,
    description: row.description,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
}
