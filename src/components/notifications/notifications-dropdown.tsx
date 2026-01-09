'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Bell, CheckCheck, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NotificationBadge } from './notification-badge'
import { NotificationItem } from './notification-item'
import { useRealtimeNotifications } from '@/hooks/use-realtime-notifications'
import { useNotificationsStore } from '@/stores/notifications'
import { notificationsApi } from '@/services/supabase-api'
import { toast } from 'sonner'

export function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const { notifications, unreadCount, isLoading } = useRealtimeNotifications()
  const { markAsRead, markAllAsRead } = useNotificationsStore()

  // Mutation para marcar como leida
  const markAsReadMutation = useMutation({
    mutationFn: notificationsApi.markAsRead,
    onSuccess: (_, id) => {
      markAsRead(id)
    },
  })

  // Mutation para marcar todas como leidas
  const markAllAsReadMutation = useMutation({
    mutationFn: notificationsApi.markAllAsRead,
    onSuccess: () => {
      markAllAsRead()
      toast.success('Todas las notificaciones marcadas como leidas')
    },
  })

  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate(id)
  }

  const handleMarkAllAsRead = () => {
    if (unreadCount > 0) {
      markAllAsReadMutation.mutate()
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-11 w-11 min-w-[44px] min-h-[44px]"
          aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ''}`}
        >
          <Bell className="h-5 w-5" />
          <NotificationBadge count={unreadCount} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-80 max-h-[70vh] overflow-hidden"
        align="end"
        sideOffset={8}
      >
        <div className="flex items-center justify-between px-3 py-2">
          <DropdownMenuLabel className="p-0 font-semibold">
            Notificaciones
          </DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
            >
              {markAllAsReadMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <CheckCheck className="h-3 w-3 mr-1" />
              )}
              Marcar todas
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />

        <div className="max-h-[calc(70vh-80px)] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <Bell className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                No tienes notificaciones
              </p>
            </div>
          ) : (
            <div className="space-y-1 p-1">
              {notifications.slice(0, 15).map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onClose={() => setIsOpen(false)}
                />
              ))}
            </div>
          )}
        </div>

        {notifications.length > 15 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full text-sm"
                onClick={() => {
                  window.location.href = '/es/notificaciones'
                  setIsOpen(false)
                }}
              >
                Ver todas las notificaciones
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
