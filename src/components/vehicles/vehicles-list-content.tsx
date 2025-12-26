'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { vehiclesApi, VehicleFilters } from '@/services/supabase-api';
import { VehicleWithRelations } from '@/types/database';
import { DataTable } from '@/components/tables/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  Filter,
  Download,
  MoreHorizontal,
  Eye,
  Edit,
  Wrench,
  Car,
  User,
  Calendar,
  Gauge,
  X,
  Search,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

export function VehiclesListContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<VehicleFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<VehicleWithRelations | null>(null);

  // Fetch vehicles
  const { data: vehiclesResponse, isLoading, error } = useQuery({
    queryKey: ['vehicles', filters],
    queryFn: () => vehiclesApi.getVehicles(filters, 1, 50)
  });

  const vehicles = vehiclesResponse?.success ? vehiclesResponse.data?.data || [] : [];

  // Show error toast if there's an error
  if (error || (vehiclesResponse && !vehiclesResponse.success)) {
    const errorMessage = vehiclesResponse?.error || 'Error al cargar vehículos';
    toast.error(errorMessage);
  }

  // Table columns
  const columns: ColumnDef<VehicleWithRelations>[] = [
    {
      accessorKey: 'plate',
      header: 'Placa',
      cell: ({ row }) => {
        const vehicle = row.original;
        return (
          <div className="flex items-center gap-2">
            <Car className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">{vehicle.plate}</div>
              <div className="text-sm text-muted-foreground">{vehicle.vin}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'brand',
      header: 'Vehículo',
      cell: ({ row }) => {
        const vehicle = row.original;
        return (
          <div>
            <div className="font-medium">{vehicle.brand} {vehicle.model}</div>
            <div className="text-sm text-muted-foreground">
              {vehicle.year} • {vehicle.color}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'owner',
      header: 'Propietario',
      cell: ({ row }) => {
        const owner = row.original.owner;
        if (!owner) {
          return <span className="text-muted-foreground">Sin propietario</span>;
        }
        return (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">{owner.name}</div>
              <div className="text-sm text-muted-foreground">{owner.phone}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'mileage',
      header: 'Kilometraje',
      cell: ({ row }) => {
        const mileage = row.getValue('mileage') as number;
        return (
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-muted-foreground" />
            <span>{mileage ? mileage.toLocaleString() : 'N/A'} km</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'orders',
      header: 'Órdenes',
      cell: ({ row }) => {
        const orders = row.original.orders || [];
        const activeOrders = orders.filter(o => ['new', 'diagnosis', 'waiting_approval', 'approved', 'in_progress', 'waiting_parts', 'quality_check'].includes(o.status));
        return (
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{orders.length}</span>
            {activeOrders.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeOrders.length} activa{activeOrders.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'lastService',
      header: 'Último Servicio',
      cell: ({ row }) => {
        const vehicle = row.original;
        const lastServiceDate = vehicle.last_service_date;

        return (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {lastServiceDate
                ? new Date(lastServiceDate).toLocaleDateString('es-SV')
                : 'Sin servicios'
              }
            </span>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => {
        const vehicle = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleViewVehicle(vehicle)}>
                <Eye className="mr-2 h-4 w-4" />
                Ver Detalles
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEditVehicle(vehicle)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleNewOrder(vehicle)}>
                <Wrench className="mr-2 h-4 w-4" />
                Nueva Orden
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDeleteClick(vehicle)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const handleViewVehicle = (vehicle: VehicleWithRelations) => {
    router.push(`/es/vehiculos/${vehicle.id}`);
  };

  const handleEditVehicle = (vehicle: VehicleWithRelations) => {
    router.push(`/es/vehiculos/${vehicle.id}/editar`);
  };

  const handleNewOrder = (vehicle: VehicleWithRelations) => {
    router.push(`/es/ordenes/nueva?vehicleId=${vehicle.id}`);
  };

  const handleNewVehicle = () => {
    router.push('/es/vehiculos/nuevo');
  };

  const handleDeleteClick = (vehicle: VehicleWithRelations) => {
    setVehicleToDelete(vehicle);
  };

  const deleteVehicleMutation = useMutation({
    mutationFn: async (vehicleId: string) => {
      const response = await vehiclesApi.deleteVehicle(vehicleId);
      if (!response.success) {
        throw new Error(response.error || 'Error al eliminar vehículo');
      }
      return response;
    },
    onSuccess: () => {
      toast.success('Vehículo eliminado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setVehicleToDelete(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al eliminar vehículo');
    }
  });

  const handleConfirmDelete = async () => {
    if (vehicleToDelete) {
      await deleteVehicleMutation.mutateAsync(vehicleToDelete.id);
    }
  };

  const handleExport = (data: VehicleWithRelations[]) => {
    // Convert to CSV format
    const csvData = data.map(vehicle => ({
      'Placa': vehicle.plate,
      'Marca': vehicle.brand,
      'Modelo': vehicle.model,
      'Año': vehicle.year,
      'Color': vehicle.color || '',
      'VIN': vehicle.vin || '',
      'Kilometraje': vehicle.mileage || '',
      'Propietario': vehicle.owner?.name || '',
      'Teléfono': vehicle.owner?.phone || '',
      'Órdenes': vehicle.orders?.length || 0,
      'Última Actualización': new Date(vehicle.updated_at).toLocaleDateString('es-SV')
    }));

    // Simple CSV export
    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(v => `"${v}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vehiculos_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Archivo exportado exitosamente');
  };

  const updateFilter = (key: keyof VehicleFilters, value: unknown) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const hasActiveFilters = Object.values(filters).some(value =>
    value !== undefined && value !== '' && (!Array.isArray(value) || value.length > 0)
  );

  // Get unique brands and years for filters
  const allBrands = Array.from(new Set(vehicles.map(v => v.brand)));
  const allYears = Array.from(new Set(vehicles.map(v => v.year))).sort((a, b) => b - a);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vehículos</h1>
          <p className="text-muted-foreground">
            Gestiona el inventario de vehículos del taller
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="mr-2 h-4 w-4" />
            Filtros
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                {Object.values(filters).filter(v => v !== undefined && v !== '').length}
              </Badge>
            )}
          </Button>
          <Button onClick={handleNewVehicle}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Vehículo
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Filtros</CardTitle>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    <X className="mr-2 h-4 w-4" />
                    Limpiar
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Buscar</Label>
                <Input
                  id="search"
                  placeholder="Placa, marca, modelo..."
                  value={filters.search || ''}
                  onChange={(e) => updateFilter('search', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="brand">Marca</Label>
                <Select
                  value={filters.brand || '__all__'}
                  onValueChange={(value) => updateFilter('brand', value === '__all__' ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las marcas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todas las marcas</SelectItem>
                    {allBrands.map((brand) => (
                      <SelectItem key={brand} value={brand}>
                        {brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="year">Año</Label>
                <Select
                  value={filters.year?.toString() || '__all__'}
                  onValueChange={(value) => updateFilter('year', value === '__all__' ? undefined : parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los años" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todos los años</SelectItem>
                    {allYears.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="owner">Propietario</Label>
                <Input
                  id="owner"
                  placeholder="Nombre del propietario..."
                  value={filters.owner_id || ''}
                  onChange={(e) => updateFilter('owner_id', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Car className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Total Vehículos</p>
                <p className="text-2xl font-bold">{vehicles.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Wrench className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">En Servicio</p>
                <p className="text-2xl font-bold">
                  {vehicles.filter(v =>
                    v.orders?.some(o => ['new', 'diagnosis', 'waiting_approval', 'approved', 'in_progress', 'waiting_parts', 'quality_check'].includes(o.status))
                  ).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <User className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Propietarios</p>
                <p className="text-2xl font-bold">
                  {new Set(vehicles.map(v => v.owner_id)).size}
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
                <p className="text-sm font-medium text-muted-foreground">Marcas</p>
                <p className="text-2xl font-bold">{allBrands.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={vehicles}
        searchKey="plate"
        searchPlaceholder="Buscar por placa, marca o modelo..."
        onExport={handleExport}
        enableRowSelection={true}
      />

      {/* Empty state */}
      {vehicles.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Car className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">No hay vehículos</h3>
          <p className="text-muted-foreground mb-4">
            {hasActiveFilters
              ? 'No se encontraron vehículos con los filtros aplicados'
              : 'Comienza agregando el primer vehículo'
            }
          </p>
          {!hasActiveFilters && (
            <Button onClick={handleNewVehicle}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Vehículo
            </Button>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!vehicleToDelete} onOpenChange={() => setVehicleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar vehículo?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar el vehículo{' '}
              <span className="font-semibold">
                {vehicleToDelete?.brand} {vehicleToDelete?.model} ({vehicleToDelete?.plate})
              </span>
              ? Esta acción no se puede deshacer.
              {vehicleToDelete?.orders && vehicleToDelete.orders.length > 0 && (
                <span className="block mt-2 text-red-600 font-medium">
                  Advertencia: Este vehículo tiene {vehicleToDelete.orders.length}{' '}
                  {vehicleToDelete.orders.length === 1 ? 'orden asociada' : 'órdenes asociadas'}.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteVehicleMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteVehicleMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteVehicleMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
