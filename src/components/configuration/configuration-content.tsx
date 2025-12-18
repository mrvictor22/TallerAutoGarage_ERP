'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { configApi, usersApi } from '@/services/api';
import { WorkshopConfig, User } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { DataTable } from '@/components/tables/data-table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDate } from '@/lib/utils';
import {
  Settings,
  Users,
  Building,
  Save,
  Plus,
  Edit,
  Trash2,
  Eye,
  Shield,
  Mail,
  Phone,
  MapPin,
  Clock,
  DollarSign,
  Palette,
  Bell,
  Database
} from 'lucide-react';
import { toast } from 'sonner';
import { ColumnDef } from '@tanstack/react-table';

export function ConfigurationContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('taller');
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditingUser, setIsEditingUser] = useState(false);

  // Fetch workshop config
  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ['workshop-config'],
    queryFn: () => configApi.getWorkshopConfig()
  });

  // Fetch users
  const { data: usersResponse, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getUsers()
  });

  const users = usersResponse?.data || [];

  // User columns
  const userColumns: ColumnDef<User>[] = [
    {
      accessorKey: 'name',
      header: 'Usuario',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium">
                {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </span>
            </div>
            <div>
              <div className="font-medium">{user.name}</div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'role',
      header: 'Rol',
      cell: ({ row }) => {
        const role = row.getValue('role') as string;
        return (
          <Badge 
            variant={
              role === 'admin' ? 'default' :
              role === 'reception' ? 'secondary' : 'outline'
            }
          >
            {role === 'admin' && 'Administrador'}
            {role === 'reception' && 'Recepción'}
            {role === 'technician' && 'Técnico'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Estado',
      cell: ({ row }) => {
        const isActive = row.getValue('isActive') as boolean;
        return (
          <Badge variant={isActive ? 'default' : 'secondary'}>
            {isActive ? 'Activo' : 'Inactivo'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'lastLogin',
      header: 'Último Acceso',
      cell: ({ row }) => {
        const lastLogin = row.getValue('lastLogin') as string;
        return lastLogin ? (
          <span className="text-sm">{formatDate(lastLogin)}</span>
        ) : (
          <span className="text-sm text-muted-foreground">Nunca</span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewUser(user)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEditUser(user)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setIsEditingUser(false);
    setIsUserDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditingUser(true);
    setIsUserDialogOpen(true);
  };

  const handleNewUser = () => {
    setSelectedUser({
      id: `user_${Date.now()}`,
      name: '',
      email: '',
      role: 'technician',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    setIsEditingUser(true);
    setIsUserDialogOpen(true);
  };

  const handleSaveUser = () => {
    if (selectedUser) {
      // Simulate save
      toast.success('Usuario guardado exitosamente');
      setIsUserDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  };

  const handleSaveConfig = () => {
    // Simulate save
    toast.success('Configuración guardada exitosamente');
    queryClient.invalidateQueries({ queryKey: ['workshop-config'] });
  };

  if (configLoading) {
    return <div>Cargando configuración...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
          <p className="text-muted-foreground">
            Gestiona la configuración del taller y usuarios del sistema
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="taller">
            <Building className="mr-2 h-4 w-4" />
            Taller
          </TabsTrigger>
          <TabsTrigger value="usuarios">
            <Users className="mr-2 h-4 w-4" />
            Usuarios ({users.length})
          </TabsTrigger>
          <TabsTrigger value="notificaciones">
            <Bell className="mr-2 h-4 w-4" />
            Notificaciones
          </TabsTrigger>
          <TabsTrigger value="sistema">
            <Database className="mr-2 h-4 w-4" />
            Sistema
          </TabsTrigger>
        </TabsList>

        <TabsContent value="taller" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Información Básica</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="workshop-name">Nombre del Taller</Label>
                  <Input
                    id="workshop-name"
                    defaultValue={config?.name || ''}
                    placeholder="Nombre del taller"
                  />
                </div>
                <div>
                  <Label htmlFor="workshop-address">Dirección</Label>
                  <Textarea
                    id="workshop-address"
                    defaultValue={config?.address || ''}
                    placeholder="Dirección completa del taller"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="workshop-phone">Teléfono</Label>
                    <Input
                      id="workshop-phone"
                      defaultValue={config?.phone || ''}
                      placeholder="(503) 1234-5678"
                    />
                  </div>
                  <div>
                    <Label htmlFor="workshop-email">Email</Label>
                    <Input
                      id="workshop-email"
                      type="email"
                      defaultValue={config?.email || ''}
                      placeholder="contacto@taller.com"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Business Hours */}
            <Card>
              <CardHeader>
                <CardTitle>Horarios de Atención</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="open-time">Hora de Apertura</Label>
                    <Input
                      id="open-time"
                      type="time"
                      defaultValue={config?.businessHours?.open || '08:00'}
                    />
                  </div>
                  <div>
                    <Label htmlFor="close-time">Hora de Cierre</Label>
                    <Input
                      id="close-time"
                      type="time"
                      defaultValue={config?.businessHours?.close || '17:00'}
                    />
                  </div>
                </div>
                <div>
                  <Label>Días de Trabajo</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((day, index) => (
                      <div key={day} className="flex items-center space-x-2">
                        <Switch
                          id={`day-${index}`}
                          defaultChecked={config?.businessHours?.workingDays?.includes(index) ?? index < 6}
                        />
                        <Label htmlFor={`day-${index}`} className="text-sm">
                          {day}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tax Information */}
            <Card>
              <CardHeader>
                <CardTitle>Información Fiscal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="tax-id">NIT/RUC</Label>
                  <Input
                    id="tax-id"
                    defaultValue={config?.taxId || ''}
                    placeholder="1234567890123"
                  />
                </div>
                <div>
                  <Label htmlFor="tax-regime">Régimen Fiscal</Label>
                  <Select defaultValue={config?.taxRegime || 'general'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">Régimen General</SelectItem>
                      <SelectItem value="simplified">Régimen Simplificado</SelectItem>
                      <SelectItem value="small">Pequeño Contribuyente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="currency">Moneda</Label>
                  <Select defaultValue={config?.currency || 'USD'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">Dólar Estadounidense (USD)</SelectItem>
                      <SelectItem value="SVC">Colón Salvadoreño (SVC)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* WhatsApp Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Configuración WhatsApp</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="whatsapp-enabled"
                    defaultChecked={config?.whatsapp?.enabled ?? true}
                  />
                  <Label htmlFor="whatsapp-enabled">
                    Habilitar notificaciones WhatsApp
                  </Label>
                </div>
                <div>
                  <Label htmlFor="whatsapp-number">Número WhatsApp Business</Label>
                  <Input
                    id="whatsapp-number"
                    defaultValue={config?.whatsapp?.businessNumber || ''}
                    placeholder="(503) 1234-5678"
                  />
                </div>
                <div>
                  <Label htmlFor="whatsapp-token">Token de API</Label>
                  <Input
                    id="whatsapp-token"
                    type="password"
                    defaultValue={config?.whatsapp?.apiToken || ''}
                    placeholder="Token de WhatsApp Business API"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveConfig}>
              <Save className="mr-2 h-4 w-4" />
              Guardar Configuración
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="usuarios" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Gestión de Usuarios</h3>
            <Button onClick={handleNewUser}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Usuario
            </Button>
          </div>
          
          <DataTable
            columns={userColumns}
            data={users}
            searchKey="name"
            searchPlaceholder="Buscar usuarios..."
          />
        </TabsContent>

        <TabsContent value="notificaciones" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Notificaciones por Email</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch id="email-notifications" defaultChecked={true} />
                  <Label htmlFor="email-notifications">
                    Habilitar notificaciones por email
                  </Label>
                </div>
                <div>
                  <Label htmlFor="smtp-server">Servidor SMTP</Label>
                  <Input
                    id="smtp-server"
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="smtp-port">Puerto</Label>
                    <Input
                      id="smtp-port"
                      placeholder="587"
                    />
                  </div>
                  <div>
                    <Label htmlFor="smtp-security">Seguridad</Label>
                    <Select defaultValue="tls">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Ninguna</SelectItem>
                        <SelectItem value="tls">TLS</SelectItem>
                        <SelectItem value="ssl">SSL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configuración de Recordatorios</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch id="auto-reminders" defaultChecked={true} />
                  <Label htmlFor="auto-reminders">
                    Recordatorios automáticos
                  </Label>
                </div>
                <div>
                  <Label htmlFor="reminder-days">Días antes del servicio</Label>
                  <Input
                    id="reminder-days"
                    type="number"
                    defaultValue="1"
                    min="1"
                    max="30"
                  />
                </div>
                <div>
                  <Label htmlFor="reminder-time">Hora de envío</Label>
                  <Input
                    id="reminder-time"
                    type="time"
                    defaultValue="09:00"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sistema" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuración General</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="app-name">Nombre de la Aplicación</Label>
                  <Input
                    id="app-name"
                    defaultValue="Garage Management"
                  />
                </div>
                <div>
                  <Label htmlFor="timezone">Zona Horaria</Label>
                  <Select defaultValue="America/El_Salvador">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/El_Salvador">El Salvador (GMT-6)</SelectItem>
                      <SelectItem value="America/Guatemala">Guatemala (GMT-6)</SelectItem>
                      <SelectItem value="America/Tegucigalpa">Honduras (GMT-6)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="date-format">Formato de Fecha</Label>
                  <Select defaultValue="dd/mm/yyyy">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dd/mm/yyyy">DD/MM/YYYY</SelectItem>
                      <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                      <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Respaldo y Mantenimiento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch id="auto-backup" defaultChecked={true} />
                  <Label htmlFor="auto-backup">
                    Respaldo automático diario
                  </Label>
                </div>
                <div>
                  <Label htmlFor="backup-time">Hora de respaldo</Label>
                  <Input
                    id="backup-time"
                    type="time"
                    defaultValue="02:00"
                  />
                </div>
                <div>
                  <Label htmlFor="retention-days">Días de retención</Label>
                  <Input
                    id="retention-days"
                    type="number"
                    defaultValue="30"
                    min="7"
                    max="365"
                  />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Button variant="outline" className="w-full">
                    <Database className="mr-2 h-4 w-4" />
                    Crear Respaldo Manual
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Database className="mr-2 h-4 w-4" />
                    Restaurar desde Respaldo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* User Dialog */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditingUser 
                ? (selectedUser?.name ? 'Editar Usuario' : 'Nuevo Usuario')
                : 'Detalles del Usuario'
              }
            </DialogTitle>
            <DialogDescription>
              {isEditingUser 
                ? 'Configura la información y permisos del usuario'
                : 'Información del usuario del sistema'
              }
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="user-name">Nombre Completo</Label>
                <Input
                  id="user-name"
                  value={selectedUser.name}
                  onChange={(e) => setSelectedUser({
                    ...selectedUser,
                    name: e.target.value
                  })}
                  disabled={!isEditingUser}
                />
              </div>
              <div>
                <Label htmlFor="user-email">Email</Label>
                <Input
                  id="user-email"
                  type="email"
                  value={selectedUser.email}
                  onChange={(e) => setSelectedUser({
                    ...selectedUser,
                    email: e.target.value
                  })}
                  disabled={!isEditingUser}
                />
              </div>
              <div>
                <Label htmlFor="user-role">Rol</Label>
                <Select
                  value={selectedUser.role}
                  onValueChange={(value) => setSelectedUser({
                    ...selectedUser,
                    role: value as any
                  })}
                  disabled={!isEditingUser}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="reception">Recepción</SelectItem>
                    <SelectItem value="technician">Técnico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {isEditingUser && (
                <div className="flex items-center space-x-2">
                  <Switch
                    id="user-active"
                    checked={selectedUser.isActive}
                    onCheckedChange={(checked) => setSelectedUser({
                      ...selectedUser,
                      isActive: checked
                    })}
                  />
                  <Label htmlFor="user-active">Usuario activo</Label>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUserDialogOpen(false)}>
              Cancelar
            </Button>
            {isEditingUser && (
              <Button onClick={handleSaveUser}>
                Guardar Usuario
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
