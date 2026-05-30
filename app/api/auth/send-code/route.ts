import { fail, ok } from '@/lib/api/response';
import { createSmsCode, normalizePhone } from '@/lib/auth/sms-code';
import { sendLoginSms } from '@/lib/sms/aliyun-sms-service';

function getRequestIp(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  return forwardedFor?.split(',')[0]?.trim() || null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const phone = normalizePhone(String(body?.phone || ''));
    const { code, expiresAt } = await createSmsCode(phone, getRequestIp(request));

    await sendLoginSms(phone, code);

    return ok({ sent: true, expiresAt });
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_PHONE') {
      return fail('INVALID_PHONE', '手机号格式错误', 400);
    }

    return fail('SMS_SEND_FAILED', '验证码发送失败', 400, error);
  }
}
