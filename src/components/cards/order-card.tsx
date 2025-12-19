'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { OrderWithRelations } from '@/types/database';
import { formatCurrency, formatDate, getOrderStatusColor, timeAgo } from '@/lib/utils';
import {
  Calendar,
  Car,
  User,
  DollarSign,
  Clock,
  MessageSquare,
  Eye,
  Edit,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface OrderCardProps {
  order: OrderWithRelations;
  onView?: (order: OrderWithRelations) => void;
  onEdit?: (order: OrderWithRelations) => void;
  onSendMessage?: (order: OrderWithRelations) => void;
  compact?: boolean;
}

export function OrderCard({ 
  order, 
  onView, 
  onEdit, 
  onSendMessage, 
  compact = false 
}: OrderCardProps) {

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      new: 'Nuevo',
      diagnosis: 'Diagnóstico',
      in_progress: 'En Proceso',
      waiting: 'En Espera',
      approval: 'Aprobación',
      finished: 'Finalizado',
      delivered: 'Entregado'
    };
    return statusMap[status] || status;
  };

  const getPriorityColor = (status: string) => {
    if (status === 'approval') return 'border-l-red-500';
    if (status === 'waiting') return 'border-l-yellow-500';
    if (status === 'in_progress') return 'border-l-blue-500';
    return 'border-l-gray-300';
  };

  return (
    <Card className={`hover:shadow-md transition-shadow ${getPriorityColor(order.status)} border-l-4`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">{order.folio}</h3>
              <Badge className={getOrderStatusColor(order.status)}>
                {getStatusLabel(order.status)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {timeAgo(new Date(order.entry_date))}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onView && (
                <DropdownMenuItem onClick={() => onView(order)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Ver Detalles
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(order)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
              )}
              {onSendMessage && order.owner.whatsapp_consent && (
                <DropdownMenuItem onClick={() => onSendMessage(order)}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Enviar WhatsApp
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Customer & Vehicle Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{order.owner.name}</span>
            {order.owner.type === 'company' && (
              <Badge variant="outline" className="text-xs">Empresa</Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Car className="h-4 w-4 text-muted-foreground" />
            <span>
              {order.vehicle.brand} {order.vehicle.model} ({order.vehicle.year})
            </span>
            <Badge variant="secondary" className="text-xs font-mono">
              {order.vehicle.plate}
            </Badge>
          </div>
        </div>

        {/* Service Description */}
        {!compact && (
          <div className="text-sm text-muted-foreground">
            <p className="line-clamp-2">{order.reason}</p>
          </div>
        )}

        {/* Dates & Financial Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span className="text-xs">Ingreso</span>
            </div>
            <p className="font-medium">{formatDate(new Date(order.entry_date), 'dd/MM/yyyy')}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <DollarSign className="h-3 w-3" />
              <span className="text-xs">Total</span>
            </div>
            <p className="font-medium">{formatCurrency(order.total)}</p>
          </div>
        </div>

        {/* Commitment Date */}
        {order.commitment_date && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>Compromiso: {formatDate(new Date(order.commitment_date), 'dd/MM/yyyy')}</span>
            {new Date(order.commitment_date) < new Date() && order.status !== 'delivered' && (
              <Badge variant="destructive" className="text-xs">Vencido</Badge>
            )}
          </div>
        )}

        {/* Technician */}
        {order.technician && (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={order.technician.avatar_url || ''} alt={order.technician.full_name} />
              <AvatarFallback className="text-xs">
                {order.technician.full_name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">
              {order.technician.full_name}
            </span>
          </div>
        )}

        {/* Progress Indicators */}
        {!compact && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>{order.timeline_entries.length} entradas</span>
              <span>{order.messages.length} mensajes</span>
              <span>{order.parts_invoices.length} facturas</span>
            </div>
            {order.budget_approved && (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                Aprobado
              </Badge>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2">
          {onView && (
            <Button variant="outline" size="sm" onClick={() => onView(order)} className="flex-1">
              <Eye className="mr-1 h-3 w-3" />
              Ver
            </Button>
          )}
          {onSendMessage && order.owner.whatsapp_consent && (
            <Button variant="outline" size="sm" onClick={() => onSendMessage(order)}>
              <MessageSquare className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
