'use client'

import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth'
import { useNotificationsStore } from '@/stores/notifications'
import { notificationsApi } from '@/services/supabase-api'
import { toast } from 'sonner'
import type { Notification } from '@/types/database'
import type { RealtimeChannel } from '@supabase/supabase-js'

export function useRealtimeNotifications() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const {
    setNotifications,
    addNotification,
    setLoading,
    notifications,
    unreadCount,
  } = useNotificationsStore()

  // Fetch inicial de notificaciones
  const { data, isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => notificationsApi.getNotifications(50, true),
    enabled: !!user,
    staleTime: 1000 * 60, // 1 minuto
    refetchOnWindowFocus: true,
  })

  // Sincronizar con el store
  useEffect(() => {
    if (data?.data) {
      setNotifications(data.data)
    }
    setLoading(isLoading)
  }, [data, isLoading, setNotifications, setLoading])

  // Configurar suscripcion Realtime
  useEffect(() => {
    if (!user?.id) return

    const supabase = createClient()
    let channel: RealtimeChannel | null = null

    const setupRealtimeSubscription = () => {
      channel = supabase
        .channel(`notifications:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newNotification = payload.new as Notification

            // Agregar al store
            addNotification(newNotification)

            // Mostrar toast
            toast.info(newNotification.title, {
              description: newNotification.message,
              action: newNotification.link
                ? {
                    label: 'Ver',
                    onClick: () => {
                      window.location.href = newNotification.link!
                    },
                  }
                : undefined,
              duration: 5000,
            })

            // Invalidar queries relacionadas
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
          }
        )
        .subscribe()
    }

    setupRealtimeSubscription()

    // Cleanup
    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [user?.id, addNotification, queryClient])

  return {
    notifications,
    unreadCount,
    isLoading,
  }
}
