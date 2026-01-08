'use client'

import { cn } from '@/lib/utils'

interface NotificationBadgeProps {
  count: number
  className?: string
}

export function NotificationBadge({ count, className }: NotificationBadgeProps) {
  if (count === 0) return null

  return (
    <span
      className={cn(
        'absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center',
        'rounded-full bg-red-500 text-[10px] font-medium text-white',
        'animate-in zoom-in-50 duration-200',
        className
      )}
      aria-label={`${count} notificaciones sin leer`}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}
