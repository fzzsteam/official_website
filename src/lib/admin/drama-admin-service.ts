import 'server-only';

import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import type { CurrentAdminUser } from '@/lib/admin-auth/service';
import { assertAllowedUploadPath } from '@/lib/admin-upload/upload-service';
import { replaceDramaGenres } from '@/lib/admin/drama-genres';
import { mapAdminDramaMedia } from '@/lib/admin/media-url';

type AdminDramaMedia = {
  [key: string]: unknown;
  coverUrl: string | null;
  posterUrl: string | null;
};

export const dramaInputSchema = z.object({
  title: z.string().min(1).max(150),
  subtitle: z.string().max(255).optional().or(z.literal('')),
  synopsis: z.string().max(10000).optional().or(z.literal('')),
  coverPath: z.string().min(1).max(255),
  posterPath: z.string().max(255).optional().or(z.literal('')),
  releaseStatus: z.enum(['upcoming', 'released']).default('upcoming'),
  sortOrder: z.coerce.number().int().default(0),
  genreCodes: z.array(z.string()).default([]),
});

export const dramaReviewSchema = z.object({
  action: z.enum(['approve', 'reject']),
  reason: z.string().max(500).optional(),
});

export const dramaReleaseSchema = z.object({
  releaseStatus: z.enum(['upcoming', 'released']),
});

function nullable(value: string | undefined) {
  return value && value.trim() ? value.trim() : null;
}

function getDramaOwnershipWhere(adminUser: CurrentAdminUser) {
  if (adminUser.role === 'admin') {
    return {};
  }
  return { organizationId: adminUser.organizationId || '__missing__' };
}

function createSlugBase(title: string) {
  return (
    title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'drama'
  );
}

export async function generateUniqueDramaSlug(title: string) {
  const base = createSlugBase(title);

  for (let index = 0; index < 5; index += 1) {
    const suffix = randomUUID().slice(0, 8);
    const slug = `${base}-${suffix}`;
    const exists = await prisma.drama.findUnique({ where: { slug } });

    if (!exists) {
      return slug;
    }
  }

  return `${base}-${randomUUID()}`;
}

export async function listAdminDramas(adminUser: CurrentAdminUser): Promise<AdminDramaMedia[]> {
  const rows = await prisma.drama.findMany({
    where: getDramaOwnershipWhere(adminUser),
    orderBy: [{ updatedAt: 'desc' }],
    include: { _count: { select: { episodes: true } }, organization: true, genres: true },
  });

  return rows.map(mapAdminDramaMedia);
}

export async function getAdminDrama(adminUser: CurrentAdminUser, dramaId: string): Promise<AdminDramaMedia> {
  const drama = await prisma.drama.findFirst({
    where: { id: dramaId, ...getDramaOwnershipWhere(adminUser) },
    include: { _count: { select: { episodes: true } }, organization: true, genres: true },
  });
  if (!drama) {
    throw createDramaAdminError('DRAMA_NOT_FOUND', '剧集不存在', 404);
  }

  return mapAdminDramaMedia(drama);
}

export async function createAdminDrama(
  adminUser: CurrentAdminUser,
  input: z.infer<typeof dramaInputSchema>,
): Promise<AdminDramaMedia> {
  const data = dramaInputSchema.parse(input);
  assertAllowedUploadPath(adminUser, data.coverPath);
  if (data.posterPath) assertAllowedUploadPath(adminUser, data.posterPath);
  const slug = await generateUniqueDramaSlug(data.title);

  return prisma.$transaction(async (tx) => {
    const drama = await tx.drama.create({
      data: {
        id: randomUUID(),
        slug,
        title: data.title,
        subtitle: nullable(data.subtitle),
        synopsis: nullable(data.synopsis),
        coverPath: data.coverPath,
        posterPath: nullable(data.posterPath),
        releaseStatus: data.releaseStatus,
        sortOrder: data.sortOrder,
        status: 'draft',
        ownerType: adminUser.role === 'admin' ? 'admin' : 'organization',
        ownerAdminUserId: adminUser.role === 'admin' ? adminUser.id : null,
        organizationId: adminUser.role === 'organization' ? adminUser.organizationId : null,
        reviewStatus: 'draft',
      },
      include: { _count: { select: { episodes: true } }, organization: true, genres: true },
    });

    await replaceDramaGenres(tx, drama.id, data.genreCodes);
    return getAdminDrama(adminUser, drama.id);
  });
}

