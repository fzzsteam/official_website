import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { Drama } from '../types/drama';
import { mockDrama } from '../data/mockData';

export type ModalType = 'none' | 'login' | 'vip' | 'payment';
export type PageType = 'home' | 'episode-detail' | 'about' | 'business' | 'contact';

export interface VipPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  pricePerMonth?: number;
  recommended?: boolean;
}

export interface User {
  phone: string;
  isVip: boolean;
  avatarUrl?: string;
}

interface AppState {
  page: PageType;
  modal: ModalType;
  user: User | null;
  selectedDrama: Drama | null;
  selectedPlan: VipPlan | null;
}

interface AppContextValue extends AppState {
  navigateTo: (page: PageType, drama?: Drama) => void;
  openModal: (modal: ModalType) => void;
  closeModal: () => void;
  login: (phone: string) => void;
  logout: () => void;
  upgradeToVip: () => void;
  selectPlan: (plan: VipPlan) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const DEMO_USER: User = { phone: '183****5627', isVip: false };

interface AppProviderProps {
  children: React.ReactNode;
  initialDramaId?: string;
}

function getInitialDrama(initialDramaId?: string): Drama | null {
  if (!initialDramaId) {
    return null;
  }

  return {
    ...mockDrama,
    id: initialDramaId,
  };
}

export const AppProvider: React.FC<AppProviderProps> = ({ children, initialDramaId }) => {
  const [state, setState] = useState<AppState>(() => ({
    page: initialDramaId ? 'episode-detail' : 'home',
    modal: 'none',
    user: DEMO_USER,
    selectedDrama: getInitialDrama(initialDramaId),
    selectedPlan: null,
  }));

  useEffect(() => {
    setState((s) => {
      if (initialDramaId) {
        return {
          ...s,
          page: 'episode-detail',
          selectedDrama: getInitialDrama(initialDramaId),
        };
      }

      if (s.page === 'episode-detail' && s.selectedDrama) {
        return {
          ...s,
          page: 'home',
          selectedDrama: null,
        };
      }

      return s;
    });
  }, [initialDramaId]);

  const navigateTo = useCallback((page: PageType, drama?: Drama) => {
    setState((s) => ({
      ...s,
      page,
      selectedDrama: page === 'episode-detail' ? (drama ?? s.selectedDrama) : null,
    }));
  }, []);

  const openModal = useCallback((modal: ModalType) => {
    setState((s) => ({ ...s, modal }));
  }, []);

  const closeModal = useCallback(() => {
    setState((s) => ({ ...s, modal: 'none' }));
  }, []);

  const login = useCallback((phone: string) => {
    setState((s) => ({ ...s, user: { phone, isVip: false }, modal: 'none' }));
  }, []);

  const logout = useCallback(() => {
    setState((s) => ({ ...s, user: null, page: 'home', modal: 'none' }));
  }, []);

  const upgradeToVip = useCallback(() => {
    setState((s) => ({
      ...s,
      user: s.user ? { ...s.user, isVip: true } : null,
      modal: 'none',
    }));
  }, []);

  const selectPlan = useCallback((plan: VipPlan) => {
    setState((s) => ({ ...s, selectedPlan: plan, modal: 'payment' }));
  }, []);

  return (
    <AppContext.Provider value={{ ...state, navigateTo, openModal, closeModal, login, logout, upgradeToVip, selectPlan }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextValue => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
