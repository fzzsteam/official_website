import { fail, ok } from '@/lib/api/response';
import { getDramaDetail } from '@/lib/drama/drama-service';

export const dynamic = 'force-dynamic';

interface DramaRouteContext {
  params: {
    id: string;
  };
}

export async function GET(_request: Request, { params }: DramaRouteContext) {
  try {
    const drama = await getDramaDetail(params.id);

    return ok({ drama });
  } catch (error) {
    if (error instanceof Error && error.message === 'DRAMA_NOT_FOUND') {
      return fail('DRAMA_NOT_FOUND', '短剧不存在', 404);
    }

    return fail('DRAMA_FETCH_FAILED', '短剧详情获取失败', 500, error);
  }
}
