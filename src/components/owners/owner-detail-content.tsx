'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ownersApi, vehiclesApi, ordersApi } from '@/services/supabase-api';
import { OwnerWithRelations, Order, Vehicle } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTable } from '@/components/tables/data-table';
import { formatPhone, formatDate, getStatusColor } from '@/lib/utils';
import {
  ArrowLeft,
  Edit,
  Phone,
  Mail,
  MapPin,
  Building,
  User,
  Car,
  FileText,
  Calendar,
  Tag,
  ExternalLink,
  Plus,
  Eye,
  Wrench
} from 'lucide-react';
import { toast } from 'sonner';
import { ColumnDef } from '@tanstack/react-table';

interface OwnerDetailContentProps {
  ownerId: string;
  defaultTab?: string;
}

export function OwnerDetailContent({ ownerId, defaultTab = 'resumen' }: OwnerDetailContentProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Fetch owner details
  const { data: ownerResponse, isLoading: ownerLoading, error } = useQuery({
    queryKey: ['owner', ownerId],
    queryFn: () => ownersApi.getOwner(ownerId)
  });

  // Fetch owner's orders
  const { data: ordersResponse, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders', { owner_id: ownerId }],
    queryFn: () => ordersApi.getOrdersByOwner(ownerId),
    enabled: !!ownerId
  });

  // Fetch owner's vehicles
  const { data: vehiclesResponse, isLoading: vehiclesLoading } = useQuery({
    queryKey: ['vehicles', { owner_id: ownerId }],
    queryFn: () => vehiclesApi.getVehiclesByOwner(ownerId),
    enabled: !!ownerId
  });

  const owner = ownerResponse?.success ? ownerResponse.data : undefined;
  const orders = ordersResponse?.success ? ordersResponse.data || [] : [];
  const vehicles = vehiclesResponse?.success ? vehiclesResponse.data || [] : [];

  // Vehicle columns for table
  const vehicleColumns: ColumnDef<Vehicle>[] = [
    {
      accessorKey: 'plate',
      header: 'Placa',
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('plate')}</div>
      ),
    },
    {
      accessorKey: 'brand',
      header: 'Marca/Modelo',
      cell: ({ row }) => {
        const vehicle = row.original;
        return (
          <div>
            <div className="font-medium">{vehicle.brand} {vehicle.model}</div>
            <div className="text-sm text-muted-foreground">{vehicle.year}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'color',
      header: 'Color',
      cell: ({ row }) => (
        <Badge variant="outline">{row.getValue('color')}</Badge>
      ),
    },
    {
      accessorKey: 'mileage',
      header: 'Kilometraje',
      cell: ({ row }) => {
        const mileage = row.getValue('mileage') as number;
        return <span>{mileage?.toLocaleString()} km</span>;
      },
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => {
        const vehicle = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/es/vehiculos/${vehicle.id}`)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/es/ordenes/nueva?vehicleId=${vehicle.id}`)}
            >
              <Wrench className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const handleBack = () => {
    router.push('/es/duenos');
  };

  const handleEdit = () => {
    router.push(`/es/duenos/${ownerId}/editar`);
  };

  const handleNewOrder = () => {
    router.push(`/es/ordenes/nueva?ownerId=${ownerId}`);
  };

  const handleNewVehicle = () => {
    router.push(`/es/vehiculos/nuevo?ownerId=${ownerId}`);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">Error al cargar cliente</h3>
          <p className="text-muted-foreground mb-4">
            No se pudo cargar la información del cliente
          </p>
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a la lista
          </Button>
        </div>
      </div>
    );
  }

  if (ownerLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (!owner) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">Cliente no encontrado</h3>
          <p className="text-muted-foreground mb-4">
            El cliente que buscas no existe o ha sido eliminado
          </p>
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a la lista
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {owner.type === 'company' ? (
                <Building className="h-8 w-8 text-muted-foreground" />
              ) : (
                <User className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{owner.name}</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Badge variant={owner.type === 'company' ? 'default' : 'secondary'}>
                  {owner.type === 'company' ? 'Empresa' : 'Persona'}
                </Badge>
                {owner.tax_id && <span>• {owner.tax_id}</span>}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Car className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Vehículos</p>
                <p className="text-2xl font-bold">{vehicles.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Órdenes</p>
                <p className="text-2xl font-bold">{orders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Wrench className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Activas</p>
                <p className="text-2xl font-bold">
                  {orders.filter(o => ['new', 'diagnosis', 'waiting_approval', 'approved', 'in_progress', 'waiting_parts', 'quality_check'].includes(o.status)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Última Orden</p>
                <p className="text-sm font-bold">
                  {orders.length > 0
                    ? formatDate(new Date(Math.max(...orders.map(o => new Date(o.created_at).getTime()))))
                    : 'N/A'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="vehiculos">
            Vehículos ({vehicles.length})
          </TabsTrigger>
          <TabsTrigger value="ordenes">
            Órdenes ({orders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Información de Contacto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{formatPhone(owner.phone)}</p>
                    {owner.whatsapp_consent && (
                      <Badge variant="secondary" className="text-xs mt-1">
                        WhatsApp habilitado
                      </Badge>
                    )}
                  </div>
                </div>
                {owner.phone_secondary && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Secundario</p>
                      <p className="font-medium">{formatPhone(owner.phone_secondary)}</p>
                    </div>
                  </div>
                )}
                {owner.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <p>{owner.email}</p>
                  </div>
                )}
                {owner.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="text-sm">
                      <p>{owner.address}</p>
                      {(owner.city || owner.state || owner.postal_code) && (
                        <p className="text-muted-foreground">
                          {[owner.city, owner.state, owner.postal_code].filter(Boolean).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {owner.type === 'company' && owner.company_name && (
                  <div className="pt-2">
                    <p className="text-sm font-medium mb-1">Empresa</p>
                    <p className="text-sm">{owner.company_name}</p>
                    {owner.contact_person && (
                      <p className="text-sm text-muted-foreground">Contacto: {owner.contact_person}</p>
                    )}
                  </div>
                )}
                {owner.notes && (
                  <div className="pt-2">
                    <p className="text-sm font-medium mb-2">Notas</p>
                    <p className="text-sm text-muted-foreground">{owner.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tags and Metadata */}
            <Card>
              <CardHeader>
                <CardTitle>Información Adicional</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {owner.tags && owner.tags.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Etiquetas
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {owner.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <Separator />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total gastado:</span>
                    <span className="font-medium">${owner.total_spent?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total órdenes:</span>
                    <span className="font-medium">{owner.total_orders || 0}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cliente desde:</span>
                    <span>{formatDate(owner.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Última actualización:</span>
                    <span>{formatDate(owner.updated_at)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Órdenes Recientes</CardTitle>
                <Button variant="outline" size="sm" onClick={handleNewOrder}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Orden
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {orders.length > 0 ? (
                <div className="space-y-3">
                  {orders.slice(0, 4).map((order) => (
                    <Card key={order.id} className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => router.push(`/es/ordenes/${order.id}`)}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{order.folio}</span>
                              <Badge className={getStatusColor(order.status)}>
                                {order.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {order.reason}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(order.entry_date)}
                              </span>
                              <span>${order.total.toFixed(2)}</span>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground mb-4">No hay órdenes registradas</p>
                  <Button onClick={handleNewOrder}>
                    <Plus className="mr-2 h-4 w-4" />
                    Crear Primera Orden
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vehiculos" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Vehículos del Cliente</h3>
            <Button onClick={handleNewVehicle}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Vehículo
            </Button>
          </div>

          {vehicles.length > 0 ? (
            <DataTable
              columns={vehicleColumns}
              data={vehicles}
              searchKey="plate"
              searchPlaceholder="Buscar por placa..."
            />
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Car className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">No hay vehículos registrados</h3>
                <p className="text-muted-foreground mb-4">
                  Agrega el primer vehículo de este cliente
                </p>
                <Button onClick={handleNewVehicle}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Vehículo
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="ordenes" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Historial de Órdenes</h3>
            <Button onClick={handleNewOrder}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Orden
            </Button>
          </div>

          {orders.length > 0 ? (
            <div className="space-y-3">
              {orders.map((order) => (
                <Card key={order.id} className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => router.push(`/es/ordenes/${order.id}`)}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{order.folio}</span>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {order.reason}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(order.entry_date)}
                          </span>
                          <span>${order.total.toFixed(2)}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">No hay órdenes registradas</h3>
                <p className="text-muted-foreground mb-4">
                  Crea la primera orden de trabajo para este cliente
                </p>
                <Button onClick={handleNewOrder}>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Orden
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
