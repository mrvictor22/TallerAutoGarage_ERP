'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { ownersApi } from '@/services/supabase-api';
import { OwnerWithRelations, OwnerType } from '@/types/database';
import { OwnerFilters } from '@/services/supabase-api';
import { DataTable } from '@/components/tables/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
import { formatPhone } from '@/lib/utils';
import {
  Plus,
  Filter,
  Download,
  MoreHorizontal,
  Eye,
  Edit,
  MessageSquare,
  Phone,
  Mail,
  Building,
  User,
  Car,
  FileText,
  X,
  Search,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

export function OwnersListContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<OwnerFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ownerToDelete, setOwnerToDelete] = useState<OwnerWithRelations | null>(null);

  // Fetch owners
  const { data: ownersResponse, isLoading } = useQuery({
    queryKey: ['owners', filters],
    queryFn: () => ownersApi.getOwners(filters, 1, 50)
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => ownersApi.deleteOwner(id),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || 'Cliente eliminado exitosamente');
        queryClient.invalidateQueries({ queryKey: ['owners'] });
      } else {
        toast.error(response.error || 'Error al eliminar el cliente');
      }
    },
    onError: () => {
      toast.error('Error al eliminar el cliente');
    }
  });

  const owners = ownersResponse?.success && ownersResponse.data ? ownersResponse.data.data : [];

  // Table columns
  const columns: ColumnDef<OwnerWithRelations>[] = [
    {
      accessorKey: 'name',
      header: 'Nombre',
      cell: ({ row }) => {
        const owner = row.original;
        return (
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0">
              {owner.type === 'company' ? (
                <Building className="h-4 w-4 text-muted-foreground" />
              ) : (
                <User className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <div>
              <div className="font-medium">{owner.name}</div>
              {owner.tax_id && (
                <div className="text-sm text-muted-foreground">{owner.tax_id}</div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'type',
      header: 'Tipo',
      cell: ({ row }) => {
        const type = row.getValue('type') as OwnerType;
        return (
          <Badge variant={type === 'company' ? 'default' : 'secondary'}>
            {type === 'company' ? 'Empresa' : 'Persona'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'phone',
      header: 'Contacto',
      cell: ({ row }) => {
        const owner = row.original;
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-3 w-3 text-muted-foreground" />
              <span>{formatPhone(owner.phone)}</span>
              {owner.whatsapp_consent && (
                <Badge variant="secondary" className="text-xs">WhatsApp</Badge>
              )}
            </div>
            {owner.email && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-3 w-3" />
                <span>{owner.email}</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'vehicles',
      header: 'Vehículos',
      cell: ({ row }) => {
        const vehicles = row.original.vehicles || [];
        return (
          <div className="flex items-center gap-2">
            <Car className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{vehicles.length}</span>
            {vehicles.length > 0 && (
              <div className="text-sm text-muted-foreground">
                {vehicles.slice(0, 2).map(v => v.plate).join(', ')}
                {vehicles.length > 2 && ` +${vehicles.length - 2}`}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'orders',
      header: 'Órdenes',
      cell: ({ row }) => {
        const orders = row.original.orders || [];
        return (
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{orders.length}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'tags',
      header: 'Etiquetas',
      cell: ({ row }) => {
        const tags = row.original.tags || [];
        return (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {tags.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{tags.length - 2}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => {
        const owner = row.original;
        const canDelete = !owner.vehicles?.length && !owner.orders?.length;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleViewOwner(owner)}>
                <Eye className="mr-2 h-4 w-4" />
                Ver Detalles
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEditOwner(owner)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              {owner.whatsapp_consent && (
                <DropdownMenuItem onClick={() => handleSendMessage(owner)}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Enviar WhatsApp
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDeleteOwner(owner)}
                disabled={!canDelete}
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

  const handleViewOwner = (owner: OwnerWithRelations) => {
    router.push(`/es/duenos/${owner.id}`);
  };

  const handleEditOwner = (owner: OwnerWithRelations) => {
    router.push(`/es/duenos/${owner.id}/editar`);
  };

  const handleSendMessage = (owner: OwnerWithRelations) => {
    // Navigate to WhatsApp with owner context
    router.push(`/es/notificaciones/whatsapp?ownerId=${owner.id}`);
  };

  const handleDeleteOwner = (owner: OwnerWithRelations) => {
    if (owner.vehicles?.length || owner.orders?.length) {
      toast.error('No se puede eliminar: el cliente tiene vehículos u órdenes asociadas');
      return;
    }
    setOwnerToDelete(owner);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (ownerToDelete) {
      deleteMutation.mutate(ownerToDelete.id);
      setDeleteDialogOpen(false);
      setOwnerToDelete(null);
    }
  };

  const handleNewOwner = () => {
    router.push('/es/duenos/nuevo');
  };

  const handleExport = (data: OwnerWithRelations[]) => {
    // Convert to CSV format
    const csvData = data.map(owner => ({
      'Nombre': owner.name,
      'Tipo': owner.type === 'company' ? 'Empresa' : 'Persona',
      'Teléfono': owner.phone,
      'Email': owner.email || '',
      'Dirección': owner.address || '',
      'WhatsApp': owner.whatsapp_consent ? 'Sí' : 'No',
      'Vehículos': owner.vehicles?.length || 0,
      'Órdenes': owner.orders?.length || 0,
      'Etiquetas': owner.tags?.join(', ') || ''
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
    a.download = `duenos_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Archivo exportado exitosamente');
  };

  const updateFilter = (key: keyof OwnerFilters, value: unknown) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const hasActiveFilters = Object.values(filters).some(value =>
    value !== undefined && value !== '' && (!Array.isArray(value) || value.length > 0)
  );

  // Get unique tags for filter
  const allTags = Array.from(new Set(owners.flatMap(owner => owner.tags || [])));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">
            Gestiona la información de clientes y empresas
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
          <Button onClick={handleNewOwner}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Cliente
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
                  placeholder="Nombre, teléfono, email..."
                  value={filters.search || ''}
                  onChange={(e) => updateFilter('search', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="type">Tipo</Label>
                <Select
                  value={filters.type || ''}
                  onValueChange={(value) => updateFilter('type', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos los tipos</SelectItem>
                    <SelectItem value="person">Persona</SelectItem>
                    <SelectItem value="company">Empresa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="tags">Etiquetas</Label>
                <Select
                  value={filters.tags?.[0] || ''}
                  onValueChange={(value) => updateFilter('tags', value ? [value] : undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las etiquetas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas las etiquetas</SelectItem>
                    {allTags.map((tag) => (
                      <SelectItem key={tag} value={tag}>
                        {tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <Checkbox
                  id="whatsapp"
                  checked={filters.has_whatsapp_consent || false}
                  onCheckedChange={(checked) => updateFilter('has_whatsapp_consent', checked || undefined)}
                />
                <Label htmlFor="whatsapp" className="text-sm">
                  Solo con WhatsApp
                </Label>
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
              <User className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Total Clientes</p>
                <p className="text-2xl font-bold">{owners.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Building className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Empresas</p>
                <p className="text-2xl font-bold">
                  {owners.filter(o => o.type === 'company').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Con WhatsApp</p>
                <p className="text-2xl font-bold">
                  {owners.filter(o => o.whatsapp_consent).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Car className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Total Vehículos</p>
                <p className="text-2xl font-bold">
                  {owners.reduce((sum, owner) => sum + (owner.vehicles?.length || 0), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={owners}
        searchKey="name"
        searchPlaceholder="Buscar por nombre, teléfono o email..."
        onExport={handleExport}
        enableRowSelection={true}
      />

      {/* Empty state */}
      {owners.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">No hay clientes</h3>
          <p className="text-muted-foreground mb-4">
            {hasActiveFilters
              ? 'No se encontraron clientes con los filtros aplicados'
              : 'Comienza agregando tu primer cliente'
            }
          </p>
          {!hasActiveFilters && (
            <Button onClick={handleNewOwner}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Cliente
            </Button>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el cliente
              <strong> {ownerToDelete?.name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
