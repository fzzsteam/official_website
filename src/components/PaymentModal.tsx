import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { tokens } from './episode-detail/tokens';
import { QRCodeSVG } from 'qrcode.react';
import { apiGet, apiPost, type ApiError } from '../lib/api/client';

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
/* Official WeChat Pay icon — extracted from https://gtimg.wechatpay-global.com/pay_en/img/common/logo.svg */
const WechatPayIcon = () => (
  <svg width="34" height="30" viewBox="0 0 375 331" fill="none">
    <path
      d="M136.3106,209.1757 C134.6186,210.0287 132.7146,210.5227 130.6896,210.5227 C126.0036,210.5227 121.9326,207.9457 119.7906,204.1297 L118.9726,202.3377 L84.8556,127.4737 C84.4876,126.6577 84.2596,125.7377 84.2596,124.8407 C84.2596,121.3917 87.0566,118.5947 90.5066,118.5947 C91.9076,118.5947 93.2016,119.0607 94.2426,119.8347 L134.5036,148.4997 C137.4446,150.4237 140.9586,151.5527 144.7386,151.5527 C146.9926,151.5527 149.1426,151.1307 151.1446,150.4037 L340.4756,66.1377 C306.5386,26.1397 250.6466,0.0007 187.3966,0.0007 C83.8966,0.0007 -0.0004,69.9177 -0.0004,156.1707 C-0.0004,203.2247 25.2416,245.5827 64.7496,274.2127 C67.9196,276.4757 69.9946,280.1937 69.9946,284.3897 C69.9946,285.7767 69.6986,287.0447 69.3356,288.3677 C66.1796,300.1387 61.1306,318.9887 60.8936,319.8707 C60.5006,321.3497 59.8856,322.8907 59.8856,324.4367 C59.8856,327.8867 62.6816,330.6817 66.1366,330.6817 C67.4886,330.6817 68.5986,330.1787 69.7416,329.5197 L110.7676,305.8337 C113.8546,304.0537 117.1206,302.9487 120.7216,302.9487 C122.6366,302.9487 124.4866,303.2447 126.2266,303.7777 C145.3676,309.2817 166.0156,312.3407 187.3966,312.3407 C290.8926,312.3407 374.8006,242.4187 374.8006,156.1707 C374.8006,130.0457 367.0596,105.4437 353.4536,83.8007 L137.6776,208.3857 L136.3106,209.1757 Z"
      fill="#1AAD19"
    />
  </svg>
);

const PaymentModal: React.FC = () => {
  const { closeModal, openModal, selectedPlan, refreshUser } = useApp();
  const [timeLeft, setTimeLeft] = useState(0);
  const [error, setError] = useState('');
  const [orderNo, setOrderNo] = useState('');
  const [codeUrl, setCodeUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'creating' | 'pending' | 'paid'>('idle');

  useEffect(() => {
    if (!selectedPlan) {
      return;
    }

    let cancelled = false;

    const createOrder = async () => {
      setStatus('creating');
      setError('');
      setOrderNo('');
      setCodeUrl('');

      try {
        const order = await apiPost<{
          orderId: string;
          orderNo: string;
          status: 'pending';
          planCode: string;
          totalCents: number;
          codeUrl: string;
          expiresAt: string;
        }>('/api/payments/wechat/native', { planCode: selectedPlan.code });

        if (cancelled) {
          return;
        }

        setOrderNo(order.orderNo);
        setCodeUrl(order.codeUrl);
        setStatus('pending');
        setTimeLeft(Math.max(0, Math.floor((new Date(order.expiresAt).getTime() - Date.now()) / 1000)));
      } catch (requestError) {
        if (cancelled) {
          return;
        }

        const apiError = requestError as ApiError;
        if (apiError.code === 'AUTH_REQUIRED') {
          closeModal();
          openModal('login');
          return;
        }

        setStatus('idle');
        setError(requestError instanceof Error ? requestError.message : '创建支付订单失败');
      }
    };

    void createOrder();

    return () => {
      cancelled = true;
    };
  }, [closeModal, openModal, selectedPlan]);

  useEffect(() => {
    if (status !== 'pending' || timeLeft <= 0) {
      return;
    }

    const id = setInterval(() => {
      setTimeLeft((remaining) => {
        if (remaining <= 1) {
          clearInterval(id);
          return 0;
        }
        return remaining - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [status, timeLeft]);

  useEffect(() => {
    if (!orderNo || status !== 'pending') {
      return;
    }

    let cancelled = false;
    const id = setInterval(() => {
      void apiGet<{ orderNo: string; status: 'pending' | 'paid' | 'closed' }>(
        `/api/payments/wechat/status?orderNo=${encodeURIComponent(orderNo)}`,
      )
        .then(async (result) => {
          if (cancelled) {
            return;
          }

          if (result.status === 'paid') {
            setStatus('paid');
            clearInterval(id);
            await refreshUser();
            closeModal();
          }
        })
        .catch((requestError) => {
          if (cancelled) {
            return;
          }

          const apiError = requestError as ApiError;
          if (apiError.code === 'AUTH_REQUIRED') {
            clearInterval(id);
            closeModal();
            openModal('login');
            return;
          }

          setError(requestError instanceof Error ? requestError.message : '支付状态查询失败');
        });
    }, 3000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [closeModal, openModal, orderNo, refreshUser, status]);

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  if (!selectedPlan) return null;

  return (
    <Overlay onClick={closeModal}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[440px] mx-4 md:mx-0"
        style={{
          borderRadius: 12,
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4 }}>
            <WechatPayIcon />
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
          <div style={{
            width: 160, height: 160,
            background: '#fff',
            borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', overflow: 'hidden',
            padding: 10,
          }}>
            {codeUrl ? (
              <QRCodeSVG value={codeUrl} size={140} bgColor="#ffffff" fgColor="#000000" />
            ) : (
              <span style={{ color: '#666', fontSize: 12, fontFamily: tokens.fontBody }}>
                {status === 'creating' ? '二维码生成中...' : '二维码加载失败'}
              </span>
            )}
          </div>
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
            fontFamily: tokens.fontCormorant, fontSize: 28, fontWeight: 600,
            color: tokens.accentAmber, fontVariantNumeric: 'tabular-nums',
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
          <span style={{ color: tokens.accentGold, fontWeight: 500, fontFamily: tokens.fontCormorant, fontSize: 16, fontVariantNumeric: 'tabular-nums' }}>
            {formatTime(timeLeft)}
          </span>
          {' '}内完成支付
        </div>

        {error && (
          <div style={{
            textAlign: 'center',
            marginBottom: 12,
            color: '#c0392b',
            fontFamily: tokens.fontBody,
            fontSize: 12,
            letterSpacing: '0.04em',
          }}>
            {error}
          </div>
        )}

        {/* Footer note */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          fontFamily: tokens.fontBody, fontSize: 11, color: tokens.textMuted,
          letterSpacing: '0.04em',
        }}>
          <ShieldIcon /> 支付完成后自动开通会员
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

const closeBtnStyle: React.CSSProperties = {
  position: 'absolute', top: 14, right: 14,
  background: 'none', border: 'none',
  color: tokens.textMuted, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: 4,
};

export default PaymentModal;
