import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../lib/api';

interface User { id: string; username: string; city: string; eloRating: number; coins: number; isPro: boolean; bossesBeaten: number; streak: number; nemesisId?: string; }

interface AuthStore {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  setUser: (u: User) => void;
}

export const useAuth = create<AuthStore>()(persist((set) => ({
  user: null,
  loading: false,
  login: async (email, password) => {
    const { user } = await api.auth.login({ email, password });
    set({ user });
  },
  register: async (data) => {
    const { user } = await api.auth.register(data);
    set({ user });
  },
  logout: async () => {
    await api.auth.logout();
    set({ user: null });
  },
  fetchMe: async () => {
    try { const { user } = await api.auth.me(); set({ user }); } catch { /* keep persisted user on network failure */ }
  },
  setUser: (user) => set({ user }),
}), { name: 'damka-auth' }));
