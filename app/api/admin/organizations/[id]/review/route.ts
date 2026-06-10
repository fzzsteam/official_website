import { z } from 'zod';
import { ok, fail } from '@/lib/api/response';
import { requireAdminRole, isAdminAuthError } from '@/lib/admin-auth/require-admin';
import { reviewOrganization } from '@/lib/admin/organization-service';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const adminUser = await requireAdminRole();
    const organization = await reviewOrganization(params.id, adminUser.id, await request.json());
    return ok({ organization });
  } catch (error) {
    if (error instanceof z.ZodError) return fail('INVALID_REQUEST', '请求参数错误', 400);
    if (isAdminAuthError(error)) {
      return fail(error.code, error.message, error.status);
    }
    return fail('REVIEW_ORGANIZATION_FAILED', '审核机构失败', 500, error);
  }
}