export async function updateAdminDrama(
  adminUser: CurrentAdminUser,
  dramaId: string,
  input: z.infer<typeof dramaInputSchema>,
): Promise<AdminDramaMedia> {
  const data = dramaInputSchema.parse(input);
  const drama = await prisma.drama.findFirst({ where: { id: dramaId, ...getDramaOwnershipWhere(adminUser) } });
  if (!drama) {
    throw createDramaAdminError('DRAMA_NOT_FOUND', '剧集不存在', 404);
  }
  if (adminUser.role === 'organization' && drama.reviewStatus === 'submitted') {
    throw createDramaAdminError('DRAMA_NOT_EDITABLE', '剧集审核中，暂不可编辑', 409);
  }

  assertAllowedUploadPath(adminUser, data.coverPath);
  if (data.posterPath) assertAllowedUploadPath(adminUser, data.posterPath);

  return prisma.$transaction(async (tx) => {
    await tx.drama.update({
      where: { id: dramaId },
      data: {
        title: data.title,
        subtitle: nullable(data.subtitle),
        synopsis: nullable(data.synopsis),
        coverPath: data.coverPath,
        posterPath: nullable(data.posterPath),
        releaseStatus: data.releaseStatus,
        sortOrder: data.sortOrder,
        reviewStatus: drama.reviewStatus === 'rejected' ? 'draft' : drama.reviewStatus,
        reviewRejectReason: null,
      },
    });

    await replaceDramaGenres(tx, dramaId, data.genreCodes);
    return getAdminDrama(adminUser, dramaId);
  });
}

export async function submitDramaForReview(
  adminUser: CurrentAdminUser,
  dramaId: string,
): Promise<AdminDramaMedia> {
  const drama = await prisma.drama.findFirst({ where: { id: dramaId, ...getDramaOwnershipWhere(adminUser) } });
  if (!drama) {
    throw createDramaAdminError('DRAMA_NOT_FOUND', '剧集不存在', 404);
  }

  if (adminUser.role === 'admin') {
    const updatedDrama = await prisma.drama.update({
      where: { id: dramaId },
      data: {
        reviewStatus: 'approved',
        status: 'published',
        publishedAt: new Date(),
        reviewedByAdminUserId: adminUser.id,
        reviewedAt: new Date(),
        reviewRejectReason: null,
      },
    });

    return mapAdminDramaMedia(updatedDrama);
  }

  const updatedDrama = await prisma.drama.update({
    where: { id: dramaId },
    data: {
      reviewStatus: 'submitted',
      submittedAt: new Date(),
      status: 'draft',
      reviewRejectReason: null,
    },
  });

  return mapAdminDramaMedia(updatedDrama);
}

export async function reviewDrama(
  adminUserId: string,
  dramaId: string,
  input: z.infer<typeof dramaReviewSchema>,
): Promise<AdminDramaMedia> {
  const data = dramaReviewSchema.parse(input);
  const approved = data.action === 'approve';

  const drama = await prisma.drama.update({
    where: { id: dramaId },
    data: {
      reviewStatus: approved ? 'approved' : 'rejected',
      status: approved ? 'published' : 'draft',
      publishedAt: approved ? new Date() : null,
      reviewedByAdminUserId: adminUserId,
      reviewedAt: new Date(),
      reviewRejectReason: approved ? null : data.reason || '内容未通过审核',
    },
  });

  return mapAdminDramaMedia(drama);
}

export async function updateDramaReleaseStatus(
  adminUser: CurrentAdminUser,
  dramaId: string,
  input: z.infer<typeof dramaReleaseSchema>,
): Promise<AdminDramaMedia> {
  const data = dramaReleaseSchema.parse(input);
  const drama = await prisma.drama.findFirst({
    where: { id: dramaId, ...getDramaOwnershipWhere(adminUser) },
    include: { _count: { select: { episodes: true } }, organization: true, genres: true },
  });

  if (!drama) {
    throw createDramaAdminError('DRAMA_NOT_FOUND', '剧集不存在', 404);
  }

  if (drama.reviewStatus !== 'approved') {
    throw createDramaAdminError('DRAMA_NOT_APPROVED', '审核通过后才可以上架', 409);
  }

  const updatedDrama = await prisma.drama.update({
    where: { id: dramaId },
    data: {
      releaseStatus: data.releaseStatus,
      publishedAt: data.releaseStatus === 'released' ? (drama.publishedAt || new Date()) : null,
    },
    include: { _count: { select: { episodes: true } }, organization: true, genres: true },
  });

  return mapAdminDramaMedia(updatedDrama);
}

function createDramaAdminError(code: string, message: string, status: number) {
  const error = new Error(message) as Error & { code: string; status: number };
  error.code = code;
  error.status = status;
  return error;
}
