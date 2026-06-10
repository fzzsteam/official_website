import { z } from 'zod';
import { ok, fail } from '@/lib/api/response';
import { requireAdminSession, assertApprovedOrganization, isAdminAuthError } from '@/lib/admin-auth/require-admin';
import { createUploadPolicy } from '@/lib/admin-upload/upload-service';

export const dynamic = 'force-dynamic';

const policySchema = z.object({
  fileKind: z.enum(['license', 'cover', 'poster', 'trailer', 'episode', 'cast']),
});

export async function POST(request: Request) {
  try {
    const adminUser = await requireAdminSession();
    assertApprovedOrganization(adminUser);
    const input = policySchema.parse(await request.json());
    return ok({ upload: createUploadPolicy(adminUser, input.fileKind) });
  } catch (error) {
    if (error instanceof z.ZodError) return fail('INVALID_REQUEST', '请求参数错误', 400);
    if (isAdminAuthError(error)) {
      return fail(error.code, error.message, error.status);
    }
    return fail('CREATE_UPLOAD_POLICY_FAILED', '创建上传凭证失败', 500, error);
  }
}
