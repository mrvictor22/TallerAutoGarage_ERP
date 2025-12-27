'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { useFocusManagement } from '@/hooks/use-focus-management';
import { Sidebar, MobileSidebar } from './sidebar';
import { Header } from './header';
import { Loader2 } from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const router = useRouter();
  const { user, isLoading, getCurrentUser } = useAuthStore();
  const { containerRef } = useFocusManagement({ restoreOnUnmount: true });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize keyboard shortcuts for global scope
  useKeyboardShortcuts('global');

  // Sync session on mount
  useEffect(() => {
    const initAuth = async () => {
      if (!user) {
        await getCurrentUser();
      }
      setIsInitializing(false);
    };
    initAuth();
  }, [user, getCurrentUser]);

  // Show loading while initializing
  if (isInitializing || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Acceso Requerido</h2>
          <p className="text-muted-foreground">
            Debes iniciar sesión para acceder a esta página
          </p>
          <button
            onClick={() => router.push('/es/login')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Ir a Iniciar Sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background" ref={containerRef as React.RefObject<HTMLDivElement>}>
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar
        open={mobileMenuOpen}
        onOpenChange={setMobileMenuOpen}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setMobileMenuOpen(true)} />
        <main
          className="flex-1 overflow-auto p-4 md:p-6"
          role="main"
          aria-label="Contenido principal"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
