import { z } from 'zod';
import { ok, fail } from '@/lib/api/response';
import { requireAdminSession, assertApprovedOrganization } from '@/lib/admin-auth/require-admin';
import { updateAdminEpisodeStatus } from '@/lib/admin/episode-admin-service';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { id: string; episodeId: string } },
) {
  try {
    const adminUser = await requireAdminSession();
    assertApprovedOrganization(adminUser);
    const episode = await updateAdminEpisodeStatus(adminUser, params.id, params.episodeId, await request.json());
    return ok({ episode });
  } catch (error) {
    if (error instanceof z.ZodError) return fail('INVALID_REQUEST', '请求参数错误', 400);
    if (error instanceof Error && 'code' in error && 'status' in error) {
      return fail(String(error.code), error.message, Number(error.status));
    }
    return fail('ADMIN_EPISODE_STATUS_FAILED', '分集发布状态更新失败', 500, error);
  }
}
