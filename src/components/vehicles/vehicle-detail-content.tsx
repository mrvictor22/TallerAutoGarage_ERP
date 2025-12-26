'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { vehiclesApi, ordersApi } from '@/services/supabase-api';
import { VehicleWithRelations, Order } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTable } from '@/components/tables/data-table';
import { formatDate, getStatusColor } from '@/lib/utils';
import {
  ArrowLeft,
  Edit,
  Phone,
  Mail,
  MapPin,
  Car,
  User,
  FileText,
  Calendar,
  Gauge,
  ExternalLink,
  Plus,
  Eye,
  Wrench,
  Settings,
  History
} from 'lucide-react';
import { toast } from 'sonner';
import { ColumnDef } from '@tanstack/react-table';

interface VehicleDetailContentProps {
  vehicleId: string;
  defaultTab?: string;
}

export function VehicleDetailContent({ vehicleId, defaultTab = 'resumen' }: VehicleDetailContentProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Fetch vehicle details
  const { data: vehicleResponse, isLoading: vehicleLoading, error } = useQuery({
    queryKey: ['vehicle', vehicleId],
    queryFn: async () => {
      const response = await vehiclesApi.getVehicle(vehicleId);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch vehicle');
      }
      return response.data;
    }
  });

  // Fetch vehicle's orders
  const { data: ordersResponse, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders', { vehicle_id: vehicleId }],
    queryFn: async () => {
      const response = await ordersApi.getOrders({ vehicle_id: vehicleId }, 1, 50);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch orders');
      }
      return response.data;
    },
    enabled: !!vehicleId
  });

  const vehicle = vehicleResponse;
  const orders = ordersResponse?.data || [];

  // Order columns for table
  const orderColumns: ColumnDef<Order>[] = [
    {
      accessorKey: 'folio',
      header: 'Número',
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('folio')}</div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return (
          <Badge
            variant="outline"
            className={getStatusColor(status)}
          >
            {status === 'new' && 'Nueva'}
            {status === 'diagnosis' && 'Diagnóstico'}
            {status === 'waiting_approval' && 'Esperando Aprobación'}
            {status === 'approved' && 'Aprobada'}
            {status === 'in_progress' && 'En Progreso'}
            {status === 'waiting_parts' && 'Esperando Refacciones'}
            {status === 'quality_check' && 'Control de Calidad'}
            {status === 'ready' && 'Lista'}
            {status === 'delivered' && 'Entregada'}
            {status === 'cancelled' && 'Cancelada'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'reason',
      header: 'Descripción',
      cell: ({ row }) => {
        const description = row.getValue('reason') as string;
        return (
          <div className="max-w-xs truncate" title={description}>
            {description}
          </div>
        );
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Fecha',
      cell: ({ row }) => {
        const date = row.getValue('created_at') as string;
        return <span>{formatDate(date)}</span>;
      },
    },
    {
      accessorKey: 'total',
      header: 'Total',
      cell: ({ row }) => {
        const total = row.getValue('total') as number;
        return <span>${total?.toFixed(2)}</span>;
      },
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => {
        const order = row.original;
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/es/ordenes/${order.id}`)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        );
      },
    },
  ];

  const handleBack = () => {
    router.push('/es/vehiculos');
  };

  const handleEdit = () => {
    router.push(`/es/vehiculos/${vehicleId}/editar`);
  };

  const handleNewOrder = () => {
    router.push(`/es/ordenes/nueva?vehicleId=${vehicleId}`);
  };

  const handleViewOwner = () => {
    if (vehicle?.owner) {
      router.push(`/es/duenos/${vehicle.owner.id}`);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">Error al cargar vehículo</h3>
          <p className="text-muted-foreground mb-4">
            No se pudo cargar la información del vehículo
          </p>
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a la lista
          </Button>
        </div>
      </div>
    );
  }

  if (vehicleLoading) {
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

  if (!vehicle) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">Vehículo no encontrado</h3>
          <p className="text-muted-foreground mb-4">
            El vehículo que buscas no existe o ha sido eliminado
          </p>
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a la lista
          </Button>
        </div>
      </div>
    );
  }

  const activeOrders = orders.filter(o => ['new', 'diagnosis', 'waiting_approval', 'approved', 'in_progress', 'waiting_parts', 'quality_check', 'ready'].includes(o.status));
  const completedOrders = orders.filter(o => o.status === 'delivered');
  const lastService = completedOrders.sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <Car className="h-8 w-8 text-muted-foreground" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {vehicle.brand} {vehicle.model}
              </h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>{vehicle.plate}</span>
                <span>•</span>
                <span>{vehicle.year}</span>
                {vehicle.color && (
                  <>
                    <span>•</span>
                    <Badge variant="outline">{vehicle.color}</Badge>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleNewOrder}>
            <Wrench className="mr-2 h-4 w-4" />
            Nueva Orden
          </Button>
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
              <Gauge className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Kilometraje</p>
                <p className="text-2xl font-bold">{vehicle.mileage ? vehicle.mileage.toLocaleString() : 'N/A'} km</p>
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
                <p className="text-2xl font-bold">{activeOrders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Último Servicio</p>
                <p className="text-sm font-bold">
                  {lastService ? formatDate(lastService.created_at) : 'N/A'}
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
          <TabsTrigger value="ordenes">
            Órdenes ({orders.length})
          </TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Vehicle Information */}
            <Card>
              <CardHeader>
                <CardTitle>Información del Vehículo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Marca</p>
                    <p>{vehicle.brand}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Modelo</p>
                    <p>{vehicle.model}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Año</p>
                    <p>{vehicle.year}</p>
                  </div>
                  {vehicle.color && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Color</p>
                      <p>{vehicle.color}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Placa</p>
                    <p className="font-medium">{vehicle.plate}</p>
                  </div>
                  {vehicle.vin && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">VIN</p>
                      <p className="font-mono text-sm">{vehicle.vin}</p>
                    </div>
                  )}
                  {vehicle.engine && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Motor</p>
                      <p className="text-sm">{vehicle.engine}</p>
                    </div>
                  )}
                  {vehicle.transmission && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Transmisión</p>
                      <p className="text-sm">{vehicle.transmission}</p>
                    </div>
                  )}
                  {vehicle.fuel_type && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Combustible</p>
                      <p className="text-sm">{vehicle.fuel_type}</p>
                    </div>
                  )}
                  {vehicle.mileage && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Kilometraje</p>
                      <p className="text-sm">{vehicle.mileage.toLocaleString()} km</p>
                    </div>
                  )}
                  {vehicle.last_service_date && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Último Servicio</p>
                      <p className="text-sm">{formatDate(vehicle.last_service_date)}</p>
                    </div>
                  )}
                </div>
                {vehicle.notes && (
                  <div className="pt-2">
                    <p className="text-sm font-medium mb-2">Notas</p>
                    <p className="text-sm text-muted-foreground">{vehicle.notes}</p>
                  </div>
                )}
                <Separator />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Registrado:</span>
                    <span>{formatDate(vehicle.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Última actualización:</span>
                    <span>{formatDate(vehicle.updated_at)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Owner Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Propietario</CardTitle>
                  <Button variant="outline" size="sm" onClick={handleViewOwner}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Ver Perfil
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{vehicle.owner.name}</p>
                    <Badge variant={vehicle.owner.type === 'company' ? 'default' : 'secondary'}>
                      {vehicle.owner.type === 'company' ? 'Empresa' : 'Persona'}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p>{vehicle.owner.phone}</p>
                      {vehicle.owner.whatsapp_consent && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          WhatsApp habilitado
                        </Badge>
                      )}
                    </div>
                  </div>
                  {vehicle.owner.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <p>{vehicle.owner.email}</p>
                    </div>
                  )}
                  {vehicle.owner.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <p className="text-sm">{vehicle.owner.address}</p>
                    </div>
                  )}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {orders.slice(0, 4).map((order) => (
                    <Card key={order.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/es/ordenes/${order.id}`)}>
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="font-semibold">{order.folio}</div>
                            <Badge
                              variant="outline"
                              className={getStatusColor(order.status)}
                            >
                              {order.status === 'new' && 'Nueva'}
                              {order.status === 'diagnosis' && 'Diagnóstico'}
                              {order.status === 'waiting_approval' && 'Esperando Aprobación'}
                              {order.status === 'approved' && 'Aprobada'}
                              {order.status === 'in_progress' && 'En Progreso'}
                              {order.status === 'waiting_parts' && 'Esperando Refacciones'}
                              {order.status === 'quality_check' && 'Control de Calidad'}
                              {order.status === 'ready' && 'Lista'}
                              {order.status === 'delivered' && 'Entregada'}
                              {order.status === 'cancelled' && 'Cancelada'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {order.reason}
                          </p>
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(order.created_at)}</span>
                            </div>
                            <div className="font-medium">
                              ${order.total?.toFixed(2) || '0.00'}
                            </div>
                          </div>
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

        <TabsContent value="ordenes" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Órdenes de Trabajo</h3>
            <Button onClick={handleNewOrder}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Orden
            </Button>
          </div>

          {orders.length > 0 ? (
            <DataTable
              columns={orderColumns}
              data={orders}
              searchKey="folio"
              searchPlaceholder="Buscar por número de orden..."
            />
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">No hay órdenes registradas</h3>
                <p className="text-muted-foreground mb-4">
                  Crea la primera orden de trabajo para este vehículo
                </p>
                <Button onClick={handleNewOrder}>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Orden
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="historial" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Historial de Servicios</h3>
          </div>

          {completedOrders.length > 0 ? (
            <div className="space-y-4">
              {completedOrders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Completada
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(order.created_at)}
                          </span>
                        </div>
                        <h4 className="font-medium">{order.folio}</h4>
                        <p className="text-sm text-muted-foreground">{order.reason}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${order.total?.toFixed(2)}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/es/ordenes/${order.id}`)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Detalles
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">Sin historial de servicios</h3>
                <p className="text-muted-foreground mb-4">
                  Este vehículo no tiene servicios completados aún
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
