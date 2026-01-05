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
  resetPasswordForEmail: (email: string) => Promise<{ success: boolean; error?: string }>
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>
  updateEmail: (newEmail: string) => Promise<{ success: boolean; error?: string }>
  signInWithMagicLink: (email: string) => Promise<{ success: boolean; error?: string }>
}

// Role-based permissions configuration
// Permissions follow pattern: resource:action
// Actions: read, create, update, delete, archive, assign, approve, send
// Note: Only admin can delete records. Other roles can archive.
const rolePermissions: Record<UserRole, string[]> = {
  admin: ['*'], // Admin has all permissions including delete
  reception: [
    'orders:read',
    'orders:create',
    'orders:update',
    'orders:archive',
    'owners:*',
    'vehicles:*',
    'whatsapp:send',
    'dashboard:read',
    'payments:*'
  ],
  mechanic_lead: [
    // Orders - full CRUD except delete
    'orders:read',
    'orders:create',
    'orders:update',
    'orders:assign',
    'orders:archive',
    // Owners - can create, read, update and archive (not delete)
    'owners:read',
    'owners:create',
    'owners:update',
    'owners:archive',
    // Vehicles - can create, read, update and archive (not delete)
    'vehicles:read',
    'vehicles:create',
    'vehicles:update',
    'vehicles:archive',
    // Budget
    'budget:read',
    'budget:approve',
    // Other permissions
    'timeline:*',
    'parts:*',
    'technicians:read',
    'technicians:assign',
    'reports:read',
    'dashboard:read'
  ],
  technician: [
    // Orders - can create and manage orders
    'orders:read',
    'orders:create',
    'orders:update',
    'orders:archive',
    // Owners - can create, read, update and archive (not delete)
    'owners:read',
    'owners:create',
    'owners:update',
    'owners:archive',
    // Vehicles - can create, read, update and archive (not delete)
    'vehicles:read',
    'vehicles:create',
    'vehicles:update',
    'vehicles:archive',
    // Other permissions
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

        // Determine the base URL for email redirect
        const baseUrl = typeof window !== 'undefined'
          ? window.location.origin
          : process.env.NEXT_PUBLIC_SITE_URL || 'https://tallerautogarage.apexcodelabs.com'

        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: fullName,
                role
              },
              emailRedirectTo: `${baseUrl}/auth/callback`
            }
          })

          if (error) {
            set({ isLoading: false })
            return { success: false, error: error.message }
          }

          set({ isLoading: false })

          if (data.user) {
            // Registration successful - email verification needed
            return {
              success: true,
              error: 'Hemos enviado un correo de verificación a tu email. Por favor, revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta.'
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
      },

      resetPasswordForEmail: async (email: string) => {
        set({ isLoading: true })
        const supabase = createClient()

        // Determine the base URL for email redirect
        const baseUrl = typeof window !== 'undefined'
          ? window.location.origin
          : process.env.NEXT_PUBLIC_SITE_URL || 'https://tallerautogarage.apexcodelabs.com'

        try {
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${baseUrl}/auth/callback`
          })

          if (error) {
            set({ isLoading: false })
            return { success: false, error: 'Error al enviar correo de recuperación: ' + error.message }
          }

          set({ isLoading: false })
          return { success: true }
        } catch (error) {
          set({ isLoading: false })
          return { success: false, error: 'Error de conexión al enviar correo de recuperación' }
        }
      },

      updatePassword: async (newPassword: string) => {
        set({ isLoading: true })
        const supabase = createClient()

        try {
          const { error } = await supabase.auth.updateUser({
            password: newPassword
          })

          if (error) {
            set({ isLoading: false })
            return { success: false, error: 'Error al actualizar contraseña: ' + error.message }
          }

          set({ isLoading: false })
          return { success: true }
        } catch (error) {
          set({ isLoading: false })
          return { success: false, error: 'Error de conexión al actualizar contraseña' }
        }
      },

      updateEmail: async (newEmail: string) => {
        set({ isLoading: true })
        const supabase = createClient()

        // Determine the base URL for email redirect
        const baseUrl = typeof window !== 'undefined'
          ? window.location.origin
          : process.env.NEXT_PUBLIC_SITE_URL || 'https://tallerautogarage.apexcodelabs.com'

        try {
          const { error } = await supabase.auth.updateUser({
            email: newEmail
          }, {
            emailRedirectTo: `${baseUrl}/auth/callback`
          })

          if (error) {
            set({ isLoading: false })
            return { success: false, error: 'Error al actualizar email: ' + error.message }
          }

          set({ isLoading: false })
          return { success: true }
        } catch (error) {
          set({ isLoading: false })
          return { success: false, error: 'Error de conexión al actualizar email' }
        }
      },

      signInWithMagicLink: async (email: string) => {
        set({ isLoading: true })
        const supabase = createClient()

        // Determine the base URL for email redirect
        const baseUrl = typeof window !== 'undefined'
          ? window.location.origin
          : process.env.NEXT_PUBLIC_SITE_URL || 'https://tallerautogarage.apexcodelabs.com'

        try {
          const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
              emailRedirectTo: `${baseUrl}/auth/callback`
            }
          })

          if (error) {
            set({ isLoading: false })
            return { success: false, error: 'Error al enviar enlace mágico: ' + error.message }
          }

          set({ isLoading: false })
          return { success: true }
        } catch (error) {
          set({ isLoading: false })
          return { success: false, error: 'Error de conexión al enviar enlace mágico' }
        }
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
