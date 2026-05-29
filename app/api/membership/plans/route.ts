import { ok } from '@/lib/api/response';
import { getEnabledMembershipPlans } from '@/lib/membership/membership-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  const plans = await getEnabledMembershipPlans();

  return ok({
    plans: plans.map((plan) => ({
      code: plan.code,
      name: plan.name,
      durationDays: plan.durationDays,
      priceCents: plan.priceCents,
      recommended: plan.code === '365d',
    })),
  });
}
