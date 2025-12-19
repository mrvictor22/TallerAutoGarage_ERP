'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { useUIStore } from '@/stores/ui';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  action: () => void;
  description: string;
  scope?: 'global' | 'orders' | 'owners' | 'vehicles';
}

export function useKeyboardShortcuts(scope: 'global' | 'orders' | 'owners' | 'vehicles' = 'global') {
  const router = useRouter();
  const { user, isAdmin } = useAuthStore();
  const { toggleSidebar, toggleTheme } = useUIStore();

  const shortcuts: KeyboardShortcut[] = [
    // Global shortcuts
    {
      key: 'k',
      ctrlKey: true,
      action: () => {
        // Open global search (placeholder)
        console.log('Open global search');
      },
      description: 'Abrir búsqueda global',
      scope: 'global'
    },
    {
      key: 'b',
      ctrlKey: true,
      action: toggleSidebar,
      description: 'Alternar barra lateral',
      scope: 'global'
    },
    {
      key: 't',
      ctrlKey: true,
      shiftKey: true,
      action: toggleTheme,
      description: 'Cambiar tema',
      scope: 'global'
    },
    {
      key: 'd',
      ctrlKey: true,
      altKey: true,
      action: () => router.push('/dashboard'),
      description: 'Ir al dashboard',
      scope: 'global'
    },
    {
      key: 'o',
      ctrlKey: true,
      altKey: true,
      action: () => router.push('/ordenes'),
      description: 'Ir a órdenes',
      scope: 'global'
    },
    {
      key: 'c',
      ctrlKey: true,
      altKey: true,
      action: () => router.push('/duenos'),
      description: 'Ir a clientes',
      scope: 'global'
    },
    {
      key: 'v',
      ctrlKey: true,
      altKey: true,
      action: () => router.push('/vehiculos'),
      description: 'Ir a vehículos',
      scope: 'global'
    },
    {
      key: 'w',
      ctrlKey: true,
      altKey: true,
      action: () => router.push('/notificaciones/whatsapp'),
      description: 'Ir a WhatsApp',
      scope: 'global'
    },
    {
      key: 's',
      ctrlKey: true,
      altKey: true,
      action: () => {
        if (isAdmin()) {
          router.push('/configuracion');
        }
      },
      description: 'Ir a configuración (solo admin)',
      scope: 'global'
    },
    // Orders shortcuts
    {
      key: 'n',
      ctrlKey: true,
      action: () => router.push('/ordenes/nueva'),
      description: 'Nueva orden',
      scope: 'orders'
    },
    {
      key: 'f',
      ctrlKey: true,
      action: () => {
        const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      },
      description: 'Enfocar búsqueda',
      scope: 'orders'
    },
    // Owners shortcuts
    {
      key: 'n',
      ctrlKey: true,
      action: () => router.push('/duenos/nuevo'),
      description: 'Nuevo cliente',
      scope: 'owners'
    },
    // Vehicles shortcuts
    {
      key: 'n',
      ctrlKey: true,
      action: () => router.push('/vehiculos/nuevo'),
      description: 'Nuevo vehículo',
      scope: 'vehicles'
    }
  ];

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement ||
      (event.target as HTMLElement)?.contentEditable === 'true'
    ) {
      return;
    }

    const activeShortcuts = shortcuts.filter(shortcut => 
      shortcut.scope === 'global' || shortcut.scope === scope
    );

    for (const shortcut of activeShortcuts) {
      if (
        event.key.toLowerCase() === shortcut.key.toLowerCase() &&
        !!event.ctrlKey === !!shortcut.ctrlKey &&
        !!event.altKey === !!shortcut.altKey &&
        !!event.shiftKey === !!shortcut.shiftKey
      ) {
        event.preventDefault();
        shortcut.action();
        break;
      }
    }
  }, [shortcuts, scope, router, toggleSidebar, toggleTheme, isAdmin]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const getShortcutsForScope = useCallback((targetScope?: string) => {
    return shortcuts.filter(shortcut => 
      shortcut.scope === 'global' || shortcut.scope === (targetScope || scope)
    );
  }, [shortcuts, scope]);

  return {
    shortcuts: getShortcutsForScope(),
    getShortcutsForScope
  };
}
