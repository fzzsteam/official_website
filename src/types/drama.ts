export interface Drama {
  id: string;
  title: string;
  titleEn?: string;
  totalEpisodes: number;
  episodeDuration: number; // minutes
  year: number;
  genres: string[];
  description: string;
  coverUrl: string;
  posterUrl?: string;
  isVip: boolean;
}

export interface Episode {
  number: number;
  title?: string;
  duration: number; // seconds
  isPlaying?: boolean;
  isWatched?: boolean;
  progress?: number; // 0-1
}

export interface CastMember {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
  characterRole: string; // e.g. "领衔主演"
}

export interface RecommendedDrama {
  id: string;
  title: string;
  coverUrl: string;
}

// API response types — what the server returns to client components
export interface ApiDrama {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  synopsis: string | null;
  coverUrl: string;
  posterUrl: string | null;
  releaseStatus: string;
  sortOrder: number;
  totalEpisodes: number;
  genreNames: string[];
}

export interface ApiDramaDetail extends ApiDrama {
  cast: Array<{
    id: string;
    name: string;
    roleName: string | null;
    avatarUrl: string | null;
  }>;
  recommendations: Array<{
    id: string;
    title: string;
    coverUrl: string;
  }>;
}
