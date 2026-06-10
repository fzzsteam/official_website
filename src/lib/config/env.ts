import 'server-only';
import { z } from 'zod';

const envSchema = z.object({
  COOKIE_SECRET: z.string().min(32),
  ALIYUN_ACCESS_KEY_ID: z.string().min(1),
  ALIYUN_ACCESS_KEY_SECRET: z.string().min(1),
  ALIYUN_SMS_SIGN_NAME: z.string().min(1),
  ALIYUN_SMS_TEMPLATE_CODE: z.string().min(1),
  OSS_REGION: z.string().min(1),
  OSS_BUCKET: z.string().min(1),
  OSS_ACCESS_KEY_ID: z.string().min(1),
  OSS_ACCESS_KEY_SECRET: z.string().min(1),
  OSS_SIGNED_URL_EXPIRES_SECONDS: z.coerce.number().int().positive().default(600),
  WECHAT_PAY_APPID: z.string().min(1),
  WECHAT_PAY_MCH_ID: z.string().min(1),
  WECHAT_PAY_API_V3_KEY: z.string().min(1),
  WECHAT_PAY_PRIVATE_KEY_BASE64: z.string().min(1),
  WECHAT_PAY_CERT_SERIAL_NO: z.string().min(1),
  WECHAT_PAY_PUBLIC_KEY_ID: z.string().min(1),
  WECHAT_PAY_PUBLIC_KEY_BASE64: z.string().min(1),
  WECHAT_PAY_NOTIFY_URL: z.string().url(),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  DEFAULT_ADMIN_PHONE: z.string().min(1).default('13800000000'),
  DEFAULT_ADMIN_PASSWORD: z.string().min(8).default('Admin123456'),
  DEFAULT_ADMIN_DISPLAY_NAME: z.string().min(1).default('系统管理员'),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (!cachedEnv) {
    cachedEnv = envSchema.parse(process.env);
  }

  return cachedEnv;
}
