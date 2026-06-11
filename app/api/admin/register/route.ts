import { z } from 'zod';
import { ok, fail, formatZodErrorMessage } from '@/lib/api/response';
import { failFromPrismaDuplicateResource, isPrismaDuplicateError } from '@/lib/api/prisma-errors';
import { registerOrganization } from '@/lib/admin/organization-service';
import { isAdminAuthError } from '@/lib/admin-auth/require-admin';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const organization = await registerOrganization(await request.json());
    return ok({ organization });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail('INVALID_REQUEST', formatZodErrorMessage(error), 400);
    }
    if (isPrismaDuplicateError(error)) {
      return failFromPrismaDuplicateResource(error);
    }
    if (isAdminAuthError(error)) {
      return fail(error.code, error.message, error.status);
    }
    return fail('ORGANIZATION_REGISTER_FAILED', '机构注册失败', 500, error);
  }
}
