import 'server-only';

import { createHmac, randomUUID } from 'node:crypto';
import { getEnv } from '@/lib/config/env';
import type { CurrentAdminUser } from '@/lib/admin-auth/service';

const UPLOAD_EXPIRES_SECONDS = 600;

export function getAllowedUploadPrefix(adminUser: CurrentAdminUser) {
  if (adminUser.role === 'admin') {
    return `admin/${adminUser.id}/`;
  }
  if (adminUser.role === 'organization' && adminUser.organizationId) {
    return `organizations/${adminUser.organizationId}/`;
  }
  throw new Error('INVALID_UPLOAD_OWNER');
}

export function assertAllowedUploadPath(adminUser: CurrentAdminUser, objectPath: string) {
  const normalized = objectPath.replace(/^\/+/, '');
  const prefix = getAllowedUploadPrefix(adminUser);
  if (!normalized.startsWith(prefix)) {
    const error = new Error('OSS path 不在授权范围内') as Error & { code: string; status: number };
    error.code = 'INVALID_UPLOAD_PATH';
    error.status = 403;
    throw error;
  }
  return normalized;
}

export function createUploadPolicy(adminUser: CurrentAdminUser, fileKind: string) {
  const env = getEnv();
  const prefix = `${getAllowedUploadPrefix(adminUser)}${fileKind}/${new Date().toISOString().slice(0, 10)}/`;
  const objectKey = `${prefix}${randomUUID()}`;
  const expires = new Date(Date.now() + UPLOAD_EXPIRES_SECONDS * 1000).toISOString();

  const policy = Buffer.from(JSON.stringify({
    expiration: expires,
    conditions: [
      ['starts-with', '$key', prefix],
      ['content-length-range', 1, 1024 * 1024 * 1024 * 5],
    ],
  })).toString('base64');

  const signature = createHmac('sha1', env.OSS_ACCESS_KEY_SECRET).update(policy).digest('base64');

  return {
    host: `https://${env.OSS_BUCKET}.${env.OSS_REGION}.aliyuncs.com`,
    region: env.OSS_REGION,
    bucket: env.OSS_BUCKET,
    accessKeyId: env.OSS_ACCESS_KEY_ID,
    policy,
    signature,
    objectKey,
    prefix,
    expires,
  };
}
