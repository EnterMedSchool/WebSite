import create from 'zustand';
import { persist } from 'zustand/middleware';
import { user } from '../types';

const authStore = (set: any) => ({
  userProfile: null,
  addUser: (user: any) => set({ userProfile: user }),
});

export const useAuthStore = create(
  persist(authStore, {
    name: 'auth',
  })
);
