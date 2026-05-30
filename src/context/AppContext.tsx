import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { Drama } from '../types/drama';
import { mockDrama } from '../data/mockData';
import { apiGet, apiPost } from '../lib/api/client';

export type ModalType = 'none' | 'login' | 'vip' | 'payment';
export type PageType = 'home' | 'episode-detail' | 'about' | 'business' | 'contact';

export interface VipPlan {
  id: string;
  code: string;
  name: string;
  price: number;
  period: string;
  durationDays: number;
  priceCents: number;
  pricePerMonth?: number;
  recommended?: boolean;
}

export interface User {
  id: string;
  phone: string;
  isVip: boolean;
  vipExpiredAt?: string | null;
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
  login: (user: User) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
  upgradeToVip: () => Promise<void>;
  selectPlan: (plan: VipPlan) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

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
    user: null,
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

  const login = useCallback((user: User) => {
    setState((s) => ({ ...s, user, modal: 'none' }));
  }, []);

  const refreshUser = useCallback(async () => {
    const data = await apiGet<{ user: User | null }>('/api/auth/me');
    // TODO: 演示模式，临时给所有用户 VIP 权限，上线前删除
    const user = data.user ? { ...data.user, isVip: true } : null;
    setState((s) => ({ ...s, user }));
    return user;
  }, []);

  useEffect(() => {
    void refreshUser().catch(() => {
      setState((s) => ({ ...s, user: null }));
    });
  }, [refreshUser]);

  const logout = useCallback(async () => {
    try {
      await apiPost<{ success: boolean }>('/api/auth/logout');
    } catch {
      // Keep the client UI consistent even if the logout request fails.
    }
    setState((s) => ({
      ...s,
      user: null,
      page: 'home',
      modal: 'none',
    }));
  }, []);

  const upgradeToVip = useCallback(async () => {
    await refreshUser();
    setState((s) => ({
      ...s,
      modal: 'none',
    }));
  }, [refreshUser]);

  const selectPlan = useCallback((plan: VipPlan) => {
    setState((s) => ({ ...s, selectedPlan: plan, modal: 'payment' }));
  }, []);

  return (
    <AppContext.Provider
      value={{ ...state, navigateTo, openModal, closeModal, login, logout, refreshUser, upgradeToVip, selectPlan }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextValue => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
