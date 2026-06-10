import { ok, fail } from '@/lib/api/response';
import { requireAdminSession, assertApprovedOrganization } from '@/lib/admin-auth/require-admin';
import { deleteAdminEpisode } from '@/lib/admin/episode-admin-service';

export const dynamic = 'force-dynamic';

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; episodeId: string } },
) {
  try {
    const adminUser = await requireAdminSession();
    assertApprovedOrganization(adminUser);
    const result = await deleteAdminEpisode(adminUser, params.id, params.episodeId);
    return ok(result);
  } catch (error) {
    if (error instanceof Error && 'code' in error && 'status' in error) {
      return fail(String(error.code), error.message, Number(error.status));
    }
    return fail('ADMIN_EPISODE_OPERATION_FAILED', '分集操作失败', 500, error);
  }
}
