'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { ordersApi } from '@/services/api';
import { OrderWithRelations, OrderFilters, OrderStatus } from '@/types';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  X
} from 'lucide-react';
import { toast } from 'sonner';

const orderStatuses: { value: OrderStatus; label: string }[] = [
  { value: 'new', label: 'Nuevo' },
  { value: 'diagnosis', label: 'Diagnóstico' },
  { value: 'in_progress', label: 'En Proceso' },
  { value: 'waiting', label: 'En Espera' },
  { value: 'approval', label: 'Aprobación' },
  { value: 'finished', label: 'Finalizado' },
  { value: 'delivered', label: 'Entregado' }
];

export function OrdersListContent() {
  const router = useRouter();
  const [view, setView] = useState<'table' | 'cards'>('table');
  const [filters, setFilters] = useState<OrderFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  // Fetch orders
  const { data: ordersResponse, isLoading, refetch } = useQuery({
    queryKey: ['orders', filters],
    queryFn: () => ordersApi.getOrders(filters, 1, 50)
  });

  const orders = ordersResponse?.data?.data || [];

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
      accessorKey: 'entryDate',
      header: 'Fecha Ingreso',
      cell: ({ row }) => {
        const date = row.getValue('entryDate') as Date;
        return (
          <div>
            <div className="font-medium">{formatDate(date, 'dd/MM/yyyy')}</div>
            <div className="text-sm text-muted-foreground">{timeAgo(date)}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'budget',
      header: 'Total',
      cell: ({ row }) => {
        const budget = row.original.budget;
        return (
          <div className="text-right">
            <div className="font-medium">{formatCurrency(budget.totals.total)}</div>
            {budget.approved && (
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
          <div className="text-sm">{technician.name}</div>
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
              <DropdownMenuItem onClick={() => handleEditOrder(order)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              {order.owner.whatsappConsent && (
                <DropdownMenuItem onClick={() => handleSendMessage(order)}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Enviar WhatsApp
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const handleViewOrder = (order: OrderWithRelations) => {
    router.push(`/ordenes/${order.id}`);
  };

  const handleEditOrder = (order: OrderWithRelations) => {
    router.push(`/ordenes/${order.id}/editar`);
  };

  const handleSendMessage = (order: OrderWithRelations) => {
    router.push(`/ordenes/${order.id}?tab=whatsapp`);
  };

  const handleNewOrder = () => {
    router.push('/ordenes/nueva');
  };

  const handleExport = (data: OrderWithRelations[]) => {
    // Convert to CSV format
    const csvData = data.map(order => ({
      'Número': order.folio,
      'Cliente': order.owner.name,
      'Vehículo': `${order.vehicle.brand} ${order.vehicle.model}`,
      'Placa': order.vehicle.plate,
      'Estado': orderStatuses.find(s => s.value === order.status)?.label || order.status,
      'Fecha Ingreso': formatDate(order.entryDate, 'dd/MM/yyyy'),
      'Total': order.budget.totals.total,
      'Técnico': order.technician?.name || 'Sin asignar'
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

  const updateFilter = (key: keyof OrderFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== '' && (!Array.isArray(value) || value.length > 0)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('orders.title')}</h1>
          <p className="text-muted-foreground">
            Gestiona todas las órdenes de trabajo del taller
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
          <Button onClick={handleNewOrder}>
            <Plus className="mr-2 h-4 w-4" />
            {t('orders.newOrder')}
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
                  value={filters.status?.[0] || ''}
                  onValueChange={(value) => updateFilter('status', value ? [value as OrderStatus] : undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos los estados</SelectItem>
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
                  value={filters.dateFrom ? filters.dateFrom.toISOString().split('T')[0] : ''}
                  onChange={(e) => updateFilter('dateFrom', e.target.value ? new Date(e.target.value) : undefined)}
                />
              </div>
              <div>
                <Label htmlFor="dateTo">Hasta</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={filters.dateTo ? filters.dateTo.toISOString().split('T')[0] : ''}
                  onChange={(e) => updateFilter('dateTo', e.target.value ? new Date(e.target.value) : undefined)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* View Toggle and Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{orders.length} órdenes encontradas</span>
          {hasActiveFilters && (
            <span>• Filtros aplicados</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={view} onValueChange={(value) => setView(value as 'table' | 'cards')}>
            <TabsList>
              <TabsTrigger value="table">
                <List className="h-4 w-4 mr-2" />
                Lista
              </TabsTrigger>
              <TabsTrigger value="cards">
                <Grid3X3 className="h-4 w-4 mr-2" />
                Tarjetas
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
    </div>
  );
}
