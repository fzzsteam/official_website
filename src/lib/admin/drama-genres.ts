import 'server-only';

import type { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';

export const DRAMA_GENRES = [
  { code: 'urban', name: '都市' },
  { code: 'romance', name: '爱情' },
  { code: 'suspense', name: '悬疑' },
  { code: 'costume', name: '古装' },
  { code: 'comedy', name: '喜剧' },
  { code: 'xianxia', name: '仙侠' },
  { code: 'war', name: '战争' },
  { code: 'thriller', name: '惊悚' },
] as const;

const GENRE_BY_CODE = new Map(DRAMA_GENRES.map((genre) => [genre.code, genre]));

export type DramaGenreCode = (typeof DRAMA_GENRES)[number]['code'];

export function validateDramaGenreCodes(codes: string[]) {
  return codes.map((code) => {
    const genre = GENRE_BY_CODE.get(code as DramaGenreCode);

    if (!genre) {
      const error = new Error('分类不存在') as Error & { code: string; status: number };
      error.code = 'INVALID_DRAMA_GENRE';
      error.status = 400;
      throw error;
    }

    return genre;
  });
}

export async function replaceDramaGenres(
  tx: Pick<PrismaClient, 'dramaGenre'>,
  dramaId: string,
  codes: string[],
) {
  const genres = validateDramaGenreCodes(codes);

  await tx.dramaGenre.deleteMany({ where: { dramaId } });

  if (genres.length === 0) {
    return;
  }

  await tx.dramaGenre.createMany({
    data: genres.map((genre) => ({
      id: randomUUID(),
      dramaId,
      genreCode: genre.code,
      genreName: genre.name,
    })),
  });
}
