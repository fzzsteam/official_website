import { ok, fail } from '@/lib/api/response';
import { requireAdminRole, isAdminAuthError } from '@/lib/admin-auth/require-admin';
import { resetOrganizationPassword } from '@/lib/admin/organization-service';

export const dynamic = 'force-dynamic';

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdminRole();
    await resetOrganizationPassword(params.id);
    return ok({});
  } catch (error) {
    if (isAdminAuthError(error)) {
      return fail(error.code, error.message, error.status);
    }
    if (error instanceof Error && error.message === 'ORGANIZATION_NOT_FOUND') {
      return fail('ORGANIZATION_NOT_FOUND', '机构不存在', 404);
    }
    if (error instanceof Error && error.message === 'INVALID_ORGANIZATION_PHONE') {
      return fail('INVALID_ORGANIZATION_PHONE', '机构手机号不足 8 位，无法重置密码', 400);
    }
    return fail('RESET_ORGANIZATION_PASSWORD_FAILED', '重置机构密码失败', 500, error);
  }
}
