'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { OwnerWithRelations } from '@/types/database';
import {
  User,
  Building,
  Phone,
  Mail,
  MapPin,
  Car,
  FileText,
  MessageSquare,
  Eye,
  Edit,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatPhone } from '@/lib/utils';

interface OwnerCardProps {
  owner: OwnerWithRelations;
  onView?: (owner: OwnerWithRelations) => void;
  onEdit?: (owner: OwnerWithRelations) => void;
  onSendMessage?: (owner: OwnerWithRelations) => void;
  onDelete?: (owner: OwnerWithRelations) => void;
  compact?: boolean;
}

export function OwnerCard({
  owner,
  onView,
  onEdit,
  onSendMessage,
  onDelete,
  compact = false
}: OwnerCardProps) {

  const isCompany = owner.type === 'company';
  const canDelete = !owner.vehicles?.length && !owner.orders?.length;

  return (
    <Card className={`hover:shadow-md transition-shadow ${isCompany ? 'border-l-4 border-l-purple-500' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {isCompany ? (
                <Building className="h-5 w-5 text-muted-foreground" />
              ) : (
                <User className="h-5 w-5 text-muted-foreground" />
              )}
              <h3 className="font-semibold text-lg">{owner.name}</h3>
              <Badge variant={isCompany ? 'default' : 'secondary'} className="text-xs">
                {isCompany ? 'Empresa' : 'Persona'}
              </Badge>
            </div>
            {owner.tax_id && (
              <p className="text-sm text-muted-foreground">{owner.tax_id}</p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 min-w-[36px]">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onView && (
                <DropdownMenuItem onClick={() => onView(owner)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Ver Detalles
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(owner)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
              )}
              {onSendMessage && owner.whatsapp_consent && (
                <DropdownMenuItem onClick={() => onSendMessage(owner)}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Enviar WhatsApp
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(owner)}
                    disabled={!canDelete}
                    className="text-red-600 focus:text-red-600"
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Eliminar
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Contact Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{formatPhone(owner.phone)}</span>
            {owner.whatsapp_consent && (
              <Badge variant="secondary" className="text-xs">WhatsApp</Badge>
            )}
          </div>
          {owner.email && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span className="truncate">{owner.email}</span>
            </div>
          )}
          {owner.address && !compact && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-2">{owner.address}</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Car className="h-3 w-3" />
              <span className="text-xs">Vehículos</span>
            </div>
            <p className="font-medium">
              {owner.vehicles?.length || 0}
            </p>
            {owner.vehicles && owner.vehicles.length > 0 && !compact && (
              <p className="text-xs text-muted-foreground truncate">
                {owner.vehicles.slice(0, 2).map(v => v.plate).join(', ')}
                {owner.vehicles.length > 2 && ` +${owner.vehicles.length - 2}`}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <FileText className="h-3 w-3" />
              <span className="text-xs">Órdenes</span>
            </div>
            <p className="font-medium">
              {owner.orders?.length || 0}
            </p>
          </div>
        </div>

        {/* Tags */}
        {owner.tags && owner.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {owner.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {owner.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{owner.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Notes preview */}
        {owner.notes && !compact && (
          <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
            <p className="line-clamp-2">{owner.notes}</p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2">
          {onView && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView(owner)}
              className="flex-1 h-10"
            >
              <Eye className="mr-1 h-3 w-3" />
              Ver
            </Button>
          )}
          {onSendMessage && owner.whatsapp_consent && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSendMessage(owner)}
              className="h-10"
            >
              <MessageSquare className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
