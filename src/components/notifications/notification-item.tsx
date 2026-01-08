'use client'

import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { Notification, NotificationType } from '@/types/database'
import {
  FileText,
  RefreshCw,
  CheckCircle,
  DollarSign,
  Truck,
  Clock,
  Car,
  AlertCircle,
  FileWarning,
  CreditCard,
} from 'lucide-react'

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: string) => void
  onClose?: () => void
}

const notificationIcons: Record<NotificationType, React.ElementType> = {
  order_created: FileText,
  order_status_changed: RefreshCw,
  budget_approved: CheckCircle,
  budget_missing: FileWarning,
  payment_received: DollarSign,
  payment_reminder: CreditCard,
  order_ready: Truck,
  order_stalled: Clock,
  vehicle_ready: Car,
  whatsapp_failed: AlertCircle,
}

const notificationColors: Record<NotificationType, string> = {
  order_created: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300',
  order_status_changed: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300',
  budget_approved: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300',
  budget_missing: 'bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300',
  payment_received: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300',
  payment_reminder: 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300',
  order_ready: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900 dark:text-cyan-300',
  order_stalled: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300',
  vehicle_ready: 'bg-teal-100 text-teal-600 dark:bg-teal-900 dark:text-teal-300',
  whatsapp_failed: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300',
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onClose,
}: NotificationItemProps) {
  const router = useRouter()
  const Icon = notificationIcons[notification.type] || FileText
  const colorClass =
    notificationColors[notification.type] || 'bg-gray-100 text-gray-600'

  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id)
    }
    if (notification.link) {
      router.push(notification.link)
      onClose?.()
    }
  }

  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
    locale: es,
  })

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-full flex items-start gap-3 p-3 text-left rounded-lg transition-colors',
        'hover:bg-accent/50 focus:bg-accent/50 focus:outline-none',
        !notification.read && 'bg-accent/30'
      )}
    >
      <div className={cn('p-2 rounded-full shrink-0', colorClass)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              'text-sm line-clamp-1',
              !notification.read && 'font-medium'
            )}
          >
            {notification.title}
          </p>
          {!notification.read && (
            <span className="shrink-0 h-2 w-2 rounded-full bg-blue-500" />
          )}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
      </div>
    </button>
  )
}
