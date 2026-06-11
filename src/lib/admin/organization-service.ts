import 'server-only';

import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { hashAdminPassword } from '@/lib/admin-auth/password';
import { mapAdminOrganizationMedia } from '@/lib/admin/media-url';

type AdminOrganizationMedia = {
  [key: string]: unknown;
  businessLicenseUrl: string | null;
};

export const organizationInputSchema = z.object({
  name: z.string().min(1).max(150),
  contactName: z.string().min(1).max(100),
  contactPhone: z.string().min(1).max(32),
  email: z.string().email().optional().or(z.literal('')),
  creditCode: z.string().min(1).max(64),
  address: z.string().max(255).optional().or(z.literal('')),
  description: z.string().max(5000).optional().or(z.literal('')),
  businessLicensePath: z.string().min(1).max(255),
});

export const organizationRegisterSchema = organizationInputSchema.extend({
  password: z.string().min(8).max(100),
});

export const organizationAdminCreateSchema = organizationRegisterSchema.extend({
  initialStatus: z.enum(['approved', 'pending']).default('approved'),
});

export const organizationReviewSchema = z.object({
  action: z.enum(['approve', 'reject']),
  reason: z.string().max(500).optional(),
});

function normalizeOptional(value: string | undefined) {
  return value && value.trim() ? value.trim() : null;
}

function mapOrganization(row: {
  id: string;
  name: string;
  contactName: string;
  contactPhone: string;
  email: string | null;
  creditCode: string;
  address: string | null;
  description: string | null;
  businessLicensePath: string;
  status: string;
  rejectReason: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    name: row.name,
    contactName: row.contactName,
    contactPhone: row.contactPhone,
    email: row.email,
    creditCode: row.creditCode,
    address: row.address,
    description: row.description,
    businessLicensePath: row.businessLicensePath,
    status: row.status,
    rejectReason: row.rejectReason,
    reviewedAt: row.reviewedAt ? row.reviewedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function registerOrganization(
  input: z.infer<typeof organizationRegisterSchema>,
): Promise<AdminOrganizationMedia> {
  const data = organizationRegisterSchema.parse(input);
  const organizationId = randomUUID();
  const accountId = randomUUID();
  const passwordHash = await hashAdminPassword(data.password);

  const organization = await prisma.$transaction(async (tx) => {
    const createdOrganization = await tx.organization.create({
      data: {
        id: organizationId,
        name: data.name,
        contactName: data.contactName,
        contactPhone: data.contactPhone,
        email: normalizeOptional(data.email),
        creditCode: data.creditCode,
        address: normalizeOptional(data.address),
        description: normalizeOptional(data.description),
        businessLicensePath: data.businessLicensePath,
        status: 'pending',
      },
    });

    await tx.adminUser.create({
      data: {
        id: accountId,
        phone: data.contactPhone,
        passwordHash,
        role: 'organization',
        displayName: data.name,
        organizationId,
        status: 'pending',
      },
    });

    return createdOrganization;
  });

  return mapAdminOrganizationMedia(mapOrganization(organization));
}

export async function createOrganizationByAdmin(
  input: z.infer<typeof organizationAdminCreateSchema>,
): Promise<AdminOrganizationMedia> {
  const data = organizationAdminCreateSchema.parse(input);
  const organizationId = randomUUID();
  const passwordHash = await hashAdminPassword(data.password);

  const organization = await prisma.$transaction(async (tx) => {
    const createdOrganization = await tx.organization.create({
      data: {
        id: organizationId,
        name: data.name,
        contactName: data.contactName,
        contactPhone: data.contactPhone,
        email: normalizeOptional(data.email),
        creditCode: data.creditCode,
        address: normalizeOptional(data.address),
        description: normalizeOptional(data.description),
        businessLicensePath: data.businessLicensePath,
        status: data.initialStatus,
        reviewedAt: data.initialStatus === 'approved' ? new Date() : null,
      },
    });

    await tx.adminUser.create({
      data: {
        id: randomUUID(),
        phone: data.contactPhone,
        passwordHash,
        role: 'organization',
        displayName: data.name,
        organizationId,
        status: data.initialStatus === 'approved' ? 'active' : 'pending',
      },
    });

    return createdOrganization;
  });

  return mapAdminOrganizationMedia(mapOrganization(organization));
}

export async function listOrganizations(): Promise<AdminOrganizationMedia[]> {
  const rows = await prisma.organization.findMany({
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
  });
  return rows.map((row) => mapAdminOrganizationMedia(mapOrganization(row)));
}

export async function getOrganizationById(id: string): Promise<AdminOrganizationMedia | null> {
  const row = await prisma.organization.findUnique({ where: { id } });
  return row ? mapAdminOrganizationMedia(mapOrganization(row)) : null;
}

export async function updateOrganizationByAdmin(
  id: string,
  input: z.infer<typeof organizationInputSchema>,
): Promise<AdminOrganizationMedia> {
  const data = organizationInputSchema.parse(input);
  const organization = await prisma.organization.update({
    where: { id },
    data: {
      name: data.name,
      contactName: data.contactName,
      contactPhone: data.contactPhone,
      email: normalizeOptional(data.email),
      creditCode: data.creditCode,
      address: normalizeOptional(data.address),
      description: normalizeOptional(data.description),
      businessLicensePath: data.businessLicensePath,
    },
  });

  return mapAdminOrganizationMedia(mapOrganization(organization));
}

export async function reviewOrganization(
  id: string,
  adminUserId: string,
  input: z.infer<typeof organizationReviewSchema>,
): Promise<AdminOrganizationMedia> {
  const data = organizationReviewSchema.parse(input);
  const now = new Date();
  const approved = data.action === 'approve';

  const organization = await prisma.$transaction(async (tx) => {
    const updated = await tx.organization.update({
      where: { id },
      data: {
        status: approved ? 'approved' : 'rejected',
        reviewedByAdminUserId: adminUserId,
        reviewedAt: now,
        rejectReason: approved ? null : data.reason || '资料未通过审核',
      },
    });

    await tx.adminUser.updateMany({
      where: { organizationId: id, role: 'organization' },
      data: { status: approved ? 'active' : 'pending' },
    });

    return updated;
  });

  return mapAdminOrganizationMedia(mapOrganization(organization));
}
