'use client';

import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { KeyboardShortcutsHelp } from '@/components/accessibility/keyboard-shortcuts-help';
import {
  Sun,
  Moon,
  User,
  LogOut,
  Settings,
  Bell,
  Search,
  Menu
} from 'lucide-react';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/es/login');
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'reception':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'mechanic_lead':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'technician':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'reception':
        return 'Recepción';
      case 'mechanic_lead':
        return 'Jefe Mecánicos';
      case 'technician':
        return 'Técnico';
      default:
        return role;
    }
  };

  return (
    <header className="flex h-14 md:h-16 items-center justify-between border-b bg-background px-4 md:px-6">
      {/* Left side */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Mobile menu button - increased touch target */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-11 w-11 min-w-[44px] min-h-[44px]"
          onClick={onMenuClick}
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Global search button - hidden on mobile */}
        <Button
          variant="outline"
          className="hidden md:flex w-64 justify-start gap-2 text-muted-foreground"
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

        {/* Mobile search button - increased touch target */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-11 w-11 min-w-[44px] min-h-[44px]"
          onClick={() => {
            // TODO: Implement global search modal
            console.log('Open search modal');
          }}
          aria-label="Buscar"
        >
          <Search className="h-5 w-5" />
        </Button>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Notifications - increased touch target */}
        <Button
          variant="ghost"
          size="icon"
          className="relative h-11 w-11 min-w-[44px] min-h-[44px]"
          aria-label="Notificaciones"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-3 w-3 rounded-full bg-red-500 text-xs" aria-hidden="true"></span>
        </Button>

        {/* Keyboard shortcuts help - hidden on mobile */}
        <div className="hidden md:block">
          <KeyboardShortcutsHelp />
        </div>

        {/* Theme toggle - increased touch target */}
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11 min-w-[44px] min-h-[44px]"
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          title="Cambiar tema"
          aria-label="Cambiar tema"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Cambiar tema</span>
        </Button>

        {/* User menu - increased touch target on mobile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-11 w-auto gap-2 px-2 min-h-[44px]"
              aria-label="Menú de usuario"
            >
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.avatar_url || ''} alt={user?.full_name || ''} />
                <AvatarFallback className="text-xs">
                  {user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium truncate max-w-[120px]">{user?.full_name}</span>
                <Badge
                  variant="secondary"
                  className={`text-xs ${getRoleColor(user?.role || '')}`}
                >
                  {getRoleLabel(user?.role || '')}
                </Badge>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.full_name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
                <Badge
                  variant="secondary"
                  className={`text-xs mt-1 w-fit ${getRoleColor(user?.role || '')}`}
                >
                  {getRoleLabel(user?.role || '')}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/es/configuracion')}>
              <User className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/es/configuracion')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Configuración</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
