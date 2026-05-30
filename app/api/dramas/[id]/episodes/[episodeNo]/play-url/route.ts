import { fail, ok } from '@/lib/api/response';
import { getSessionUserId } from '@/lib/auth/session';
import { getEpisodePlayUrl } from '@/lib/drama/drama-service';

export const dynamic = 'force-dynamic';

interface PlayUrlRouteContext {
  params: {
    id: string;
    episodeNo: string;
  };
}

export async function GET(_request: Request, { params }: PlayUrlRouteContext) {
  const episodeNo = Number.parseInt(params.episodeNo, 10);

  if (!Number.isInteger(episodeNo) || episodeNo <= 0) {
    return fail('INVALID_EPISODE_NO', '集数参数错误', 400);
  }

  try {
    const userId = await getSessionUserId();
    const result = await getEpisodePlayUrl(params.id, episodeNo, userId);

    return ok(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'AUTH_REQUIRED') {
      return fail('AUTH_REQUIRED', '请先登录', 401);
    }

    if (error instanceof Error && error.message === 'VIP_REQUIRED') {
      return fail('VIP_REQUIRED', '请先开通会员', 403);
    }

    if (error instanceof Error && error.message === 'EPISODE_NOT_FOUND') {
      return fail('EPISODE_NOT_FOUND', '剧集不存在', 404);
    }

    return fail('PLAY_URL_FETCH_FAILED', '播放地址获取失败', 500, error);
  }
}
