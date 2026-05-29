import React, { useState, useEffect } from 'react';
import { tokens } from './tokens';
import Navbar from './Navbar';
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
  const { navigateTo, openModal } = useApp();
  const handleBack = onBack ?? (() => navigateTo('home'));

  useEffect(() => {
    let cancelled = false;

    const loadPlayUrl = async () => {
      setPlayLoading(true);
      setPlayError('');
      try {
        const data = await apiGet<{ url: string }>(
          `/api/dramas/${encodeURIComponent(drama.id)}/episodes/${currentEpisode}/play-url`,
        );
        if (!cancelled) {
          setCurrentVideoSrc(data.url);
        }
      } catch (requestError) {
        if (cancelled) {
          return;
        }

        setCurrentVideoSrc(undefined);
        setPlayError(requestError instanceof Error ? requestError.message : '播放地址获取失败');
        const apiError = requestError as ApiError;
        if (apiError.code === 'AUTH_REQUIRED') {
          openModal('login');
        } else if (apiError.code === 'VIP_REQUIRED') {
          openModal('vip');
        }
      } finally {
        if (!cancelled) {
          setPlayLoading(false);
        }
      }
    };

    void loadPlayUrl();

    return () => {
      cancelled = true;
    };
  }, [currentEpisode, drama.id, openModal]);

  return (
    <div style={{
      minHeight: '100vh',
      background: `
        linear-gradient(180deg, rgba(46, 35, 28, 0.18), rgba(24, 18, 15, 0.28)),
        linear-gradient(135deg, #3b3028 0%, #4a3a2f 20%, #5b4738 46%, #3e3127 72%, #241d19 100%)
      `,
      color: tokens.textPrimary,
      fontFamily: tokens.fontBody,
      position: 'relative',
    }}>
      {/* Texture overlay */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: `
          radial-gradient(circle at top center, rgba(255,247,231,0.07) 0%, rgba(255,247,231,0.02) 24%, transparent 52%),
          repeating-linear-gradient(90deg, rgba(255,250,239,0.016) 0, rgba(255,250,239,0.016) 1px, transparent 1px, transparent 5px),
          repeating-linear-gradient(180deg, rgba(71,54,42,0.04) 0, rgba(71,54,42,0.04) 2px, transparent 2px, transparent 9px)
        `,
      }} />

      <Navbar />

      {/* Main layout: content + sidebar */}
      <div style={{
        display: 'flex',
        paddingTop: 62, // navbar height
        position: 'relative', zIndex: 1,
        minHeight: '100vh',
      }}>
        {/* Left: video + info + cast + recommendations */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>

          {/* Video player */}
          <VideoPlayer
            src={currentVideoSrc}
            poster={videoPoster}
            isVip={drama.isVip}
            onBack={handleBack}
            backLabel="返回详情页"
            isLoading={playLoading}
            errorMessage={playError}
          />

          {/* Info row: episode info + cast */}
          <div style={{
            display: 'flex', alignItems: 'flex-start',
            padding: '20px 20px 0',
            gap: 32,
            borderBottom: '1px solid rgba(240,237,232,0.07)',
          }}>
            <EpisodeInfo
              drama={drama}
              currentEpisode={currentEpisode}
            />
            <CastSection cast={cast} />
          </div>

          {/* Recommendations */}
          <Recommendations
            items={recommendations}
            onSelect={(id) => console.log('Navigate to drama:', id)}
          />
        </div>

        {/* Right sidebar: episode selector */}
        <EpisodeSelector
          drama={drama}
          currentEpisode={currentEpisode}
          onSelectEpisode={setCurrentEpisode}
        />
      </div>
    </div>
  );
};

export default EpisodeDetailPage;
