import 'server-only';

import { posix } from 'node:path';
import { createHmac, randomUUID } from 'node:crypto';
import { getEnv } from '@/lib/config/env';
import type { CurrentAdminUser } from '@/lib/admin-auth/service';
import { createAdminAuthError } from '@/lib/admin-auth/require-admin';

const UPLOAD_EXPIRES_SECONDS = 600;

function createPolicyForPrefix(prefix: string) {
  const env = getEnv();
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

export function getAllowedUploadPrefix(adminUser: CurrentAdminUser) {
  if (adminUser.role === 'admin') {
    return `admin/${adminUser.id}/`;
  }
  if (adminUser.role === 'organization' && adminUser.organizationId) {
    return `organizations/${adminUser.organizationId}/`;
  }
  throw createAdminAuthError('ADMIN_FORBIDDEN', '账号配置异常，请联系管理员', 403);
}

export function getRegistrationUploadPrefix(fileKind: string) {
  return `organization-registration/${fileKind}/${new Date().toISOString().slice(0, 10)}/`;
}

export function assertAllowedUploadPath(adminUser: CurrentAdminUser, objectPath: string) {
  const stripped = objectPath.replace(/^\/+/, '');
  const normalized = posix.normalize(stripped);
  const prefix = getAllowedUploadPrefix(adminUser);

  if (normalized.split('/').includes('..') || !normalized.startsWith(prefix)) {
    throw createAdminAuthError('INVALID_UPLOAD_PATH', 'OSS path 不在授权范围内', 403);
  }

  return normalized;
}

export function assertRegistrationUploadPath(objectPath: string) {
  const stripped = objectPath.replace(/^\/+/, '');
  const normalized = posix.normalize(stripped);
  const prefix = 'organization-registration/license/';

  if (normalized.split('/').includes('..') || !normalized.startsWith(prefix)) {
    throw createAdminAuthError('INVALID_UPLOAD_PATH', 'OSS path 不在授权范围内', 403);
  }

  return normalized;
}

export function createUploadPolicy(adminUser: CurrentAdminUser, fileKind: string) {
  return createPolicyForPrefix(`${getAllowedUploadPrefix(adminUser)}${fileKind}/${new Date().toISOString().slice(0, 10)}/`);
}

export function createRegistrationUploadPolicy(fileKind: 'license') {
  return createPolicyForPrefix(getRegistrationUploadPrefix(fileKind));
}
