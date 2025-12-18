'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  LayoutDashboard,
  FileText,
  Users,
  Car,
  MessageSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search
} from 'lucide-react';

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  labelKey: string;
  permission?: string;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  {
    href: '/dashboard',
    icon: LayoutDashboard,
    labelKey: 'Panel de Control',
    permission: 'dashboard:read'
  },
  {
    href: '/ordenes',
    icon: FileText,
    labelKey: 'Órdenes',
    permission: 'orders:read',
    children: [
      {
        href: '/ordenes/nueva',
        icon: Plus,
        labelKey: 'Nueva Orden',
        permission: 'orders:create'
      }
    ]
  },
  {
    href: '/duenos',
    icon: Users,
    labelKey: 'Dueños',
    permission: 'owners:read'
  },
  {
    href: '/vehiculos',
    icon: Car,
    labelKey: 'Vehículos',
    permission: 'vehicles:read'
  },
  {
    href: '/notificaciones',
    icon: MessageSquare,
    labelKey: 'Notificaciones',
    permission: 'whatsapp:read',
    children: [
      {
        href: '/notificaciones/whatsapp',
        icon: MessageSquare,
        labelKey: 'WhatsApp',
        permission: 'whatsapp:read'
      }
    ]
  },
  {
    href: '/configuracion',
    icon: Settings,
    labelKey: 'Configuración',
    permission: 'config:read'
  }
];

interface SidebarItemProps {
  item: NavItem;
  isCollapsed: boolean;
  level?: number;
}

function SidebarItem({ item, isCollapsed, level = 0 }: SidebarItemProps) {
  const pathname = usePathname();
  const { hasPermission } = useAuthStore();
  const [isExpanded, setIsExpanded] = useState(false);

  // Check permission
  if (item.permission && !hasPermission(item.permission.split(':')[0], item.permission.split(':')[1])) {
    return null;
  }

  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
  const hasChildren = item.children && item.children.length > 0;
  const Icon = item.icon;

  const itemContent = (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground',
        isActive && 'bg-accent text-accent-foreground',
        level > 0 && 'ml-4'
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!isCollapsed && (
        <>
          <span className="truncate">{item.labelKey}</span>
          {hasChildren && (
            <ChevronRight
              className={cn(
                'ml-auto h-4 w-4 transition-transform',
                isExpanded && 'rotate-90'
              )}
            />
          )}
        </>
      )}
    </div>
  );

  if (isCollapsed) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href={item.href}>
              {itemContent}
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">
            {item.labelKey}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div>
      {hasChildren ? (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-left"
        >
          {itemContent}
        </button>
      ) : (
        <Link href={item.href}>
          {itemContent}
        </Link>
      )}
      
      {hasChildren && isExpanded && !isCollapsed && (
        <div className="mt-1 space-y-1">
          {item.children?.map((child) => (
            <SidebarItem
              key={child.href}
              item={child}
              isCollapsed={isCollapsed}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <div
      className={cn(
        'flex h-full flex-col border-r bg-background transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Car className="h-4 w-4" />
            </div>
            <span className="font-semibold">Taller Pro</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-8 w-8"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <Separator />

      {/* Quick Search */}
      {!sidebarCollapsed && (
        <div className="p-4">
          <Button
            variant="outline"
            className="w-full justify-start gap-2 text-muted-foreground"
            onClick={() => {
              // TODO: Implement global search modal
              console.log('Open search modal');
            }}
          >
            <Search className="h-4 w-4" />
            Buscar...
            <kbd className="ml-auto rounded border bg-muted px-1.5 py-0.5 text-xs">
              ⌘K
            </kbd>
          </Button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => (
          <SidebarItem
            key={item.href}
            item={item}
            isCollapsed={sidebarCollapsed}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4">
        <Separator className="mb-4" />
        {!sidebarCollapsed && (
          <div className="text-xs text-muted-foreground">
            Taller Pro v1.0.0
          </div>
        )}
      </div>
    </div>
  );
}
