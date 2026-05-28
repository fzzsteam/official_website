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
