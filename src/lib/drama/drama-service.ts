import 'server-only';

import { query } from '@/lib/db/client';
import { signOssPath } from '@/lib/oss/oss-service';

interface PublishedDramaRow {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  synopsis: string | null;
  cover_path: string;
  poster_path: string | null;
  trailer_path: string | null;
  release_status: string;
  published_at: Date | string | null;
  sort_order: number;
  total_episodes: number;
}

interface DramaEpisodeRow {
  id: string;
  episode_no: number;
  title: string;
  summary: string | null;
  video_path: string;
  cover_path: string | null;
  duration_seconds: number;
  access_level: string;
  is_free: number | boolean;
  published_at: Date | string | null;
}

interface DramaGenreRow {
  genre_code: string;
  genre_name: string;
}

interface CastMemberRow {
  id: string;
  name: string;
  role_name: string | null;
  avatar_path: string | null;
  sort_order: number;
}

interface RecommendationRow {
  id: string;
  slug: string;
  title: string;
  cover_path: string;
  sort_order: number;
}

interface EpisodePlayRow {
  drama_id: string;
  episode_no: number;
  video_path: string;
  is_free: number | boolean;
}

interface UserVipRow {
  vip_expired_at: Date | string | null;
}

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
  genres: Array<{
    code: string;
    name: string;
  }>;
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

function toIsoString(value: Date | string | null) {
  return value ? new Date(value).toISOString() : null;
}

function mapPublishedDrama(row: PublishedDramaRow): PublishedDrama {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    synopsis: row.synopsis,
    coverPath: row.cover_path,
    posterPath: row.poster_path,
    trailerPath: row.trailer_path,
    releaseStatus: row.release_status,
    publishedAt: toIsoString(row.published_at),
    sortOrder: row.sort_order,
    totalEpisodes: row.total_episodes,
  };
}

function mapDramaEpisode(row: DramaEpisodeRow): DramaEpisode {
  return {
    id: row.id,
    episodeNo: row.episode_no,
    title: row.title,
    summary: row.summary,
    videoPath: row.video_path,
    coverPath: row.cover_path,
    durationSeconds: row.duration_seconds,
    accessLevel: row.access_level,
    isFree: Boolean(row.is_free),
    publishedAt: toIsoString(row.published_at),
  };
}

function isVipActive(vipExpiredAt: Date | string | null) {
  return vipExpiredAt ? new Date(vipExpiredAt).getTime() > Date.now() : false;
}

async function getPublishedDramaBase(dramaId: string) {
  const dramas = await query<PublishedDramaRow>(
    `SELECT
       d.id,
       d.slug,
       d.title,
       d.subtitle,
       d.synopsis,
       d.cover_path,
       d.poster_path,
       d.trailer_path,
       d.release_status,
       d.published_at,
       d.sort_order,
       (
         SELECT COUNT(*)
         FROM episodes e
         WHERE e.drama_id = d.id
           AND e.status = 'published'
       ) AS total_episodes
     FROM dramas d
     WHERE d.id = :dramaId
       AND d.status = 'published'
     LIMIT 1`,
    { dramaId },
  );

  return dramas[0] || null;
}

export async function getPublishedDramas(): Promise<PublishedDrama[]> {
  const rows = await query<PublishedDramaRow>(
    `SELECT
       d.id,
       d.slug,
       d.title,
       d.subtitle,
       d.synopsis,
       d.cover_path,
       d.poster_path,
       d.trailer_path,
       d.release_status,
       d.published_at,
       d.sort_order,
       (
         SELECT COUNT(*)
         FROM episodes e
         WHERE e.drama_id = d.id
           AND e.status = 'published'
       ) AS total_episodes
     FROM dramas d
     WHERE d.status = 'published'
     ORDER BY d.sort_order ASC, d.published_at DESC, d.created_at DESC`,
  );

  return rows.map(mapPublishedDrama);
}

