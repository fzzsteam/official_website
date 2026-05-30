import React, { useRef, useState, useCallback, useEffect } from 'react';
import { tokens } from './tokens';

interface VideoPlayerProps {
  src?: string;
  poster?: string;
  isVip?: boolean;
  onBack?: () => void;
  backLabel?: string;
  isLoading?: boolean;
  errorMessage?: string;
  autoPlay?: boolean;
  onPlayStateChange?: (playing: boolean) => void;
  onEnded?: () => void;
}

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

// SVG Icon components
const PlayIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5,3 19,12 5,21" />
  </svg>
);
const PauseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
  </svg>
);
const Rewind10Icon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <text x="7.5" y="15" fontSize="7" fontFamily="sans-serif" fill="currentColor" stroke="none">10</text>
  </svg>
);
const Forward10Icon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <text x="7.5" y="15" fontSize="7" fontFamily="sans-serif" fill="currentColor" stroke="none">10</text>
  </svg>
);
const VolumeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
  </svg>
);
const MutedIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
  </svg>
);
const FullscreenIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
  </svg>
);
const ExitFullscreenIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
  </svg>
);
const BackArrowIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5" /><path d="M12 5l-7 7 7 7" />
  </svg>
);
const CrownSmIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
    <path d="M2 19h20v2H2v-2zm18-9l-6 4-2-7-2 7-6-4 2 11h12l2-11z" />
  </svg>
);

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  poster,
  isVip = true,
  onBack,
  backLabel = '返回首页',
  isLoading = false,
  errorMessage = '',
  autoPlay = false,
  onPlayStateChange,
  onEnded,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Use refs for callbacks and autoPlay to avoid stale closures in event listeners
  const autoPlayRef = useRef(autoPlay);
  const hasAutoPlayedRef = useRef(false);
  const onPlayStateChangeRef = useRef(onPlayStateChange);
  const onEndedRef = useRef(onEnded);
  useEffect(() => { autoPlayRef.current = autoPlay; }, [autoPlay]);
  useEffect(() => { onPlayStateChangeRef.current = onPlayStateChange; }, [onPlayStateChange]);
  useEffect(() => { onEndedRef.current = onEnded; }, [onEnded]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [videoAspect, setVideoAspect] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const progress = duration > 0 ? currentTime / duration : 0;

  const resetHideTimer = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setShowControls(true);
    hideTimer.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  useEffect(() => {
    resetHideTimer();
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, [resetHideTimer]);

  useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Reset state when src changes (episode switch)
  useEffect(() => {
    setIsPlaying(false);
    setIsVideoReady(false);
    setCurrentTime(0);
    setDuration(0);
    setPlaybackRate(1);
    setShowSpeedMenu(false);
    setVideoAspect(null);
    hasAutoPlayedRef.current = false;
  }, [src]);

  // Sync with real video element
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onDurationChange = () => setDuration(video.duration);
    const onPlay = () => {
      setIsPlaying(true);
      onPlayStateChangeRef.current?.(true);
    };
    const onPause = () => {
      setIsPlaying(false);
      onPlayStateChangeRef.current?.(false);
    };
    const onCanPlay = () => {
      setIsVideoReady(true);
      if (autoPlayRef.current && !hasAutoPlayedRef.current) {
        hasAutoPlayedRef.current = true;
        video.play().catch(() => {});
      }
    };
    const onLoadedMetadata = () => {
      if (video.videoWidth && video.videoHeight) {
        setVideoAspect(`${video.videoWidth}/${video.videoHeight}`);
      }
    };
    const onVideoEnded = () => {
      setIsPlaying(false);
      onPlayStateChangeRef.current?.(false);
      onEndedRef.current?.();
    };
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('durationchange', onDurationChange);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('ended', onVideoEnded);
    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('durationchange', onDurationChange);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('ended', onVideoEnded);
    };
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video || !isVideoReady) return;
    isPlaying ? video.pause() : video.play();
    resetHideTimer();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    const next = !video.muted;
    video.muted = next;
    setIsMuted(next);
    resetHideTimer();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    const video = videoRef.current;
    if (video) {
      video.volume = v;
      video.muted = v === 0;
    }
    setVolume(v);
    setIsMuted(v === 0);
    resetHideTimer();
  };

  const changeSpeed = (rate: number) => {
    const video = videoRef.current;
    if (video) video.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
    resetHideTimer();
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      container.requestFullscreen();
    }
    resetHideTimer();
  };

  const seek = (delta: number) => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = Math.max(0, Math.min(video.currentTime + delta, duration));
    } else {
      setCurrentTime((t) => Math.max(0, Math.min(t + delta, duration)));
    }
    resetHideTimer();
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const target = ratio * duration;
    if (videoRef.current) videoRef.current.currentTime = target;
    setCurrentTime(target);
    resetHideTimer();
  };

  const displayVolume = isMuted ? 0 : volume;

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-black"
      style={{ aspectRatio: isDesktop ? '16/9' : (videoAspect ?? '9/16') }}
      onMouseMove={resetHideTimer}
      onMouseLeave={() => setShowControls(false)}
    >
      <style>{`
        .fzzs-vol-slider { appearance: none; -webkit-appearance: none; outline: none; border: none; background: transparent; }
        .fzzs-vol-slider::-webkit-slider-runnable-track {
          height: 3px; border-radius: 2px;
        }
        .fzzs-vol-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 10px; height: 10px; border-radius: 50%;
          background: ${tokens.accentAmber};
          box-shadow: 0 0 5px rgba(201,145,42,0.7);
          cursor: pointer; margin-top: -3.5px;
        }
        .fzzs-vol-slider::-moz-range-track {
          height: 3px; border-radius: 2px;
          background: rgba(255,255,255,0.2);
        }
        .fzzs-vol-slider::-moz-range-thumb {
          width: 10px; height: 10px; border-radius: 50%; border: none;
          background: ${tokens.accentAmber};
          box-shadow: 0 0 5px rgba(201,145,42,0.7);
          cursor: pointer;
        }
      `}</style>
      {/* Back button */}
      <button
        onClick={onBack}
        className="absolute top-4 left-4 z-20 flex items-center gap-1.5"
        style={{
          background: 'rgba(0,0,0,0.4)', border: 'none',
          color: tokens.textMuted, cursor: 'pointer',
          fontFamily: tokens.fontBody, fontSize: 12,
          letterSpacing: '0.1em', padding: '7px 14px',
          borderRadius: 2, backdropFilter: 'blur(4px)',
        }}
      >
        <BackArrowIcon />
        <span className="hidden md:inline">{backLabel}</span>
      </button>

      {/* VIP upsell badge for non-members */}
      {!isVip && (
        <div style={{
          position: 'absolute', top: 16, right: 16, zIndex: 20,
          display: 'flex', alignItems: 'center', gap: 5,
          background: 'linear-gradient(135deg, rgba(30,20,5,0.82), rgba(60,40,10,0.82))',
          border: `1px solid rgba(201,145,42,0.5)`,
          backdropFilter: 'blur(6px)',
          color: tokens.accentGold,
          fontSize: 11, fontWeight: 500,
          padding: '6px 12px', borderRadius: 2,
          fontFamily: tokens.fontBody, letterSpacing: '0.06em',
        }}>
          <CrownSmIcon />
          开通会员 · 畅享全集
        </div>
      )}

      {/* Video element */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        style={{ width: '100%', height: '100%', objectFit: isDesktop ? 'contain' : 'cover', display: 'block' }}
        onClick={togglePlay}
      />

      {/* Poster overlay when no src */}
      {!src && poster && (
        <div
          style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${poster})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            cursor: 'pointer',
          }}
          onClick={togglePlay}
        />
      )}

      {/* Big center play button when paused and video is ready */}
      {!isPlaying && !isLoading && !errorMessage && isVideoReady && (
        <div
          onClick={togglePlay}
          style={{
            position: 'absolute', inset: 0, zIndex: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            background: 'rgba(0,0,0,0.18)',
          }}
        >
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: 'rgba(201,145,42,0.18)',
            border: `1.5px solid rgba(201,145,42,0.7)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: tokens.textPrimary, backdropFilter: 'blur(4px)',
          }}>
            <PlayIcon />
          </div>
        </div>
      )}

      {(() => {
        const isBuffering = !!src && !isVideoReady && !errorMessage;
        const showLoading = isLoading || isBuffering;
        if (!showLoading && !errorMessage) return null;
        return (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 9,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: showLoading
                ? 'rgba(0,0,0,0.55)'
                : 'linear-gradient(rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.55) 100%)',
              color: tokens.textPrimary,
              fontFamily: tokens.fontBody,
              fontSize: 14,
              letterSpacing: '0.08em',
              textShadow: '0 1px 8px rgba(0,0,0,0.8)',
            }}
          >
            {showLoading ? '剧集加载中...' : errorMessage}
          </div>
        );
      })()}

      {/* Bottom gradient + controls */}
      <div
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
          background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 60%, transparent 100%)',
          padding: '32px 18px 14px',
          opacity: (showControls && isVideoReady && !isLoading && !errorMessage) ? 1 : 0,
          transition: 'opacity 0.4s ease',
          pointerEvents: (showControls && isVideoReady && !isLoading && !errorMessage) ? 'auto' : 'none',
        }}
      >
        {/* Progress bar */}
        <div
          onClick={handleProgressClick}
          style={{
            width: '100%', height: 3, background: 'rgba(255,255,255,0.2)',
            borderRadius: 2, cursor: 'pointer', marginBottom: 10,
            position: 'relative',
          }}
        >
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: `${progress * 100}%`,
            background: `linear-gradient(90deg, ${tokens.accentGold}, ${tokens.accentAmber})`,
            borderRadius: 2,
          }} />
          {/* Scrubber dot */}
          <div style={{
            position: 'absolute', top: '50%', left: `${progress * 100}%`,
            transform: 'translate(-50%, -50%)',
            width: 12, height: 12, borderRadius: '50%',
            background: tokens.accentAmber,
            boxShadow: `0 0 6px rgba(201,145,42,0.6)`,
          }} />
        </div>

          {/* Controls row */}
          <div className="flex items-center justify-between">
            {/* Left controls */}
            <div className="flex items-center gap-2 md:gap-[14px]">
              <button onClick={togglePlay} className="p-3 md:p-1" style={ctrlBtnStyle}>
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
              </button>
              <button onClick={() => seek(-10)} className="p-3 md:p-1" style={ctrlBtnStyle} title="后退10秒">
                <Rewind10Icon />
              </button>
              <button onClick={() => seek(10)} className="p-3 md:p-1" style={ctrlBtnStyle} title="前进10秒">
                <Forward10Icon />
              </button>
              <div
                className="hidden md:flex items-center gap-1"
                style={{ position: 'relative' }}
                onMouseEnter={() => setShowVolumeSlider(true)}
                onMouseLeave={() => setShowVolumeSlider(false)}
              >
                <button onClick={toggleMute} style={ctrlBtnStyle} title={isMuted ? '取消静音' : '静音'}>
                  {isMuted || volume === 0 ? <MutedIcon /> : <VolumeIcon />}
                </button>
                <div style={{
                  width: showVolumeSlider ? 60 : 0,
                  overflow: 'hidden',
                  transition: 'width 0.2s ease',
                  display: 'flex', alignItems: 'center',
                }}>
                  <input
                    type="range" min={0} max={1} step={0.05}
                    value={displayVolume}
                    onChange={handleVolumeChange}
                    className="fzzs-vol-slider"
                    style={{
                      width: 60, cursor: 'pointer', flexShrink: 0,
                      background: `linear-gradient(to right, ${tokens.accentGold} ${displayVolume * 100}%, rgba(255,255,255,0.2) ${displayVolume * 100}%)`,
                    }}
                  />
                </div>
              </div>
              <span style={{
                fontFamily: tokens.fontBody, fontSize: 12, color: tokens.textMuted,
                letterSpacing: '0.04em', userSelect: 'none',
              }}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-2 md:gap-[8px]">
              {/* Speed selector */}
              <div className="hidden md:block" style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowSpeedMenu(s => !s)}
                  style={{
                    background: 'none',
                    border: '1px solid rgba(240,237,232,0.28)',
                    color: playbackRate !== 1 ? tokens.accentGold : tokens.textMuted,
                    cursor: 'pointer',
                    fontFamily: tokens.fontBody, fontSize: 11,
                    padding: '3px 9px', borderRadius: 2,
                    letterSpacing: '0.08em',
                  }}
                >
                  {playbackRate === 1 ? '倍速' : `${playbackRate}x`}
                </button>
                {showSpeedMenu && (
                  <div style={{
                    position: 'absolute', bottom: 'calc(100% + 8px)', right: 0,
                    background: 'rgba(18,13,8,0.96)',
                    border: '1px solid rgba(201,145,42,0.25)',
                    borderRadius: 4, overflow: 'hidden', minWidth: 72,
                  }}>
                    {[1, 1.5, 2].map(rate => (
                      <button
                        key={rate}
                        onClick={() => changeSpeed(rate)}
                        style={{
                          display: 'block', width: '100%',
                          background: playbackRate === rate ? 'rgba(201,145,42,0.15)' : 'none',
                          border: 'none',
                          color: playbackRate === rate ? tokens.accentGold : tokens.textMuted,
                          fontFamily: tokens.fontBody, fontSize: 13,
                          padding: '9px 16px', cursor: 'pointer',
                          letterSpacing: '0.06em', textAlign: 'center',
                        }}
                      >
                        {rate === 1 ? '1x' : `${rate}x`}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={toggleFullscreen} className="p-3 md:p-1" style={ctrlBtnStyle} title={isFullscreen ? '退出全屏' : '全屏'}>
                {isFullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
              </button>
            </div>
          </div>
      </div>
    </div>
  );
};

const ctrlBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none',
  color: 'rgba(240,237,232,0.8)',
  cursor: 'pointer', display: 'flex',
  alignItems: 'center', justifyContent: 'center',
  padding: 4, transition: 'color 0.2s ease',
};

export default VideoPlayer;
