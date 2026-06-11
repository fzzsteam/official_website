import 'server-only';

import { signOssPath } from '@/lib/oss/oss-service';

export function signAdminMediaPath(path: string | null | undefined) {
  if (!path) {
    return null;
  }

  return signOssPath(path);
}

export function mapAdminDramaMedia<
  T extends {
    coverPath: string;
    posterPath: string | null;
  },
>(drama: T) {
  return {
    ...drama,
    coverUrl: signAdminMediaPath(drama.coverPath),
    posterUrl: signAdminMediaPath(drama.posterPath),
  };
}

export function mapAdminEpisodeMedia<
  T extends {
    videoPath: string;
    coverPath: string | null;
  },
>(episode: T) {
  return {
    ...episode,
    videoPreviewUrl: signAdminMediaPath(episode.videoPath),
    videoUrl: signAdminMediaPath(episode.videoPath),
    coverUrl: signAdminMediaPath(episode.coverPath),
  };
}

export function mapAdminOrganizationMedia<
  T extends {
    businessLicensePath: string;
  },
>(organization: T) {
  return {
    ...organization,
    businessLicenseUrl: signAdminMediaPath(organization.businessLicensePath),
  };
}
