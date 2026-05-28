import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/episode-detail/Navbar';
import HomePage from './components/HomePage';
import EpisodeDetailPage from './components/episode-detail';
import LoginModal from './components/LoginModal';
import VipModal from './components/VipModal';
import PaymentModal from './components/PaymentModal';
import { mockCast, mockRecommendations } from './data/mockData';

const AppShell: React.FC = () => {
  const { page, modal, selectedDrama } = useApp();

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />

      {/* Pages */}
      {page === 'home' && <HomePage />}
      {page === 'episode-detail' && selectedDrama && (
        <EpisodeDetailPage
          drama={selectedDrama}
          cast={mockCast}
          recommendations={mockRecommendations}
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

const App: React.FC = () => (
  <AppProvider>
    <AppShell />
  </AppProvider>
);

export default App;
