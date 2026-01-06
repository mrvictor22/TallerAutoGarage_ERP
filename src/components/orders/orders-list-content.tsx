'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { ordersApi, OrderFilters } from '@/services/supabase-api';
import { OrderWithRelations, OrderStatus } from '@/types/database';
import { useAuthStore } from '@/stores/auth';
import { DataTable } from '@/components/tables/data-table';
import { OrderCard } from '@/components/cards/order-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Checkbox } from '@/components/ui/checkbox';
import { formatCurrency, formatDate, getOrderStatusColor, timeAgo } from '@/lib/utils';
import {
  Plus,
  Filter,
  Download,
  MoreHorizontal,
  Eye,
  Edit,
  MessageSquare,
  Calendar,
  User,
  Car,
  DollarSign,
  Grid3X3,
  List,
  Search,
  X,
  Archive,
  ArchiveRestore,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-is-mobile';

const orderStatuses: { value: OrderStatus; label: string }[] = [
  { value: 'new', label: 'Nuevo' },
  { value: 'diagnosis', label: 'Diagnóstico' },
  { value: 'waiting_approval', label: 'Esperando Aprobación' },
  { value: 'approved', label: 'Aprobado' },
  { value: 'in_progress', label: 'En Proceso' },
  { value: 'waiting_parts', label: 'Esperando Piezas' },
  { value: 'quality_check', label: 'Control de Calidad' },
  { value: 'ready', label: 'Listo' },
  { value: 'delivered', label: 'Entregado' },
  { value: 'cancelled', label: 'Cancelado' }
];

export function OrdersListContent() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuthStore();
  const [view, setView] = useState<'table' | 'cards'>('table');
  const [filters, setFilters] = useState<OrderFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<OrderWithRelations | null>(null);

  // Permission checks
  const canArchive = hasPermission('orders', 'archive');
  const canDelete = hasPermission('orders', 'delete');

  // Auto-switch to cards view on mobile
  useEffect(() => {
    if (isMobile) {
      setView('cards');
    }
  }, [isMobile]);

  // Fetch orders
  const { data: ordersResponse, isLoading, refetch } = useQuery({
    queryKey: ['orders', filters],
    queryFn: async () => {
      const response = await ordersApi.getOrders(filters, 1, 50);
      if (!response.success) {
        toast.error(response.error || 'Error al cargar las órdenes');
        return null;
      }
      return response.data;
    }
  });

  const orders = ordersResponse?.data || [];

  // Archive mutation
  const archiveMutation = useMutation({
    mutationFn: (id: string) => ordersApi.archiveOrder(id),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || 'Orden archivada');
        queryClient.invalidateQueries({ queryKey: ['orders'] });
      } else {
        toast.error(response.error || 'Error al archivar');
      }
    },
    onError: () => toast.error('Error al archivar la orden')
  });

  // Restore mutation
  const restoreMutation = useMutation({
    mutationFn: (id: string) => ordersApi.restoreOrder(id),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || 'Orden restaurada');
        queryClient.invalidateQueries({ queryKey: ['orders'] });
      } else {
        toast.error(response.error || 'Error al restaurar');
      }
    },
    onError: () => toast.error('Error al restaurar la orden')
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => ordersApi.deleteOrder(id),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || 'Orden eliminada');
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        setOrderToDelete(null);
      } else {
        toast.error(response.error || 'Error al eliminar');
      }
    },
    onError: () => toast.error('Error al eliminar la orden')
  });

  // Table columns
  const columns: ColumnDef<OrderWithRelations>[] = [
    {
      accessorKey: 'folio',
      header: 'Número',
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('folio')}</div>
      ),
    },
    {
      accessorKey: 'owner',
      header: 'Cliente',
      cell: ({ row }) => {
        const owner = row.original.owner;
        return (
          <div className="flex items-center gap-2">
            <div>
              <div className="font-medium">{owner.name}</div>
              <div className="text-sm text-muted-foreground">{owner.phone}</div>
            </div>
            {owner.type === 'company' && (
              <Badge variant="outline" className="text-xs">Empresa</Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'vehicle',
      header: 'Vehículo',
      cell: ({ row }) => {
        const vehicle = row.original.vehicle;
        return (
          <div>
            <div className="font-medium">
              {vehicle.brand} {vehicle.model} ({vehicle.year})
            </div>
            <Badge variant="secondary" className="text-xs font-mono">
              {vehicle.plate}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => {
        const status = row.getValue('status') as OrderStatus;
        const statusLabel = orderStatuses.find(s => s.value === status)?.label || status;
        return (
          <Badge className={getOrderStatusColor(status)}>
            {statusLabel}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'entry_date',
      header: 'Fecha Ingreso',
      cell: ({ row }) => {
        const date = new Date(row.getValue('entry_date') as string);
        return (
          <div>
            <div className="font-medium">{formatDate(date, 'dd/MM/yyyy')}</div>
            <div className="text-sm text-muted-foreground">{timeAgo(date)}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'total',
      header: 'Total',
      cell: ({ row }) => {
        const total = row.original.total;
        const budgetApproved = row.original.budget_approved;
        return (
          <div className="text-right">
            <div className="font-medium">{formatCurrency(total)}</div>
            {budgetApproved && (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                Aprobado
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'technician',
      header: 'Técnico',
      cell: ({ row }) => {
        const technician = row.original.technician;
        return technician ? (
          <div className="text-sm">{technician.full_name}</div>
        ) : (
          <div className="text-sm text-muted-foreground">Sin asignar</div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => {
        const order = row.original;
        const isArchived = !!order.archived_at;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleViewOrder(order)}>
                <Eye className="mr-2 h-4 w-4" />
                Ver Detalles
              </DropdownMenuItem>
              {!isArchived && (
                <DropdownMenuItem onClick={() => handleEditOrder(order)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
              )}
              {order.owner.whatsapp_consent && !isArchived && (
                <DropdownMenuItem onClick={() => handleSendMessage(order)}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Enviar WhatsApp
                </DropdownMenuItem>
              )}
              {(canArchive || canDelete) && <DropdownMenuSeparator />}
              {canArchive && !isArchived && (
                <DropdownMenuItem
                  onClick={() => archiveMutation.mutate(order.id)}
                  disabled={archiveMutation.isPending}
                >
                  <Archive className="mr-2 h-4 w-4" />
                  Archivar
                </DropdownMenuItem>
              )}
              {canArchive && isArchived && (
                <DropdownMenuItem
                  onClick={() => restoreMutation.mutate(order.id)}
                  disabled={restoreMutation.isPending}
                >
                  <ArchiveRestore className="mr-2 h-4 w-4" />
                  Restaurar
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem
                  onClick={() => setOrderToDelete(order)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const handleViewOrder = (order: OrderWithRelations) => {
    router.push(`/es/ordenes/${order.id}`);
  };

  const handleEditOrder = (order: OrderWithRelations) => {
    router.push(`/es/ordenes/${order.id}/editar`);
  };

  const handleSendMessage = (order: OrderWithRelations) => {
    router.push(`/es/ordenes/${order.id}?tab=whatsapp`);
  };

  const handleNewOrder = () => {
    router.push('/es/ordenes/nueva');
  };

  const handleExport = (data: OrderWithRelations[]) => {
    // Convert to CSV format
    const csvData = data.map(order => ({
      'Número': order.folio,
      'Cliente': order.owner.name,
      'Vehículo': `${order.vehicle.brand} ${order.vehicle.model}`,
      'Placa': order.vehicle.plate,
      'Estado': orderStatuses.find(s => s.value === order.status)?.label || order.status,
      'Fecha Ingreso': formatDate(new Date(order.entry_date), 'dd/MM/yyyy'),
      'Total': order.total,
      'Técnico': order.technician?.full_name || 'Sin asignar'
    }));

    // Simple CSV export (in real app, use a proper CSV library)
    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ordenes_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Archivo exportado exitosamente');
  };

  const updateFilter = <K extends keyof OrderFilters>(key: K, value: OrderFilters[K] | undefined | '') => {
    setFilters(prev => {
      const newFilters = { ...prev };
      if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
        delete newFilters[key];
      } else {
        newFilters[key] = value as OrderFilters[K];
      }
      return newFilters;
    });
  };

  const clearFilters = () => {
    setFilters({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Órdenes de Trabajo</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona todas las órdenes de trabajo del taller
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="md:size-default" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Filtros</span>
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1 md:ml-2">
                {Object.keys(filters).length}
              </Badge>
            )}
          </Button>
          <Button size="sm" className="md:size-default" onClick={handleNewOrder}>
            <Plus className="h-4 w-4 md:mr-2" />
            <span className="hidden sm:inline">Nueva Orden</span>
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
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Buscar</Label>
                <Input
                  id="search"
                  placeholder="Número, cliente, placa..."
                  value={filters.search || ''}
                  onChange={(e) => updateFilter('search', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={filters.status?.[0] || '__all__'}
                  onValueChange={(value) => updateFilter('status', value === '__all__' ? undefined : [value as OrderStatus])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todos los estados</SelectItem>
                    {orderStatuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="dateFrom">Desde</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={filters.date_from || ''}
                  onChange={(e) => updateFilter('date_from', e.target.value || undefined)}
                />
              </div>
              <div>
                <Label htmlFor="dateTo">Hasta</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={filters.date_to || ''}
                  onChange={(e) => updateFilter('date_to', e.target.value || undefined)}
                />
              </div>
              {canArchive && (
                <div className="flex items-center space-x-2 pt-6">
                  <Checkbox
                    id="showArchived"
                    checked={filters.show_archived || false}
                    onCheckedChange={(checked) => updateFilter('show_archived', checked ? true : undefined)}
                  />
                  <Label htmlFor="showArchived" className="text-sm font-normal cursor-pointer">
                    Mostrar archivadas
                  </Label>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* View Toggle and Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{orders.length} órdenes encontradas</span>
          {hasActiveFilters && (
            <span className="hidden sm:inline">• Filtros aplicados</span>
          )}
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport(orders)} className="sm:hidden">
            <Download className="h-4 w-4" />
          </Button>
          <Tabs value={view} onValueChange={(value) => setView(value as 'table' | 'cards')}>
            <TabsList className="h-9">
              <TabsTrigger value="table" className="text-xs sm:text-sm">
                <List className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Lista</span>
              </TabsTrigger>
              <TabsTrigger value="cards" className="text-xs sm:text-sm">
                <Grid3X3 className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Tarjetas</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      {view === 'table' ? (
        <DataTable
          columns={columns}
          data={orders}
          searchKey="folio"
          searchPlaceholder="Buscar por número, cliente o placa..."
          onExport={handleExport}
          enableRowSelection={true}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onView={handleViewOrder}
              onEdit={handleEditOrder}
              onSendMessage={handleSendMessage}
            />
          ))}
          {orders.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Car className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No hay órdenes</h3>
              <p className="text-muted-foreground mb-4">
                {hasActiveFilters
                  ? 'No se encontraron órdenes con los filtros aplicados'
                  : 'Comienza creando tu primera orden de trabajo'
                }
              </p>
              {!hasActiveFilters && (
                <Button onClick={handleNewOrder}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Orden
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!orderToDelete} onOpenChange={(open) => !open && setOrderToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar orden permanentemente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la orden{' '}
              <span className="font-semibold">{orderToDelete?.folio}</span> y todos sus datos asociados
              (presupuesto, línea de tiempo, pagos, etc.).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => orderToDelete && deleteMutation.mutate(orderToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
