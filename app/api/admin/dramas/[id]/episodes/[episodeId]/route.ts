import { z } from 'zod';
import { ok, fail } from '@/lib/api/response';
import { requireAdminSession, assertApprovedOrganization } from '@/lib/admin-auth/require-admin';
import { deleteAdminEpisode, upsertAdminEpisode } from '@/lib/admin/episode-admin-service';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: Request,
  { params }: { params: { id: string; episodeId: string } },
) {
  try {
    const adminUser = await requireAdminSession();
    assertApprovedOrganization(adminUser);
    const episode = await upsertAdminEpisode(adminUser, params.id, await request.json());
    return ok({ episode });
  } catch (error) {
    if (error instanceof z.ZodError) return fail('INVALID_REQUEST', '请求参数错误', 400);
    if (error instanceof Error && 'code' in error && 'status' in error) {
      return fail(String(error.code), error.message, Number(error.status));
    }
    return fail('ADMIN_EPISODE_OPERATION_FAILED', '分集操作失败', 500, error);
  }
}

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