export async function getDramaDetail(dramaId: string): Promise<DramaDetail> {
  const drama = await getPublishedDramaBase(dramaId);

  if (!drama) {
    throw createDramaError('DRAMA_NOT_FOUND');
  }

  const [genreRows, castRows, episodeRows, recommendationRows] = await Promise.all([
    query<DramaGenreRow>(
      `SELECT genre_code, genre_name
       FROM drama_genres
       WHERE drama_id = :dramaId
       ORDER BY genre_name ASC`,
      { dramaId },
    ),
    query<CastMemberRow>(
      `SELECT id, name, role_name, avatar_path, sort_order
       FROM cast_members
       WHERE drama_id = :dramaId
       ORDER BY sort_order ASC, created_at ASC`,
      { dramaId },
    ),
    query<DramaEpisodeRow>(
      `SELECT
         e.id,
         e.episode_no,
         e.title,
         e.summary,
         e.video_path,
         e.cover_path,
         e.duration_seconds,
         e.access_level,
         CASE WHEN e.access_level = 'free' THEN 1 ELSE 0 END AS is_free,
         e.published_at
       FROM episodes e
       WHERE e.drama_id = :dramaId
         AND e.status = 'published'
       ORDER BY e.episode_no ASC`,
      { dramaId },
    ),
    query<RecommendationRow>(
      `SELECT
         rd.id,
         rd.slug,
         rd.title,
         rd.cover_path,
         r.sort_order
       FROM recommendations r
       INNER JOIN dramas rd ON rd.id = r.drama_id
       WHERE r.drama_id <> :dramaId
         AND r.enabled = 1
         AND rd.status = 'published'
       ORDER BY r.sort_order ASC, rd.published_at DESC
       LIMIT 12`,
      { dramaId },
    ),
  ]);

  return {
    ...mapPublishedDrama(drama),
    genres: genreRows.map((row) => ({
      code: row.genre_code,
      name: row.genre_name,
    })),
    cast: castRows.map((row) => ({
      id: row.id,
      name: row.name,
      roleName: row.role_name,
      avatarPath: row.avatar_path,
      sortOrder: row.sort_order,
    })),
    episodes: episodeRows.map(mapDramaEpisode),
    recommendations: recommendationRows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      coverPath: row.cover_path,
      sortOrder: row.sort_order,
    })),
  };
}

export async function getEpisodePlayUrl(
  dramaId: string,
  episodeNo: number,
  userId: string | null,
): Promise<EpisodePlayUrlResult> {
  const rows = await query<EpisodePlayRow>(
    `SELECT
       e.drama_id,
       e.episode_no,
       e.video_path,
       CASE WHEN e.access_level = 'free' THEN 1 ELSE 0 END AS is_free
     FROM episodes e
     INNER JOIN dramas d ON d.id = e.drama_id
     WHERE e.drama_id = :dramaId
       AND e.episode_no = :episodeNo
       AND e.status = 'published'
       AND d.status = 'published'
     LIMIT 1`,
    { dramaId, episodeNo },
  );

  const episode = rows[0];

  if (!episode) {
    throw createDramaError('EPISODE_NOT_FOUND');
  }

  if (Boolean(episode.is_free)) {
    return {
      dramaId: episode.drama_id,
      episodeNo: episode.episode_no,
      playUrl: signOssPath(episode.video_path),
    };
  }

  if (!userId) {
    throw createDramaError('AUTH_REQUIRED');
  }

  const users = await query<UserVipRow>(
    `SELECT vip_expired_at
     FROM users
     WHERE id = :userId
     LIMIT 1`,
    { userId },
  );
  const user = users[0];

  if (!user || !isVipActive(user.vip_expired_at)) {
    throw createDramaError('VIP_REQUIRED');
  }

  return {
    dramaId: episode.drama_id,
    episodeNo: episode.episode_no,
    playUrl: signOssPath(episode.video_path),
  };
}
