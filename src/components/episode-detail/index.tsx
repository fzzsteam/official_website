import React, { useState, useEffect, useRef, useCallback } from 'react';
import { tokens } from './tokens';
import Footer from '../Footer';
import VideoPlayer from './VideoPlayer';
import EpisodeInfo from './EpisodeInfo';
import CastSection from './CastSection';
import EpisodeSelector from './EpisodeSelector';
import Recommendations from './Recommendations';
import type { Drama, CastMember, RecommendedDrama } from '../../types/drama';
import { useApp } from '../../context/AppContext';
import { apiGet, type ApiError } from '../../lib/api/client';

interface EpisodeDetailPageProps {
  drama: Drama;
  cast: CastMember[];
  recommendations: RecommendedDrama[];
  initialEpisode?: number;
  videoSrc?: string;
  videoPoster?: string;
  onBack?: () => void;
}

const EpisodeDetailPage: React.FC<EpisodeDetailPageProps> = ({
  drama,
  cast,
  recommendations,
  initialEpisode = 1,
  videoSrc,
  videoPoster,
  onBack,
}) => {
  const [currentEpisode, setCurrentEpisode] = useState(initialEpisode);
  const [currentVideoSrc, setCurrentVideoSrc] = useState(videoSrc);
  const [playLoading, setPlayLoading] = useState(false);
  const [playError, setPlayError] = useState('');
  const [autoPlay, setAutoPlay] = useState(false);
  const isPlayingRef = useRef(false);
  const currentEpisodeRef = useRef(currentEpisode);
  useEffect(() => { currentEpisodeRef.current = currentEpisode; }, [currentEpisode]);

  const { user, navigateTo, openModal } = useApp();
  const handleBack = onBack ?? (() => navigateTo('home'));

  const handleSelectEpisode = (episode: number) => {
    if (!user) { openModal('login'); return; }
    if (!user.isVip) { openModal('vip'); return; }
    setAutoPlay(isPlayingRef.current);
    setCurrentEpisode(episode);
  };

  const handlePlayStateChange = useCallback((playing: boolean) => {
    isPlayingRef.current = playing;
  }, []);

  const handleEnded = useCallback(() => {
    const ep = currentEpisodeRef.current;
    if (ep < drama.totalEpisodes) {
      setAutoPlay(true);
      setCurrentEpisode(ep + 1);
    }
  }, [drama.totalEpisodes]);

  useEffect(() => {
    let cancelled = false;
    const loadPlayUrl = async () => {
      setPlayLoading(true);
      setPlayError('');
      try {
        const data = await apiGet<{ playUrl: string }>(
          `/api/dramas/${encodeURIComponent(drama.id)}/episodes/${currentEpisode}/play-url`,
        );
        if (!cancelled) setCurrentVideoSrc(data.playUrl);
      } catch (requestError) {
        if (cancelled) return;
        setCurrentVideoSrc(undefined);
        const apiError = requestError as ApiError;
        if (apiError.code !== 'AUTH_REQUIRED' && apiError.code !== 'VIP_REQUIRED') {
          setPlayError(requestError instanceof Error ? requestError.message : '播放地址获取失败');
        }
      } finally {
        if (!cancelled) setPlayLoading(false);
      }
    };
    void loadPlayUrl();
    return () => { cancelled = true; };
  }, [currentEpisode, drama.id, openModal]);

  return (
    <div
      className="min-h-screen relative"
      style={{
        background: `
          linear-gradient(180deg, rgba(46, 35, 28, 0.18), rgba(24, 18, 15, 0.28)),
          linear-gradient(135deg, #3b3028 0%, #4a3a2f 20%, #5b4738 46%, #3e3127 72%, #241d19 100%)
        `,
        color: tokens.textPrimary,
        fontFamily: tokens.fontBody,
      }}
    >
      {/* Texture overlay */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        background: `
          radial-gradient(circle at top center, rgba(255,247,231,0.07) 0%, rgba(255,247,231,0.02) 24%, transparent 52%),
          repeating-linear-gradient(90deg, rgba(255,250,239,0.016) 0, rgba(255,250,239,0.016) 1px, transparent 1px, transparent 5px),
          repeating-linear-gradient(180deg, rgba(71,54,42,0.04) 0, rgba(71,54,42,0.04) 2px, transparent 2px, transparent 9px)
        `,
      }} />

      {/* Main layout: flex-col on mobile, flex-row on desktop */}
      <div className="flex flex-col lg:flex-row pt-[62px] relative z-[1] min-h-screen">

        {/* Left column */}
        <div className="flex-1 min-w-0 flex flex-col">

          {/* Video — full-width on mobile, full-width of left column on desktop */}
          <div className="w-full">
            <VideoPlayer
              src={currentVideoSrc}
              poster={videoPoster ?? drama.posterUrl}
              isVip={drama.isVip}
              onBack={handleBack}
              backLabel="返回首页"
              isLoading={playLoading}
              errorMessage={playError}
              autoPlay={autoPlay}
              onPlayStateChange={handlePlayStateChange}
              onEnded={handleEnded}
            />
          </div>

          {/* Info: EpisodeInfo → CastSection stacked vertically */}
          <div
            className="flex flex-col px-4 md:px-5"
            style={{ borderBottom: '1px solid rgba(240,237,232,0.07)' }}
          >
            <EpisodeInfo drama={drama} currentEpisode={currentEpisode} />
            <div className="pt-4 pb-5" style={{ borderTop: '1px solid rgba(240,237,232,0.07)' }}>
              <CastSection cast={cast} />
            </div>
          </div>

          {/* EpisodeSelector inline — mobile only */}
          <div className="lg:hidden">
            <EpisodeSelector
              drama={drama}
              currentEpisode={currentEpisode}
              onSelectEpisode={handleSelectEpisode}
              variant="inline"
            />
          </div>

          <Recommendations
            items={recommendations}
            onSelect={(id) => {
              const rec = recommendations.find(r => r.id === id);
              navigateTo('episode-detail', {
                id,
                title: rec?.title ?? '',
                coverUrl: rec?.coverUrl ?? '',
                totalEpisodes: 0,
                episodeDuration: 0,
                year: new Date().getFullYear(),
                genres: [],
                description: '',
                isVip: false,
              });
            }}
          />
        </div>

        {/* Right sidebar — desktop only */}
        <div className="hidden lg:flex">
          <EpisodeSelector
            drama={drama}
            currentEpisode={currentEpisode}
            onSelectEpisode={handleSelectEpisode}
            variant="sidebar"
          />
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default EpisodeDetailPage;
