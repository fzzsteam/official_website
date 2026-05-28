import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { tokens } from './episode-detail/tokens';

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const ShieldIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const WechatIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="#07C160">
    <path d="M8.7 10.3c-.4 0-.7-.3-.7-.7s.3-.7.7-.7.7.3.7.7-.3.7-.7.7zm3.6 0c-.4 0-.7-.3-.7-.7s.3-.7.7-.7.7.3.7.7-.3.7-.7.7zM3 10.4C3 7.4 6.1 5 10 5s7 2.4 7 5.4-3.1 5.4-7 5.4c-.6 0-1.2-.1-1.8-.2L5.5 17l.8-2.3C4.1 13.7 3 12.1 3 10.4zm11.3 3.4c-.3 0-.6-.3-.6-.6s.3-.6.6-.6.6.3.6.6-.3.6-.6.6zm2.9 0c-.3 0-.6-.3-.6-.6s.3-.6.6-.6.6.3.6.6-.3.6-.6.6zm.8-5.5c-.2 0-.4 0-.6.1-.1-3.4-3.4-6.1-7.4-6.1-4.1 0-7.5 2.8-7.5 6.3 0 1.9 1 3.6 2.6 4.8L4.4 15l2.7-1.4c.9.3 1.9.5 2.9.5h.3C10 14.4 10 14.8 10 15.2c0 2.6 2.4 4.8 5.3 4.8.7 0 1.4-.1 2-.4l2.3 1.1-.8-2c1.3-.9 2.2-2.3 2.2-3.8 0-2.4-2.1-4.6-4.9-4.6z"/>
  </svg>
);

// Simple SVG QR code placeholder
const QRCode: React.FC = () => (
  <div style={{
    width: 160, height: 160,
    background: '#fff',
    borderRadius: 6,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    position: 'relative', overflow: 'hidden',
    padding: 10,
  }}>
    <svg viewBox="0 0 100 100" width="140" height="140">
      {/* QR code visual placeholder pattern */}
      <rect x="0" y="0" width="100" height="100" fill="white"/>
      {/* Top-left finder */}
      <rect x="5" y="5" width="25" height="25" fill="#000" rx="2"/>
      <rect x="8" y="8" width="19" height="19" fill="#fff" rx="1"/>
      <rect x="11" y="11" width="13" height="13" fill="#000" rx="1"/>
      {/* Top-right finder */}
      <rect x="70" y="5" width="25" height="25" fill="#000" rx="2"/>
      <rect x="73" y="8" width="19" height="19" fill="#fff" rx="1"/>
      <rect x="76" y="11" width="13" height="13" fill="#000" rx="1"/>
      {/* Bottom-left finder */}
      <rect x="5" y="70" width="25" height="25" fill="#000" rx="2"/>
      <rect x="8" y="73" width="19" height="19" fill="#fff" rx="1"/>
      <rect x="11" y="76" width="13" height="13" fill="#000" rx="1"/>
      {/* Data modules (simulated pattern) */}
      {[38,40,42,44,46,48,50,52,54,56,58,60,62,64].map((x) =>
        [38,40,42,44,46,48,50,52,54,56,58,60,62,64].map((y) =>
          (x + y) % 6 === 0 ? (
            <rect key={`${x}-${y}`} x={x} y={y} width="2" height="2" fill="#000" />
          ) : null
        )
      )}
      {[5,7,9,11,13,15,17,19,21,23,25,27,29,31,33,35].map((x) =>
        [38,40,42,44,46,48,50,52,54,56,58,60,62,64,66,68].map((y) =>
          (x * y) % 7 === 1 ? (
            <rect key={`${x}-${y}`} x={x} y={y} width="2" height="2" fill="#000" />
          ) : null
        )
      )}
      {[38,40,42,44,46,48,50,52,54,56,58,60,62,64,66,68].map((x) =>
        [5,7,9,11,13,15,17,19,21,23,25,27,29,31,33,35].map((y) =>
          (x + y * 2) % 5 === 0 ? (
            <rect key={`${x}-${y}`} x={x} y={y} width="2" height="2" fill="#000" />
          ) : null
        )
      )}
      {/* Wechat icon overlay */}
      <rect x="41" y="41" width="18" height="18" rx="3" fill="#07C160"/>
      <text x="50" y="53" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">W</text>
    </svg>
  </div>
);

