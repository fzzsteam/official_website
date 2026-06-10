import { z } from 'zod';
import { ok, fail } from '@/lib/api/response';
import { registerOrganization } from '@/lib/admin/organization-service';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const organization = await registerOrganization(await request.json());
    return ok({ organization });
  } catch (error) {
    if (error instanceof z.ZodError) return fail('INVALID_REQUEST', '请求参数错误', 400);
    return fail('ORGANIZATION_REGISTER_FAILED', '机构注册失败', 500, error);
  }
}
