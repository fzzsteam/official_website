import 'server-only';

import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import type { CurrentAdminUser } from '@/lib/admin-auth/service';
import { assertAllowedUploadPath } from '@/lib/admin-upload/upload-service';
import { mapAdminEpisodeMedia } from '@/lib/admin/media-url';

type AdminEpisodeMedia = {
  [key: string]: unknown;
  videoPreviewUrl: string | null;
  videoUrl: string | null;
};

export const episodeInputSchema = z.object({
  episodeNo: z.coerce.number().int().positive(),
  title: z.string().min(1).max(150),
  summary: z.string().max(5000).optional().or(z.literal('')),
  videoPath: z.string().min(1).max(255),
  coverPath: z.string().max(255).optional().or(z.literal('')),
  durationSeconds: z.coerce.number().int().min(0).default(0),
  status: z.enum(['draft', 'published']).default('draft'),
});

export const episodeStatusSchema = z.object({
  status: z.enum(['draft', 'published']),
});

function ownershipWhere(adminUser: CurrentAdminUser) {
  if (adminUser.role === 'admin') {
    return {};
  }
  return { organizationId: adminUser.organizationId || '__missing__' };
}

export async function assertDramaWritable(adminUser: CurrentAdminUser, dramaId: string) {
  const drama = await prisma.drama.findFirst({ where: { id: dramaId, ...ownershipWhere(adminUser) } });
  if (!drama) {
    throw createEpisodeAdminError('DRAMA_NOT_FOUND', '剧集不存在', 404);
  }
  if (adminUser.role === 'organization' && drama.reviewStatus === 'submitted') {
    throw createEpisodeAdminError('DRAMA_NOT_EDITABLE', '剧集审核中，暂不可编辑', 409);
  }
  return drama;
}

export async function assertDramaReadable(adminUser: CurrentAdminUser, dramaId: string) {
  const drama = await prisma.drama.findFirst({ where: { id: dramaId, ...ownershipWhere(adminUser) } });
  if (!drama) {
    throw createEpisodeAdminError('DRAMA_NOT_FOUND', '剧集不存在', 404);
  }
  return drama;
}

export async function listAdminEpisodes(adminUser: CurrentAdminUser, dramaId: string): Promise<AdminEpisodeMedia[]> {
  await assertDramaReadable(adminUser, dramaId);
  const rows = await prisma.episode.findMany({ where: { dramaId }, orderBy: { episodeNo: 'asc' } });
  return rows.map(mapAdminEpisodeMedia);
}

export async function upsertAdminEpisode(
  adminUser: CurrentAdminUser,
  dramaId: string,
  input: z.infer<typeof episodeInputSchema>,
): Promise<AdminEpisodeMedia> {
  await assertDramaWritable(adminUser, dramaId);
  const data = episodeInputSchema.parse(input);
  assertAllowedUploadPath(adminUser, data.videoPath);
  if (data.coverPath) assertAllowedUploadPath(adminUser, data.coverPath);

  const episode = await prisma.episode.upsert({
    where: { uk_episodes_drama_episode: { dramaId, episodeNo: data.episodeNo } },
    create: {
      id: randomUUID(),
      dramaId,
      episodeNo: data.episodeNo,
      title: data.title,
      summary: data.summary || null,
      videoPath: data.videoPath,
      coverPath: data.coverPath || null,
      durationSeconds: data.durationSeconds,
      accessLevel: 'member',
      status: data.status,
      publishedAt: data.status === 'published' ? new Date() : null,
    },
    update: {
      title: data.title,
      summary: data.summary || null,
      videoPath: data.videoPath,
      coverPath: data.coverPath || null,
      durationSeconds: data.durationSeconds,
      accessLevel: 'member',
      status: data.status,
      publishedAt: data.status === 'published' ? new Date() : null,
    },
  });

  return mapAdminEpisodeMedia(episode);
}

export async function updateAdminEpisodeStatus(
  adminUser: CurrentAdminUser,
  dramaId: string,
  episodeId: string,
  input: z.infer<typeof episodeStatusSchema>,
): Promise<AdminEpisodeMedia> {
  await assertDramaWritable(adminUser, dramaId);
  const data = episodeStatusSchema.parse(input);
  const result = await prisma.episode.updateMany({
    where: { id: episodeId, dramaId },
    data: {
      status: data.status,
      publishedAt: data.status === 'published' ? new Date() : null,
    },
  });

  if (result.count === 0) {
    throw createEpisodeAdminError('EPISODE_NOT_FOUND', '分集不存在', 404);
  }

  const episode = await prisma.episode.findFirstOrThrow({ where: { id: episodeId, dramaId } });
  return mapAdminEpisodeMedia(episode);
}

export async function deleteAdminEpisode(adminUser: CurrentAdminUser, dramaId: string, episodeId: string) {
  await assertDramaWritable(adminUser, dramaId);
  const result = await prisma.episode.deleteMany({ where: { id: episodeId, dramaId } });
  if (result.count === 0) {
    throw createEpisodeAdminError('EPISODE_NOT_FOUND', '分集不存在', 404);
  }
  return { success: true };
}

function createEpisodeAdminError(code: string, message: string, status: number) {
  const error = new Error(message) as Error & { code: string; status: number };
  error.code = code;
  error.status = status;
  return error;
}
