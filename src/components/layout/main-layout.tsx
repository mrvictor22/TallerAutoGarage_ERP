'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { useFocusManagement } from '@/hooks/use-focus-management';
import { Sidebar } from './sidebar';
import { Header } from './header';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user } = useAuthStore();
  const { containerRef } = useFocusManagement({ restoreOnUnmount: true });
  
  // Initialize keyboard shortcuts for global scope
  useKeyboardShortcuts('global');

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Acceso Requerido</h2>
          <p className="text-muted-foreground">
            Debes iniciar sesión para acceder a esta página
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background" ref={containerRef as React.RefObject<HTMLDivElement>}>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main
          className="flex-1 overflow-auto p-6"
          role="main"
          aria-label="Contenido principal"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
