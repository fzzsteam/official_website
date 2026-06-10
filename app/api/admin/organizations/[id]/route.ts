import { ok, fail } from '@/lib/api/response';
import { requireAdminRole, isAdminAuthError } from '@/lib/admin-auth/require-admin';
import { getOrganizationById } from '@/lib/admin/organization-service';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdminRole();
    const organization = await getOrganizationById(params.id);
    if (!organization) return fail('ORGANIZATION_NOT_FOUND', '机构不存在', 404);
    return ok({ organization });
  } catch (error) {
    if (isAdminAuthError(error)) {
      return fail(error.code, error.message, error.status);
    }
    return fail('GET_ORGANIZATION_FAILED', '获取机构失败', 500, error);
  }
}
