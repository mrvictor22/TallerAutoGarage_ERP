'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'reception' | 'technician';
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  hasPermission: (resource: string, action: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      login: (user: User) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
      hasPermission: (resource: string, action: string) => {
        const { user } = get();
        if (!user) return false;
        
        // Admin has all permissions
        if (user.role === 'admin') return true;
        
        // Basic permissions for other roles
        const permissions = {
          reception: ['dashboard:read', 'orders:read', 'orders:create', 'owners:read', 'vehicles:read'],
          technician: ['dashboard:read', 'orders:read', 'orders:update', 'vehicles:read']
        };
        
        const userPermissions = permissions[user.role] || [];
        return userPermissions.includes(`${resource}:${action}`);
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
