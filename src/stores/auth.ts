import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createClient } from '@/lib/supabase/client'
import { Profile, UserRole } from '@/types/database'

// Super admin email - only this user can approve registrations
const SUPER_ADMIN_EMAIL = 'vc70383@hotmail.com'

interface AuthState {
  user: Profile | null
  isAuthenticated: boolean
  isLoading: boolean
  justLoggedIn: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; pendingApproval?: boolean }>
  logout: () => Promise<void>
  signUp: (email: string, password: string, fullName: string, role?: UserRole) => Promise<{ success: boolean; error?: string }>
  getCurrentUser: () => Promise<void>
  hasPermission: (resource: string, action: string) => boolean
  hasRole: (role: UserRole) => boolean
  isAdmin: () => boolean
  isSuperAdmin: () => boolean
  clearJustLoggedIn: () => void
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
    'dashboard:read',
    'payments:*'
  ],
  mechanic_lead: [
    'orders:read',
    'orders:update',
    'orders:assign',
    'budget:read',
    'budget:approve',
    'timeline:*',
    'parts:*',
    'technicians:read',
    'technicians:assign',
    'reports:read',
    'dashboard:read'
  ],
  technician: [
    'orders:read',
    'orders:update',
    'timeline:*',
    'parts:*',
    'dashboard:read'
  ]
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      justLoggedIn: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true })
        const supabase = createClient()

        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
          })

          if (error) {
            set({ isLoading: false })
            return { success: false, error: error.message }
          }

          if (data.user) {
            // Get user profile
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .single()

            if (profileError) {
              set({ isLoading: false })
              return { success: false, error: 'Error al cargar perfil de usuario' }
            }

            if (!profile.is_active) {
              await supabase.auth.signOut()
              set({ isLoading: false })
              return { success: false, error: 'Tu cuenta ha sido desactivada' }
            }

            // Check if user is approved (super admin is always approved)
            if (!profile.is_approved && profile.email !== SUPER_ADMIN_EMAIL) {
              await supabase.auth.signOut()
              set({ isLoading: false })
              return {
                success: false,
                error: 'Tu cuenta está pendiente de aprobación. El administrador revisará tu solicitud pronto.',
                pendingApproval: true
              }
            }

            set({
              user: profile,
              isAuthenticated: true,
              isLoading: false,
              justLoggedIn: true
            })

            return { success: true }
          }

          set({ isLoading: false })
          return { success: false, error: 'Error desconocido' }
        } catch (error) {
          set({ isLoading: false })
          return { success: false, error: 'Error de conexión' }
        }
      },

      logout: async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        set({
          user: null,
          isAuthenticated: false
        })
      },

      signUp: async (email: string, password: string, fullName: string, role: UserRole = 'technician') => {
        set({ isLoading: true })
        const supabase = createClient()

        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: fullName,
                role
              }
            }
          })

          if (error) {
            set({ isLoading: false })
            return { success: false, error: error.message }
          }

          set({ isLoading: false })

          if (data.user) {
            // Registration successful - user needs to be approved
            return {
              success: true,
              error: 'Tu cuenta ha sido creada. Un administrador debe aprobar tu solicitud antes de poder acceder al sistema.'
            }
          }

          return { success: true }
        } catch (error) {
          set({ isLoading: false })
          return { success: false, error: 'Error de conexión' }
        }
      },

      getCurrentUser: async () => {
        set({ isLoading: true })
        const supabase = createClient()

        try {
          const { data: { user } } = await supabase.auth.getUser()

          if (user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single()

            // Check if user is active AND approved (or is super admin)
            if (profile && profile.is_active && (profile.is_approved || profile.email === SUPER_ADMIN_EMAIL)) {
              set({
                user: profile,
                isAuthenticated: true,
                isLoading: false
              })
              return
            }
          }

          set({
            user: null,
            isAuthenticated: false,
            isLoading: false
          })
        } catch (error) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false
          })
        }
      },

      hasPermission: (resource: string, action: string) => {
        const { user } = get()
        if (!user) return false

        const userPermissions = rolePermissions[user.role] || []

        // Check for wildcard permission
        if (userPermissions.includes('*')) return true

        // Check for specific resource:action permission
        const specificPermission = `${resource}:${action}`
        if (userPermissions.includes(specificPermission)) return true

        // Check for resource wildcard permission
        const resourceWildcard = `${resource}:*`
        if (userPermissions.includes(resourceWildcard)) return true

        return false
      },

      hasRole: (role: UserRole) => {
        const { user } = get()
        return user?.role === role
      },

      isAdmin: () => {
        const { user } = get()
        return user?.role === 'admin'
      },

      isSuperAdmin: () => {
        const { user } = get()
        return user?.email === SUPER_ADMIN_EMAIL
      },

      clearJustLoggedIn: () => {
        set({ justLoggedIn: false })
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
)
