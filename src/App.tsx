import React, { useState, useEffect } from 'react';
import { useApp } from './context/AppContext';
import Navbar from './components/episode-detail/Navbar';
import HomePage from './components/HomePage';
import EpisodeDetailPage from './components/episode-detail';
import AboutPage from './components/pages/AboutPage';
import BusinessPage from './components/pages/BusinessPage';
import ContactPage from './components/pages/ContactPage';
import LoginModal from './components/LoginModal';
import VipModal from './components/VipModal';
import PaymentModal from './components/PaymentModal';
import { apiGet } from './lib/api/client';
import type { CastMember, RecommendedDrama, ApiDramaDetail } from './types/drama';

interface DramaDetailState {
  cast: CastMember[];
  recommendations: RecommendedDrama[];
}

const AppContent: React.FC = () => {
  const { page, modal, selectedDrama } = useApp();
  const [dramaDetail, setDramaDetail] = useState<DramaDetailState | null>(null);

  useEffect(() => {
    if (page !== 'episode-detail' || !selectedDrama) {
      setDramaDetail(null);
      return;
    }

    let cancelled = false;

    apiGet<{ drama: ApiDramaDetail }>(`/api/dramas/${encodeURIComponent(selectedDrama.id)}`)
      .then((data) => {
        if (cancelled) return;
        setDramaDetail({
          cast: data.drama.cast.map((c) => ({
            id: c.id,
            name: c.name,
            role: c.roleName ?? '',
            avatarUrl: c.avatarUrl ?? '',
            characterRole: '主演',
          })),
          recommendations: data.drama.recommendations.map((r) => ({
            id: r.id,
            title: r.title,
            coverUrl: r.coverUrl,
          })),
        });
      })
      .catch(() => {
        if (!cancelled) setDramaDetail({ cast: [], recommendations: [] });
      });

    return () => { cancelled = true; };
  }, [page, selectedDrama?.id]);

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />

      {/* Pages */}
      {page === 'home' && <HomePage />}
      {page === 'about' && <AboutPage />}
      {page === 'business' && <BusinessPage />}
      {page === 'contact' && <ContactPage />}
      {page === 'episode-detail' && selectedDrama && (
        <EpisodeDetailPage
          drama={selectedDrama}
          cast={dramaDetail?.cast ?? []}
          recommendations={dramaDetail?.recommendations ?? []}
          initialEpisode={1}
        />
      )}

      {/* Modals */}
      {modal === 'login' && <LoginModal />}
      {modal === 'vip' && <VipModal />}
      {modal === 'payment' && <PaymentModal />}
    </div>
  );
};

const App: React.FC = () => <AppContent />;

export default App;
