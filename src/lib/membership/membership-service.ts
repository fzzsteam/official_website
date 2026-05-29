import 'server-only';

import { query } from '@/lib/db/client';

interface MembershipPlanRow {
  id: string;
  code: string;
  name: string;
  duration_days: number;
  price_cents: number;
  enabled: number | boolean;
  sort_order: number;
  description: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

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
  const rows = await query<MembershipPlanRow>(
    `SELECT
       id,
       code,
       name,
       duration_days,
       price_cents,
       enabled,
       sort_order,
       description,
       created_at,
       updated_at
     FROM membership_plans
     WHERE enabled = 1
     ORDER BY sort_order ASC`,
  );

  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    durationDays: row.duration_days,
    priceCents: row.price_cents,
    enabled: Boolean(row.enabled),
    sortOrder: row.sort_order,
    description: row.description,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  }));
}
