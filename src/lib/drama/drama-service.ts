import 'server-only';

import { prisma } from '@/lib/db/prisma';
import { signOssPath } from '@/lib/oss/oss-service';

export interface PublishedDrama {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  synopsis: string | null;
  coverPath: string;
  posterPath: string | null;
  trailerPath: string | null;
  releaseStatus: string;
  publishedAt: string | null;
  sortOrder: number;
  totalEpisodes: number;
}

export interface DramaEpisode {
  id: string;
  episodeNo: number;
  title: string;
  summary: string | null;
  videoPath: string;
  coverPath: string | null;
  durationSeconds: number;
  accessLevel: string;
  isFree: boolean;
  publishedAt: string | null;
}

export interface DramaDetail extends PublishedDrama {
  genres: Array<{ code: string; name: string }>;
  cast: Array<{
    id: string;
    name: string;
    roleName: string | null;
    avatarPath: string | null;
    sortOrder: number;
  }>;
  episodes: DramaEpisode[];
  recommendations: Array<{
    id: string;
    slug: string;
    title: string;
    coverPath: string;
    sortOrder: number;
  }>;
}

export interface EpisodePlayUrlResult {
  dramaId: string;
  episodeNo: number;
  playUrl: string;
}

function createDramaError(code: string) {
  const error = new Error(code);
  error.name = code;
  return error;
}

function toIsoString(value: Date | null) {
  return value ? value.toISOString() : null;
}

function mapDramaEpisode(row: {
  id: string;
  episodeNo: number;
  title: string;
  summary: string | null;
  videoPath: string;
  coverPath: string | null;
  durationSeconds: number;
  accessLevel: string;
  publishedAt: Date | null;
}): DramaEpisode {
  return {
    id: row.id,
    episodeNo: row.episodeNo,
    title: row.title,
    summary: row.summary,
    videoPath: row.videoPath,
    coverPath: row.coverPath,
    durationSeconds: row.durationSeconds,
    accessLevel: row.accessLevel,
    isFree: row.accessLevel === 'free',
    publishedAt: toIsoString(row.publishedAt),
  };
}

function isVipActive(vipExpiredAt: Date | null) {
  return vipExpiredAt ? vipExpiredAt.getTime() > Date.now() : false;
}

export async function getPublishedDramas(): Promise<PublishedDrama[]> {
  const dramas = await prisma.drama.findMany({
    where: { status: 'published' },
    orderBy: [{ sortOrder: 'asc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
    include: {
      _count: {
        select: { episodes: { where: { status: 'published' } } },
      },
    },
  });

  return dramas.map((d) => ({
    id: d.id,
    slug: d.slug,
    title: d.title,
    subtitle: d.subtitle,
    synopsis: d.synopsis,
    coverPath: d.coverPath,
    posterPath: d.posterPath,
    trailerPath: d.trailerPath,
    releaseStatus: d.releaseStatus,
    publishedAt: toIsoString(d.publishedAt),
    sortOrder: d.sortOrder,
    totalEpisodes: d._count.episodes,
  }));
}

export async function getDramaDetail(dramaId: string): Promise<DramaDetail> {
  const drama = await prisma.drama.findFirst({
    where: { id: dramaId, status: 'published' },
    include: {
      _count: { select: { episodes: { where: { status: 'published' } } } },
    },
  });

  if (!drama) {
    throw createDramaError('DRAMA_NOT_FOUND');
  }

  const [genres, cast, episodes, recommendations] = await Promise.all([
    prisma.dramaGenre.findMany({
      where: { dramaId },
      orderBy: { genreName: 'asc' },
    }),
    prisma.castMember.findMany({
      where: { dramaId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    }),
    prisma.episode.findMany({
      where: { dramaId, status: 'published' },
      orderBy: { episodeNo: 'asc' },
    }),
    prisma.recommendation.findMany({
      where: {
        dramaId: { not: dramaId },
        enabled: true,
        drama: { status: 'published' },
      },
      orderBy: [{ sortOrder: 'asc' }, { drama: { publishedAt: 'desc' } }],
      take: 12,
      include: { drama: true },
    }),
  ]);

  return {
    id: drama.id,
    slug: drama.slug,
    title: drama.title,
    subtitle: drama.subtitle,
    synopsis: drama.synopsis,
    coverPath: drama.coverPath,
    posterPath: drama.posterPath,
    trailerPath: drama.trailerPath,
    releaseStatus: drama.releaseStatus,
    publishedAt: toIsoString(drama.publishedAt),
    sortOrder: drama.sortOrder,
    totalEpisodes: drama._count.episodes,
    genres: genres.map((g) => ({ code: g.genreCode, name: g.genreName })),
    cast: cast.map((c) => ({
      id: c.id,
      name: c.name,
      roleName: c.roleName,
      avatarPath: c.avatarPath,
      sortOrder: c.sortOrder,
    })),
    episodes: episodes.map(mapDramaEpisode),
    recommendations: recommendations.map((r) => ({
      id: r.drama.id,
      slug: r.drama.slug,
      title: r.drama.title,
      coverPath: r.drama.coverPath,
      sortOrder: r.sortOrder,
    })),
  };
}

export async function getEpisodePlayUrl(
  dramaId: string,
  episodeNo: number,
  userId: string | null,
): Promise<EpisodePlayUrlResult> {
  const episode = await prisma.episode.findFirst({
    where: {
      dramaId,
      episodeNo,
      status: 'published',
      drama: { status: 'published' },
    },
  });

  if (!episode) {
    throw createDramaError('EPISODE_NOT_FOUND');
  }

  if (episode.accessLevel === 'free') {
    return {
      dramaId: episode.dramaId,
      episodeNo: episode.episodeNo,
      playUrl: signOssPath(episode.videoPath),
    };
  }

  if (!userId) {
    throw createDramaError('AUTH_REQUIRED');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { vipExpiredAt: true },
  });

  if (!user || !isVipActive(user.vipExpiredAt)) {
    throw createDramaError('VIP_REQUIRED');
  }

  return {
    dramaId: episode.dramaId,
    episodeNo: episode.episodeNo,
    playUrl: signOssPath(episode.videoPath),
  };
}
