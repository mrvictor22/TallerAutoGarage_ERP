'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth';
import { Sparkles, Wrench, User, Shield, Settings, ArrowRight } from 'lucide-react';
import { useWorkshopConfig } from '@/contexts/workshop-config';

const roleLabels: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  admin: { label: 'Administrador', icon: Shield, color: 'text-purple-500' },
  reception: { label: 'Recepción', icon: User, color: 'text-blue-500' },
  mechanic_lead: { label: 'Jefe de Mecánicos', icon: Settings, color: 'text-orange-500' },
  technician: { label: 'Técnico', icon: Wrench, color: 'text-green-500' },
};

export function WelcomeModal() {
  const { user, justLoggedIn, clearJustLoggedIn } = useAuthStore();
  const { config } = useWorkshopConfig();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (justLoggedIn && user) {
      setOpen(true);
    }
  }, [justLoggedIn, user]);

  const handleClose = () => {
    setOpen(false);
    clearJustLoggedIn();
  };

  if (!user) return null;

  const roleInfo = roleLabels[user.role] || roleLabels.technician;
  const RoleIcon = roleInfo.icon;
  const primaryColor = config?.primary_color || '#f97316';
  const secondaryColor = config?.secondary_color || '#ef4444';

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) handleClose();
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4">
            <div
              className="inline-flex items-center justify-center w-20 h-20 rounded-full shadow-lg animate-pulse"
              style={{
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                boxShadow: `0 10px 25px -5px ${primaryColor}40`
              }}
            >
              <Sparkles className="w-10 h-10 text-white" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold">
            ¡Bienvenido, {user.full_name?.split(' ')[0] || 'Usuario'}!
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            Has iniciado sesión correctamente en el sistema de gestión.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 p-4 rounded-lg bg-muted/50 border">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full bg-background ${roleInfo.color}`}>
              <RoleIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tu rol en el sistema</p>
              <p className="font-semibold">{roleInfo.label}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          <p>
            {user.role === 'admin' && 'Tienes acceso completo a todas las funcionalidades del sistema.'}
            {user.role === 'reception' && 'Puedes gestionar órdenes, clientes y vehículos.'}
            {user.role === 'mechanic_lead' && 'Puedes supervisar órdenes y asignar técnicos.'}
            {user.role === 'technician' && 'Puedes ver y actualizar las órdenes asignadas.'}
          </p>
        </div>

        <div className="mt-6">
          <Button
            onClick={handleClose}
            className="w-full"
            style={{
              background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`,
            }}
          >
            Comenzar
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
