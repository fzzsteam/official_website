import { fail, ok } from '@/lib/api/response';
import { getPublishedDramas } from '@/lib/drama/drama-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const dramas = await getPublishedDramas();

    return ok({ dramas });
  } catch (error) {
    return fail('DRAMAS_FETCH_FAILED', '短剧列表获取失败', 500, error);
  }
}
