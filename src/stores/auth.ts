import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole, Permission } from '@/types';
import { usersApi } from '@/services/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  getCurrentUser: () => Promise<void>;
  hasPermission: (resource: string, action: string) => boolean;
  hasRole: (role: UserRole) => boolean;
}

// Role-based permissions configuration
const rolePermissions: Record<UserRole, string[]> = {
  admin: ['*'], // Admin has all permissions
  reception: [
    'orders:read',
    'orders:create',
    'orders:update',
    'owners:*',
    'vehicles:*',
    'whatsapp:send',
    'dashboard:read'
  ],
  technician: [
    'orders:read',
    'orders:update',
    'timeline:*',
    'parts:*',
    'dashboard:read'
  ]
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        
        try {
          // Simulate login - in real app, this would call authentication API
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Mock authentication - accept any email/password for demo
          const response = await usersApi.getCurrentUser();
          
          if (response.success && response.data) {
            set({ 
              user: response.data, 
              isAuthenticated: true, 
              isLoading: false 
            });
            return true;
          }
          
          set({ isLoading: false });
          return false;
        } catch (error) {
          set({ isLoading: false });
          return false;
        }
      },

      logout: () => {
        set({ 
          user: null, 
          isAuthenticated: false 
        });
      },

      getCurrentUser: async () => {
        set({ isLoading: true });
        
        try {
          const response = await usersApi.getCurrentUser();
          
          if (response.success && response.data) {
            set({ 
              user: response.data, 
              isAuthenticated: true, 
              isLoading: false 
            });
          } else {
            set({ 
              user: null, 
              isAuthenticated: false, 
              isLoading: false 
            });
          }
        } catch (error) {
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false 
          });
        }
      },

      hasPermission: (resource: string, action: string) => {
        const { user } = get();
        if (!user) return false;

        const userPermissions = rolePermissions[user.role] || [];
        
        // Check for wildcard permission
        if (userPermissions.includes('*')) return true;
        
        // Check for specific resource:action permission
        const specificPermission = `${resource}:${action}`;
        if (userPermissions.includes(specificPermission)) return true;
        
        // Check for resource wildcard permission
        const resourceWildcard = `${resource}:*`;
        if (userPermissions.includes(resourceWildcard)) return true;
        
        return false;
      },

      hasRole: (role: UserRole) => {
        const { user } = get();
        return user?.role === role;
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);
