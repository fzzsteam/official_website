import { z } from 'zod';
import { ok, fail } from '@/lib/api/response';
import { requireAdminSession, assertApprovedOrganization } from '@/lib/admin-auth/require-admin';
import { createAdminDrama, listAdminDramas } from '@/lib/admin/drama-admin-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const adminUser = await requireAdminSession();
    assertApprovedOrganization(adminUser);
    return ok({ dramas: await listAdminDramas(adminUser) });
  } catch (error) {
    return failFromDramaError(error);
  }
}

export async function POST(request: Request) {
  try {
    const adminUser = await requireAdminSession();
    assertApprovedOrganization(adminUser);
    const drama = await createAdminDrama(adminUser, await request.json());
    return ok({ drama });
  } catch (error) {
    if (error instanceof z.ZodError) return fail('INVALID_REQUEST', '请求参数错误', 400);
    return failFromDramaError(error);
  }
}

function failFromDramaError(error: unknown) {
  if (error instanceof Error && 'code' in error && 'status' in error) {
    return fail(String(error.code), error.message, Number(error.status));
  }
  return fail('ADMIN_DRAMA_OPERATION_FAILED', '剧集操作失败', 500, error);
}
