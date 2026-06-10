import { z } from 'zod';
import { ok, fail } from '@/lib/api/response';
import { requireAdminRole } from '@/lib/admin-auth/require-admin';
import { reviewDrama } from '@/lib/admin/drama-admin-service';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const adminUser = await requireAdminRole();
    const drama = await reviewDrama(adminUser.id, params.id, await request.json());
    return ok({ drama });
  } catch (error) {
    if (error instanceof z.ZodError) return fail('INVALID_REQUEST', '请求参数错误', 400);
    if (error instanceof Error && 'code' in error && 'status' in error) {
      return fail(String(error.code), error.message, Number(error.status));
    }
    return fail('ADMIN_DRAMA_OPERATION_FAILED', '剧集操作失败', 500, error);
  }
}
