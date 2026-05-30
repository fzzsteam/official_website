import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import type { VipPlan } from '../context/AppContext';
import { tokens } from './episode-detail/tokens';
import { apiGet } from '../lib/api/client';

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const benefits = [
  { icon: '▶', label: '全站短剧免费观看' },
  { icon: '◈', label: '高清画质畅享' },
  { icon: '⊘', label: '无广告纯净播放' },
  { icon: '✦', label: '优先看最新剧集' },
  { icon: '◇', label: '会员专属内容' },
];

const planSubtitles: Record<string, string> = {
  '30d': '畅享全站短剧',
  '90d': '超值优惠',
  '365d': '年度特惠',
};

const ShieldIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const VipModal: React.FC = () => {
  const { closeModal, selectPlan } = useApp();
  const [plans, setPlans] = useState<VipPlan[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadPlans = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await apiGet<{
          plans: Array<{
            code: string;
            name: string;
            durationDays: number;
            priceCents: number;
            recommended: boolean;
          }>;
        }>('/api/membership/plans');

        if (cancelled) {
          return;
        }

        setPlans(
          data.plans.map((plan) => {
            const price = plan.priceCents / 100;
            const months = plan.durationDays / 30;
            return {
              id: plan.code,
              code: plan.code,
              name: plan.name,
              price,
              period: plan.durationDays >= 365 ? '年' : plan.durationDays >= 90 ? '3个月' : '月',
              durationDays: plan.durationDays,
              priceCents: plan.priceCents,
              pricePerMonth: months > 1 ? Number((price / months).toFixed(1)) : price,
              recommended: plan.recommended,
            };
          }),
        );
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError instanceof Error ? requestError.message : '会员套餐加载失败');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadPlans();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Overlay onClick={closeModal}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[480px] mx-4 md:mx-0"
        style={{
          borderRadius: 12,
          background: 'linear-gradient(180deg, #282018 0%, #1c1610 100%)',
          border: '1px solid rgba(201,145,42,0.22)',
          boxShadow: '0 28px 90px rgba(0,0,0,0.65)',
          padding: '36px 40px 28px',
          position: 'relative',
        }}
      >
        {/* Close */}
        <button onClick={closeModal} style={closeBtnStyle}><CloseIcon /></button>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h2 style={{
            fontFamily: tokens.fontDisplay, fontSize: 24, fontWeight: 400,
            color: tokens.textPrimary, letterSpacing: '0.12em', margin: '0 0 6px',
          }}>
            开通会员
          </h2>
          <p style={{
            fontFamily: tokens.fontBody, fontSize: 12,
            color: tokens.textMuted, letterSpacing: '0.08em', margin: 0,
          }}>
            开通会员，畅享多重特权
          </p>
        </div>

        {/* Benefits */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 20, marginBottom: 28, flexWrap: 'wrap',
        }}>
          {benefits.map((b) => (
            <div key={b.label} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontFamily: tokens.fontBody, fontSize: 12,
              color: tokens.textMuted, letterSpacing: '0.04em',
            }}>
              <span style={{ color: tokens.accentGold, fontSize: 11 }}>{b.icon}</span>
              {b.label}
            </div>
          ))}
        </div>

        {/* Plans */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 22 }}>
          {loading && (
            <div style={statusCardStyle}>
              正在加载会员套餐...
            </div>
          )}
          {!loading && error && (
            <div style={statusCardStyle}>
              {error}
            </div>
          )}
          {plans.map((plan) => (
            <div
              key={plan.id}
              style={{
                borderRadius: 8,
                border: plan.recommended
                  ? `1.5px solid rgba(201,145,42,0.7)`
                  : '1px solid rgba(240,237,232,0.1)',
                background: plan.recommended
                  ? 'linear-gradient(180deg, rgba(201,145,42,0.12) 0%, rgba(201,145,42,0.06) 100%)'
                  : 'rgba(240,237,232,0.03)',
                padding: '22px 16px 18px',
                textAlign: 'center',
                position: 'relative',
              }}
            >
              {/* Recommended badge */}
              {plan.recommended && (
                <div style={{
                  position: 'absolute', top: -1, right: 16,
                  background: 'linear-gradient(135deg, #C9912A, #d8a24d)',
                  color: '#1a0f00', fontSize: 10, fontWeight: 600,
                  padding: '2px 8px', borderRadius: '0 0 4px 4px',
                  fontFamily: tokens.fontBody, letterSpacing: '0.06em',
                }}>
                  推荐
                </div>
              )}

              <div style={{
                fontFamily: tokens.fontDisplay, fontSize: 16,
                color: tokens.textPrimary, letterSpacing: '0.08em', marginBottom: 4,
              }}>
                {plan.name}
              </div>
              <div style={{
                fontFamily: tokens.fontBody, fontSize: 11,
                color: tokens.textMuted, letterSpacing: '0.04em', marginBottom: 16,
              }}>
                {planSubtitles[plan.code] ?? '畅享会员权益'}
              </div>

              {/* Price */}
              <div style={{ marginBottom: 6 }}>
                <span style={{ fontFamily: tokens.fontCormorant, fontSize: 14, color: tokens.accentGold }}>¥</span>
                <span style={{
                  fontFamily: tokens.fontCormorant, fontSize: 42, fontWeight: 600,
                  color: plan.recommended ? tokens.accentAmber : tokens.textPrimary,
                  lineHeight: 1,
                }}>
                  {plan.price}
                </span>
                <span style={{ fontFamily: tokens.fontBody, fontSize: 12, color: tokens.textMuted }}>
                  /{plan.period}
                </span>
              </div>

              {plan.pricePerMonth && plan.id !== 'monthly' && (
                <div style={{
                  fontFamily: tokens.fontBody, fontSize: 11,
                  color: tokens.textMuted, marginBottom: 16, letterSpacing: '0.04em',
                }}>
                  ¥{plan.pricePerMonth}/月
                </div>
              )}
              {plan.durationDays <= 30 && <div style={{ height: 20, marginBottom: 0 }} />}

              {/* CTA */}
              <button
                onClick={() => selectPlan(plan)}
                style={{
                  width: '100%', padding: '10px 0',
                  background: plan.recommended
                    ? 'linear-gradient(135deg, #C9912A, #d8a24d)'
                    : 'none',
                  border: plan.recommended
                    ? 'none'
                    : `1px solid rgba(201,145,42,0.5)`,
                  borderRadius: 4, cursor: 'pointer',
                  fontFamily: tokens.fontBody, fontSize: 13,
                  color: plan.recommended ? '#1a0f00' : tokens.accentGold,
                  letterSpacing: '0.1em', marginTop: 'auto',
                  transition: 'all 0.2s ease',
                }}
              >
                立即开通
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
          fontFamily: tokens.fontBody, fontSize: 11, color: tokens.textMuted, letterSpacing: '0.04em',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <ShieldIcon /> 安全支付
          </span>
          <span style={{ color: 'rgba(240,237,232,0.2)' }}>|</span>
          <span>随时可取消自动续费</span>
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
  position: 'absolute', top: 16, right: 16,
  background: 'none', border: 'none',
  color: tokens.textMuted, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: 4, transition: 'color 0.2s ease', borderRadius: '50%',
};

const statusCardStyle: React.CSSProperties = {
  gridColumn: '1 / -1',
  padding: '28px 16px',
  borderRadius: 8,
  border: '1px solid rgba(240,237,232,0.1)',
  background: 'rgba(240,237,232,0.03)',
  textAlign: 'center',
  color: tokens.textMuted,
  fontFamily: tokens.fontBody,
  fontSize: 12,
  letterSpacing: '0.06em',
};

const { fontCormorant } = tokens;
void fontCormorant;

export default VipModal;
