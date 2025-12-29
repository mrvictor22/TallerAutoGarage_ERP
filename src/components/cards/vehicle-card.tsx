'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VehicleWithRelations } from '@/types/database';
import {
  Calendar,
  Car,
  User,
  Gauge,
  Wrench,
  Eye,
  Edit,
  MoreHorizontal,
  Phone
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface VehicleCardProps {
  vehicle: VehicleWithRelations;
  onView?: (vehicle: VehicleWithRelations) => void;
  onEdit?: (vehicle: VehicleWithRelations) => void;
  onNewOrder?: (vehicle: VehicleWithRelations) => void;
  onDelete?: (vehicle: VehicleWithRelations) => void;
  compact?: boolean;
}

export function VehicleCard({
  vehicle,
  onView,
  onEdit,
  onNewOrder,
  onDelete,
  compact = false
}: VehicleCardProps) {

  const activeOrders = vehicle.orders?.filter(o =>
    ['new', 'diagnosis', 'waiting_approval', 'approved', 'in_progress', 'waiting_parts', 'quality_check'].includes(o.status)
  ) || [];

  const hasActiveOrders = activeOrders.length > 0;

  return (
    <Card className={`hover:shadow-md transition-shadow ${hasActiveOrders ? 'border-l-4 border-l-blue-500' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Car className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold text-lg">
                {vehicle.brand} {vehicle.model}
              </h3>
              <Badge variant="secondary" className="font-mono text-xs">
                {vehicle.plate}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {vehicle.year} • {vehicle.color}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 min-w-[36px]">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onView && (
                <DropdownMenuItem onClick={() => onView(vehicle)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Ver Detalles
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(vehicle)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
              )}
              {onNewOrder && (
                <DropdownMenuItem onClick={() => onNewOrder(vehicle)}>
                  <Wrench className="mr-2 h-4 w-4" />
                  Nueva Orden
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(vehicle)}
                    className="text-red-600 focus:text-red-600"
                    disabled={!!vehicle.orders?.length}
                  >
                    <Wrench className="mr-2 h-4 w-4" />
                    Eliminar
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Owner Info */}
        {vehicle.owner && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{vehicle.owner.name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{vehicle.owner.phone}</span>
            </div>
          </div>
        )}

        {/* Vehicle Details */}
        {!compact && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Gauge className="h-3 w-3" />
                <span className="text-xs">Kilometraje</span>
              </div>
              <p className="font-medium">
                {vehicle.mileage ? vehicle.mileage.toLocaleString() : 'N/A'} km
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Wrench className="h-3 w-3" />
                <span className="text-xs">Órdenes</span>
              </div>
              <p className="font-medium flex items-center gap-2">
                {vehicle.orders?.length || 0}
                {hasActiveOrders && (
                  <Badge variant="secondary" className="text-xs">
                    {activeOrders.length} activa{activeOrders.length > 1 ? 's' : ''}
                  </Badge>
                )}
              </p>
            </div>
          </div>
        )}

        {/* VIN */}
        {vehicle.vin && (
          <div className="text-xs text-muted-foreground font-mono bg-muted/50 p-2 rounded">
            VIN: {vehicle.vin}
          </div>
        )}

        {/* Last Service */}
        {vehicle.last_service_date && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              Último servicio: {new Date(vehicle.last_service_date).toLocaleDateString('es-SV')}
            </span>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2">
          {onView && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView(vehicle)}
              className="flex-1 h-10"
            >
              <Eye className="mr-1 h-3 w-3" />
              Ver
            </Button>
          )}
          {onNewOrder && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNewOrder(vehicle)}
              className="h-10"
            >
              <Wrench className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
