import { z } from 'zod';
import { ok, fail, formatZodErrorMessage } from '@/lib/api/response';
import { failFromPrismaDuplicateResource, isPrismaDuplicateError } from '@/lib/api/prisma-errors';
import { requireAdminRole, isAdminAuthError } from '@/lib/admin-auth/require-admin';
import { createOrganizationByAdmin, listOrganizations } from '@/lib/admin/organization-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdminRole();
    return ok({ organizations: await listOrganizations() });
  } catch (error) {
    return failFromAdminError(error, 'LIST_ORGANIZATIONS_FAILED', '获取机构列表失败');
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminRole();
    const organization = await createOrganizationByAdmin(await request.json());
    return ok({ organization });
  } catch (error) {
    if (error instanceof z.ZodError) return fail('INVALID_REQUEST', formatZodErrorMessage(error), 400);
    if (isPrismaDuplicateError(error)) {
      return failFromPrismaDuplicateResource(error);
    }
    return failFromAdminError(error, 'CREATE_ORGANIZATION_FAILED', '创建机构失败');
  }
}

function failFromAdminError(error: unknown, code: string, message: string) {
  if (isAdminAuthError(error)) {
    return fail(error.code, error.message, error.status);
  }
  return fail(code, message, 500, error);
}