const PaymentModal: React.FC = () => {
  const { closeModal, selectedPlan, upgradeToVip } = useApp();
  const [timeLeft, setTimeLeft] = useState(582); // 9:42

  useEffect(() => {
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 0) { clearInterval(id); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  if (!selectedPlan) return null;

  return (
    <Overlay onClick={closeModal}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 360, borderRadius: 12,
          background: 'linear-gradient(180deg, #272018 0%, #1c1610 100%)',
          border: '1px solid rgba(201,145,42,0.2)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
          padding: '28px 28px 24px',
          position: 'relative',
        }}
      >
        {/* Close */}
        <button onClick={closeModal} style={closeBtnStyle}><CloseIcon /></button>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 }}>
            <WechatIcon />
            <span style={{
              fontFamily: tokens.fontDisplay, fontSize: 18,
              color: tokens.textPrimary, letterSpacing: '0.1em',
            }}>
              微信扫码支付
            </span>
          </div>
          <p style={{
            fontFamily: tokens.fontBody, fontSize: 12,
            color: tokens.textMuted, letterSpacing: '0.06em', margin: 0,
          }}>
            请使用微信扫一扫完成支付
          </p>
        </div>

        {/* QR Code */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <QRCode />
        </div>

        {/* Plan info */}
        <div style={{
          background: 'rgba(201,145,42,0.08)',
          border: '1px solid rgba(201,145,42,0.2)',
          borderRadius: 6, padding: '14px 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 16,
        }}>
          <div>
            <div style={{
              fontFamily: tokens.fontDisplay, fontSize: 15,
              color: tokens.textPrimary, letterSpacing: '0.08em', marginBottom: 3,
            }}>
              {selectedPlan.name}
            </div>
            <div style={{
              fontFamily: tokens.fontBody, fontSize: 11,
              color: tokens.textMuted, letterSpacing: '0.04em',
            }}>
              畅享全站短剧
            </div>
          </div>
          <div style={{
            fontFamily: tokens.fontCormorant, fontSize: 26, fontWeight: 600,
            color: tokens.accentAmber,
          }}>
            ¥{selectedPlan.price.toFixed(2)}
          </div>
        </div>

        {/* Countdown */}
        <div style={{
          textAlign: 'center', marginBottom: 14,
          fontFamily: tokens.fontBody, fontSize: 12, color: tokens.textMuted,
          letterSpacing: '0.04em',
        }}>
          请在{' '}
          <span style={{ color: tokens.accentGold, fontWeight: 500, fontFamily: tokens.fontCormorant, fontSize: 15 }}>
            {formatTime(timeLeft)}
          </span>
          {' '}内完成支付
        </div>

        {/* Footer note */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          fontFamily: tokens.fontBody, fontSize: 11, color: tokens.textMuted,
          letterSpacing: '0.04em',
        }}>
          <ShieldIcon /> 支付完成后自动开通会员
        </div>

        {/* Demo: simulate payment */}
        <button
          onClick={upgradeToVip}
          style={{
            width: '100%', marginTop: 16,
            padding: '10px 0',
            background: 'rgba(7,193,96,0.15)',
            border: '1px solid rgba(7,193,96,0.4)',
            borderRadius: 4, cursor: 'pointer',
            fontFamily: tokens.fontBody, fontSize: 12,
            color: '#07C160', letterSpacing: '0.08em',
            transition: 'all 0.2s ease',
          }}
        >
          模拟支付成功（演示用）
        </button>
      </div>
    </Overlay>
  );
};

const Overlay: React.FC<{ children: React.ReactNode; onClick: () => void }> = ({ children, onClick }) => (
  <div
    onClick={onClick}
    style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(10,8,5,0.75)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}
  >
    {children}
  </div>
);

const closeBtnStyle: React.CSSProperties = {
  position: 'absolute', top: 14, right: 14,
  background: 'none', border: 'none',
  color: tokens.textMuted, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: 4,
};

export default PaymentModal;
