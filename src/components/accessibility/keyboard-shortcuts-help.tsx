'use client';

import { useState } from 'react';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Keyboard, Command } from 'lucide-react';

interface KeyboardShortcutsHelpProps {
  scope?: 'global' | 'orders' | 'owners' | 'vehicles';
}

export function KeyboardShortcutsHelp({ scope = 'global' }: KeyboardShortcutsHelpProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { getShortcutsForScope } = useKeyboardShortcuts(scope);

  const globalShortcuts = getShortcutsForScope('global');
  const scopeShortcuts = getShortcutsForScope(scope).filter(s => s.scope !== 'global');

  const formatShortcut = (shortcut: any) => {
    const keys = [];
    if (shortcut.ctrlKey) keys.push('Ctrl');
    if (shortcut.altKey) keys.push('Alt');
    if (shortcut.shiftKey) keys.push('Shift');
    keys.push(shortcut.key.toUpperCase());
    return keys;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          title="Atajos de teclado (Ctrl + ?)"
        >
          <Keyboard className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Command className="h-5 w-5" />
            Atajos de Teclado
          </DialogTitle>
          <DialogDescription>
            Usa estos atajos para navegar más rápido por la aplicación
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Global shortcuts */}
          <div>
            <h3 className="text-sm font-medium mb-3">Atajos Globales</h3>
            <div className="space-y-2">
              {globalShortcuts.map((shortcut, index) => (
                <div key={index} className="flex items-center justify-between py-2">
                  <span className="text-sm">{shortcut.description}</span>
                  <div className="flex items-center gap-1">
                    {formatShortcut(shortcut).map((key, keyIndex) => (
                      <Badge key={keyIndex} variant="outline" className="text-xs font-mono">
                        {key}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scope-specific shortcuts */}
          {scopeShortcuts.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-medium mb-3">
                  Atajos de {scope === 'orders' ? 'Órdenes' : scope === 'owners' ? 'Clientes' : scope === 'vehicles' ? 'Vehículos' : 'Página'}
                </h3>
                <div className="space-y-2">
                  {scopeShortcuts.map((shortcut, index) => (
                    <div key={index} className="flex items-center justify-between py-2">
                      <span className="text-sm">{shortcut.description}</span>
                      <div className="flex items-center gap-1">
                        {formatShortcut(shortcut).map((key, keyIndex) => (
                          <Badge key={keyIndex} variant="outline" className="text-xs font-mono">
                            {key}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />
          
          <div className="text-xs text-muted-foreground">
            <p>💡 Los atajos no funcionan cuando estás escribiendo en campos de texto.</p>
            <p>🔍 Presiona <Badge variant="outline" className="text-xs font-mono mx-1">Ctrl</Badge> + <Badge variant="outline" className="text-xs font-mono mx-1">K</Badge> para abrir la búsqueda global.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
