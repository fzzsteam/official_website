import 'server-only';

import OSS from 'ali-oss';
import { getEnv } from '@/lib/config/env';

export const OSS_SIGNED_URL_EXPIRES_SECONDS = 600;

let client: OSS | null = null;

function getOssClient() {
  if (!client) {
    const env = getEnv();

    client = new OSS({
      region: env.OSS_REGION,
      bucket: env.OSS_BUCKET,
      accessKeyId: env.OSS_ACCESS_KEY_ID,
      accessKeySecret: env.OSS_ACCESS_KEY_SECRET,
    });
  }

  return client;
}

function normalizeOssPath(path: string) {
  return path.replace(/^\/+/, '');
}

export function signOssPath(path: string) {
  const env = getEnv();

  return getOssClient().signatureUrl(normalizeOssPath(path), {
    expires: env.OSS_SIGNED_URL_EXPIRES_SECONDS || OSS_SIGNED_URL_EXPIRES_SECONDS,
  });
}
