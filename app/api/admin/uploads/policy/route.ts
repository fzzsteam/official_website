import { z } from 'zod';
import { ok, fail } from '@/lib/api/response';
import { createAdminAuthError, assertApprovedOrganization, isAdminAuthError } from '@/lib/admin-auth/require-admin';
import { getCurrentAdminUser } from '@/lib/admin-auth/service';
import { createRegistrationUploadPolicy, createUploadPolicy } from '@/lib/admin-upload/upload-service';

export const dynamic = 'force-dynamic';

const policySchema = z.object({
  fileKind: z.enum(['license', 'cover', 'poster', 'trailer', 'episode', 'cast']),
  uploadScope: z.enum(['admin', 'registration']).optional().default('admin'),
});

export async function POST(request: Request) {
  try {
    const input = policySchema.parse(await request.json());

    if (input.uploadScope === 'registration') {
      if (input.fileKind === 'license') {
        return ok({ upload: createRegistrationUploadPolicy(input.fileKind) });
      }
      throw createAdminAuthError('ADMIN_AUTH_REQUIRED', '请先登录后台', 401);
    }

    const adminUser = await getCurrentAdminUser();

    if (!adminUser) throw createAdminAuthError('ADMIN_AUTH_REQUIRED', '请先登录后台', 401);

    assertApprovedOrganization(adminUser);
    return ok({ upload: createUploadPolicy(adminUser, input.fileKind) });
  } catch (error) {
    if (error instanceof z.ZodError) return fail('INVALID_REQUEST', '请求参数错误', 400);
    if (isAdminAuthError(error)) {
      return fail(error.code, error.message, error.status);
    }
    return fail('CREATE_UPLOAD_POLICY_FAILED', '创建上传凭证失败', 500, error);
  }
}
