import React, { useRef, useState, useCallback, useEffect } from 'react';
import { tokens } from './tokens';

interface VideoPlayerProps {
  src?: string;
  poster?: string;
  isVip?: boolean;
  onBack?: () => void;
  backLabel?: string;
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
const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);
const FullscreenIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
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
  backLabel = '返回详情页',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(1112); // 18:32 demo
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

  // Simulate playback progress (demo only – real impl uses video element events)
  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      setCurrentTime((t) => {
        if (t >= duration) { setIsPlaying(false); return duration; }
        return t + 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isPlaying, duration]);

  // Sync with real video element if src provided
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onDurationChange = () => setDuration(video.duration);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('durationchange', onDurationChange);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('durationchange', onDurationChange);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (video) {
      isPlaying ? video.pause() : video.play();
    } else {
      setIsPlaying((p) => !p);
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

  // Demo: start with some progress shown
  useEffect(() => { setCurrentTime(765); }, []); // 12:45

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', width: '100%', background: '#000', aspectRatio: '16/9' }}
      onMouseMove={resetHideTimer}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          position: 'absolute', top: 16, left: 16, zIndex: 20,
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(0,0,0,0.4)', border: 'none',
          color: tokens.textMuted, cursor: 'pointer',
          fontFamily: tokens.fontBody, fontSize: 12,
          letterSpacing: '0.1em', padding: '7px 14px',
          borderRadius: 2, backdropFilter: 'blur(4px)',
          transition: 'color 0.3s ease',
        }}
      >
        <BackArrowIcon />
        {backLabel}
      </button>

      {/* VIP badge */}
      {isVip && (
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
          尊享会员 · 全集免费看
        </div>
      )}

      {/* Video element */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
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

      {/* Big center play button when paused */}
      {!isPlaying && (
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

      {/* Bottom gradient + controls */}
      <div
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
          background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 60%, transparent 100%)',
          padding: '32px 18px 14px',
          opacity: showControls ? 1 : 0,
          transition: 'opacity 0.4s ease',
          pointerEvents: showControls ? 'auto' : 'none',
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Left controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button onClick={togglePlay} style={ctrlBtnStyle}>
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>
            <button onClick={() => seek(-10)} style={ctrlBtnStyle} title="后退10秒">
              <Rewind10Icon />
            </button>
            <button onClick={() => seek(10)} style={ctrlBtnStyle} title="前进10秒">
              <Forward10Icon />
            </button>
            <button style={ctrlBtnStyle} title="音量">
              <VolumeIcon />
            </button>
            <span style={{
              fontFamily: tokens.fontBody, fontSize: 12, color: tokens.textMuted,
              letterSpacing: '0.04em', userSelect: 'none',
            }}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Right controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {['倍速', '高清'].map((label) => (
              <button key={label} style={{
                background: 'none', border: `1px solid rgba(240,237,232,0.28)`,
                color: tokens.textMuted, cursor: 'pointer',
                fontFamily: tokens.fontBody, fontSize: 11,
                padding: '3px 9px', borderRadius: 2,
                letterSpacing: '0.08em',
                transition: 'border-color 0.2s ease, color 0.2s ease',
              }}>
                {label}
              </button>
            ))}
            <button style={ctrlBtnStyle} title="设置"><SettingsIcon /></button>
            <button style={ctrlBtnStyle} title="全屏"><FullscreenIcon /></button>
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
