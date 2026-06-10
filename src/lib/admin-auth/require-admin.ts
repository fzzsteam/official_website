import 'server-only';

import { getCurrentAdminUser, type CurrentAdminUser } from '@/lib/admin-auth/service';

export function createAdminAuthError(code: string, message: string, status = 401) {
  const error = new Error(message) as Error & { code: string; status: number };
  error.code = code;
  error.status = status;
  return error;
}

export function isAdminAuthError(error: unknown): error is Error & { code: string; status: number } {
  if (!(error instanceof Error)) {
    return false;
  }

  const candidate = error as Error & { code?: unknown; status?: unknown };
  return typeof candidate.code === 'string' && typeof candidate.status === 'number';
}

export async function requireAdminSession(): Promise<CurrentAdminUser> {
  const user = await getCurrentAdminUser();
  if (!user) {
    throw createAdminAuthError('ADMIN_AUTH_REQUIRED', '请先登录后台', 401);
  }
  return user;
}

export async function requireAdminRole() {
  const user = await requireAdminSession();
  if (user.role !== 'admin') {
    throw createAdminAuthError('ADMIN_FORBIDDEN', '无权执行该操作', 403);
  }
  return user;
}

export async function requireOrganizationRole() {
  const user = await requireAdminSession();
  if (user.role !== 'organization') {
    throw createAdminAuthError('ADMIN_FORBIDDEN', '无权执行该操作', 403);
  }
  return user;
}

export function assertApprovedOrganization(user: CurrentAdminUser) {
  if (user.role === 'organization' && user.organizationStatus !== 'approved') {
    throw createAdminAuthError('ORGANIZATION_PENDING_REVIEW', '机构尚未审核通过', 403);
  }
}
