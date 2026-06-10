import { z } from 'zod';
import { ok, fail } from '@/lib/api/response';
import { authenticateAdmin } from '@/lib/admin-auth/service';
import { createAdminSession } from '@/lib/admin-auth/session';

const loginSchema = z.object({
  phone: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const input = loginSchema.parse(await request.json());
    const user = await authenticateAdmin(input.phone, input.password);

    if (!user) {
      return fail('ADMIN_INVALID_CREDENTIALS', '手机号或密码错误', 401);
    }

    await createAdminSession(user.id);
    return ok({ user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail('INVALID_REQUEST', '请求参数错误', 400);
    }
    return fail('ADMIN_LOGIN_FAILED', '后台登录失败', 500, error);
  }
}
