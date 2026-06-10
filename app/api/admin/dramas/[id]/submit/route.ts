import { ok, fail } from '@/lib/api/response';
import { requireAdminSession, assertApprovedOrganization } from '@/lib/admin-auth/require-admin';
import { submitDramaForReview } from '@/lib/admin/drama-admin-service';

export const dynamic = 'force-dynamic';

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    const adminUser = await requireAdminSession();
    assertApprovedOrganization(adminUser);
    const drama = await submitDramaForReview(adminUser, params.id);
    return ok({ drama });
  } catch (error) {
    if (error instanceof Error && 'code' in error && 'status' in error) {
      return fail(String(error.code), error.message, Number(error.status));
    }
    return fail('ADMIN_DRAMA_OPERATION_FAILED', '剧集操作失败', 500, error);
  }
}
