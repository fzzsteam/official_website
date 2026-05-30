import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { tokens } from './episode-detail/tokens';
import { apiPost } from '../lib/api/client';

const PhoneIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
    <line x1="12" y1="18" x2="12.01" y2="18" />
  </svg>
);
const ShieldIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const LoginModal: React.FC = () => {
  const { closeModal, login } = useApp();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, []);

  const sendCode = async () => {
    if (!/^1\d{10}$/.test(phone)) { setError('请输入正确的手机号'); return; }
    setError('');
    setSendingCode(true);
    try {
      await apiPost<{ sent: boolean; expiresAt: string }>('/api/auth/send-code', { phone });
      setCountdown(60);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      timerRef.current = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '验证码发送失败');
    } finally {
      setSendingCode(false);
    }
  };

  const handleSubmit = async () => {
    if (!agreed) { setError('请先阅读并同意用户协议'); return; }
    if (!/^1\d{10}$/.test(phone)) { setError('请输入正确的手机号'); return; }
    if (code.length < 4) { setError('请输入短信验证码'); return; }
    setError('');
    setSubmitting(true);
    try {
      const data = await apiPost<{
        user: {
          id: string;
          phone: string;
          isVip: boolean;
          vipExpiredAt: string | null;
        };
      }>('/api/auth/login', { phone, code });
      login(data.user);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '登录失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Overlay onClick={closeModal}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[420px] mx-4 md:mx-0 px-5 sm:px-10"
        style={{
          borderRadius: 8,
          background: 'linear-gradient(180deg, #2a2118 0%, #1e1811 100%)',
          border: '1px solid rgba(201,145,42,0.2)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
          paddingTop: 36,
          paddingBottom: 32,
          position: 'relative',
        }}
      >
        {/* Close */}
        <button onClick={closeModal} style={closeBtnStyle}><CloseIcon /></button>

        {/* Title */}
        <h2 style={{
          fontFamily: tokens.fontDisplay,
          fontSize: 22, fontWeight: 400, textAlign: 'center',
          color: tokens.textPrimary, letterSpacing: '0.1em',
          margin: '0 0 28px',
        }}>
          短信登录
        </h2>

        {/* Phone input */}
        <div style={inputWrapStyle}>
          <span style={inputIconStyle}><PhoneIcon /></span>
          <input
            type="tel" maxLength={11}
            placeholder="请输入手机号"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setError(''); }}
            style={inputStyle}
          />
        </div>

        {/* Code input + send button */}
        <div style={{ ...inputWrapStyle, marginTop: 12 }}>
          <span style={inputIconStyle}><ShieldIcon /></span>
          <input
            type="text" maxLength={6}
            placeholder="请输入短信验证码"
            value={code}
            onChange={(e) => { setCode(e.target.value); setError(''); }}
            style={{ ...inputStyle, flex: 1 }}
          />
          <button
            onClick={sendCode}
            disabled={countdown > 0 || sendingCode}
            style={{
              background: 'none',
              border: 'none',
              color: countdown > 0 || sendingCode ? tokens.textMuted : tokens.accentGold,
              cursor: countdown > 0 || sendingCode ? 'not-allowed' : 'pointer',
              fontFamily: tokens.fontBody, fontSize: 13,
              letterSpacing: '0.04em', flexShrink: 0,
              padding: '0 0 0 10px',
              borderLeft: '1px solid rgba(240,237,232,0.1)',
              whiteSpace: 'nowrap',
              transition: 'color 0.3s ease',
            }}
          >
            {sendingCode ? '发送中...' : countdown > 0 ? `${countdown}s后重发` : '获取验证码'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <p style={{ color: '#c0392b', fontFamily: tokens.fontBody, fontSize: 12, marginTop: 8, letterSpacing: '0.04em' }}>
            {error}
          </p>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            width: '100%', marginTop: 24,
            background: 'linear-gradient(135deg, #C9912A, #d8a24d)',
            border: 'none', borderRadius: 4,
            color: '#1a0f00', cursor: submitting ? 'not-allowed' : 'pointer',
            fontFamily: tokens.fontDisplay,
            fontSize: 16, fontWeight: 400,
            letterSpacing: '0.2em', padding: '14px 0',
            transition: 'opacity 0.2s ease',
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? '登录中...' : '登录 / 注册'}
        </button>

        {/* Agreement */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          marginTop: 18, cursor: 'pointer',
        }}
          onClick={() => setAgreed((a) => !a)}
        >
          <div style={{
            width: 16, height: 16, borderRadius: '50%',
            border: `1px solid ${agreed ? tokens.accentGold : 'rgba(240,237,232,0.3)'}`,
            background: agreed ? 'rgba(201,145,42,0.2)' : 'transparent',
            flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}>
            {agreed && (
              <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                <polyline points="2,6 5,9 10,3" stroke={tokens.accentGold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <span style={{ fontFamily: tokens.fontBody, fontSize: 11, color: tokens.textMuted, letterSpacing: '0.04em' }}>
            我已阅读并同意
            <span style={{ color: tokens.accentGold }}>《用户协议》</span>
            和
            <span style={{ color: tokens.accentGold }}>《隐私政策》</span>
          </span>
        </div>
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

const inputWrapStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10,
  background: 'rgba(240,237,232,0.06)',
  border: '1px solid rgba(240,237,232,0.12)',
  borderRadius: 4, padding: '0 14px',
};

const inputIconStyle: React.CSSProperties = {
  color: 'rgba(240,237,232,0.35)', display: 'flex', alignItems: 'center', flexShrink: 0,
};

const inputStyle: React.CSSProperties = {
  flex: 1, background: 'none', border: 'none', outline: 'none',
  color: tokens.textPrimary, fontFamily: tokens.fontBody, fontSize: 14,
  letterSpacing: '0.06em', padding: '14px 0',
};

const closeBtnStyle: React.CSSProperties = {
  position: 'absolute', top: 16, right: 16,
  background: 'none', border: 'none',
  color: tokens.textMuted, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: 4, transition: 'color 0.2s ease',
};

export default LoginModal;
