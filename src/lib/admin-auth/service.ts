import 'server-only';

import { prisma } from '@/lib/db/prisma';
import { verifyAdminPassword } from '@/lib/admin-auth/password';
import { getAdminSessionUserId } from '@/lib/admin-auth/session';

export interface CurrentAdminUser {
  id: string;
  phone: string;
  role: string;
  displayName: string;
  organizationId: string | null;
  status: string;
  organizationStatus: string | null;
}

export async function authenticateAdmin(phone: string, password: string) {
  const account = await prisma.adminUser.findUnique({
    where: { phone },
    include: { organization: true },
  });

  if (!account) return null;

  const passwordOk = await verifyAdminPassword(password, account.passwordHash);
  if (!passwordOk) return null;
  if (account.status === 'disabled') return null;

  await prisma.adminUser.update({
    where: { id: account.id },
    data: { lastLoginAt: new Date() },
  });

  return mapCurrentAdminUser(account);
}

export async function getCurrentAdminUser(): Promise<CurrentAdminUser | null> {
  const id = await getAdminSessionUserId();
  if (!id) return null;

  const account = await prisma.adminUser.findUnique({
    where: { id },
    include: { organization: true },
  });

  if (!account || account.status === 'disabled') return null;

  return mapCurrentAdminUser(account);
}

function mapCurrentAdminUser(account: {
  id: string;
  phone: string;
  role: string;
  displayName: string;
  organizationId: string | null;
  status: string;
  organization: { status: string } | null;
}): CurrentAdminUser {
  return {
    id: account.id,
    phone: account.phone,
    role: account.role,
    displayName: account.displayName,
    organizationId: account.organizationId,
    status: account.status,
    organizationStatus: account.organization?.status || null,
  };
}
