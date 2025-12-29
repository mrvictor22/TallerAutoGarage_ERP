'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ordersApi, timelineApi } from '@/services/supabase-api';
import { OrderWithRelations, TimelineEntry as DBTimelineEntry, TimelineEntryInsert, Json } from '@/types/database';
import { TimelineEntryType, TimelineEntry } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Timeline } from '@/components/timeline/timeline';
import { FileUploader } from '@/components/uploader/file-uploader';
import { WhatsAppSender } from '@/components/whatsapp/whatsapp-sender';
import { OrderBudget } from '@/components/orders/order-budget';
import { OrderPayments } from '@/components/orders/order-payments';
import { formatCurrency, formatDate, formatDateTime, getOrderStatusColor, timeAgo } from '@/lib/utils';
import {
  ArrowLeft,
  Calendar,
  Car,
  User,
  DollarSign,
  Clock,
  MessageSquare,
  FileText,
  Upload,
  Edit,
  Printer,
  Download,
  CheckCircle,
  AlertTriangle,
  Phone,
  Mail,
  MapPin,
  Wrench,
  Package
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface OrderDetailContentProps {
  orderId: string;
  defaultTab?: string;
}

// Map database timeline entry to component timeline entry format
function mapTimelineEntry(entry: DBTimelineEntry & { author?: { full_name: string } }): TimelineEntry {
  // Parse checklist from JSON if present
  const checklist = entry.checklist as Array<{ id: string; text: string; completed: boolean }> | null;

  return {
    id: entry.id,
    orderId: entry.order_id,
    type: entry.type as TimelineEntryType,
    title: entry.title,
    description: entry.description || '',
    timeSpentMinutes: entry.time_spent_minutes ?? undefined,
    authorId: entry.author_id || '',
    authorName: entry.author?.full_name || 'Usuario',
    attachments: entry.attachments || [],
    tags: entry.tags || [],
    checklist: checklist ?? undefined,
    createdAt: new Date(entry.created_at)
  };
}

function OrderSummary({ order }: { order: OrderWithRelations }) {
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: ({ status, notes }: { status: string; notes?: string }) =>
      ordersApi.updateOrderStatus(order.id, status as 'new' | 'diagnosis' | 'waiting_approval' | 'approved' | 'in_progress' | 'waiting_parts' | 'quality_check' | 'ready' | 'delivered' | 'cancelled', notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', order.id] });
      toast.success('Estado actualizado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error?.message || 'Error al actualizar estado');
    }
  });

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      new: 'Nuevo',
      diagnosis: 'Diagnóstico',
      waiting_approval: 'Esperando Aprobación',
      approved: 'Aprobado',
      in_progress: 'En Proceso',
      waiting_parts: 'Esperando Repuestos',
      quality_check: 'Control de Calidad',
      ready: 'Listo',
      delivered: 'Entregado',
      cancelled: 'Cancelado'
    };
    return statusMap[status] || status;
  };

  const statusOptions = [
    { value: 'new', label: 'Nuevo' },
    { value: 'diagnosis', label: 'Diagnóstico' },
    { value: 'waiting_approval', label: 'Esperando Aprobación' },
    { value: 'approved', label: 'Aprobado' },
    { value: 'in_progress', label: 'En Proceso' },
    { value: 'waiting_parts', label: 'Esperando Repuestos' },
    { value: 'quality_check', label: 'Control de Calidad' },
    { value: 'ready', label: 'Listo' },
    { value: 'delivered', label: 'Entregado' }
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Main Info */}
      <div className="lg:col-span-2 space-y-6">
        {/* Order Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{order.folio}</CardTitle>
                <p className="text-muted-foreground mt-1">
                  Creada {timeAgo(order.entry_date)} • {formatDateTime(order.entry_date)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getOrderStatusColor(order.status)}>
                  {getStatusLabel(order.status)}
                </Badge>
                <Select
                  value={order.status}
                  onValueChange={(status) => updateStatusMutation.mutate({ status })}
                  disabled={updateStatusMutation.isPending}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Motivo del Servicio</h4>
                <p className="text-muted-foreground">{order.reason}</p>
              </div>

              {order.commitment_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Fecha compromiso: {formatDate(order.commitment_date, 'PPP')}</span>
                  {new Date(order.commitment_date) < new Date() && order.status !== 'delivered' && (
                    <Badge variant="destructive" className="text-xs">Vencido</Badge>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                {order.entry_mileage && (
                  <div>
                    <span className="text-muted-foreground">Kilometraje:</span>
                    <span className="ml-2 font-medium">{order.entry_mileage.toLocaleString()} km</span>
                  </div>
                )}
                {order.fuel_level && (
                  <div>
                    <span className="text-muted-foreground">Combustible:</span>
                    <span className="ml-2 font-medium">{order.fuel_level}%</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer & Vehicle Info */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium">{order.owner.name}</h4>
                  {order.owner.type === 'company' && (
                    <Badge variant="outline">Empresa</Badge>
                  )}
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3" />
                    <span>{order.owner.phone}</span>
                    {order.owner.whatsapp_consent && (
                      <Badge variant="secondary" className="text-xs">WhatsApp</Badge>
                    )}
                  </div>
                  {order.owner.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      <span>{order.owner.email}</span>
                    </div>
                  )}
                  {order.owner.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      <span>{order.owner.address}</span>
                    </div>
                  )}
                </div>
              </div>
              {order.owner.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {order.owner.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Vehículo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="font-medium">
                  {order.vehicle.brand} {order.vehicle.model} ({order.vehicle.year})
                </h4>
                <Badge variant="secondary" className="font-mono mt-1">
                  {order.vehicle.plate}
                </Badge>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                {order.vehicle.color && (
                  <div>Color: {order.vehicle.color}</div>
                )}
                {order.vehicle.engine && (
                  <div>Motor: {order.vehicle.engine}</div>
                )}
                {order.vehicle.vin && (
                  <div>VIN: {order.vehicle.vin}</div>
                )}
              </div>
              {order.vehicle.notes && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Notas:</span>
                  <p className="mt-1">{order.vehicle.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full" variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Editar Orden
            </Button>
            <Button className="w-full" variant="outline">
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
            <Button className="w-full" variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Generar PDF
            </Button>
            {order.owner.whatsapp_consent && (
              <Button className="w-full" variant="outline">
                <MessageSquare className="mr-2 h-4 w-4" />
                Enviar WhatsApp
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Budget Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Presupuesto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Impuestos:</span>
                <span>{formatCurrency(order.tax_amount)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Descuento:</span>
                  <span>-{formatCurrency(order.discount_amount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Total:</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {order.budget_approved ? (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Aprobado
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Pendiente
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Technician */}
        {order.technician && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Técnico Asignado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={order.technician.avatar_url || ''} alt={order.technician.full_name} />
                  <AvatarFallback>
                    {order.technician.full_name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{order.technician.full_name}</div>
                  <div className="text-sm text-muted-foreground">{order.technician.email}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Progreso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Entradas en bitácora:</span>
              <span className="font-medium">{order.timeline_entries?.length || 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Mensajes enviados:</span>
              <span className="font-medium">{order.messages?.length || 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Facturas de repuestos:</span>
              <span className="font-medium">{order.parts_invoices?.length || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function OrderDetailContent({ orderId, defaultTab = 'summary' }: OrderDetailContentProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Fetch order details
  const { data: orderResponse, isLoading } = useQuery({
    queryKey: ['orders', orderId],
    queryFn: () => ordersApi.getOrder(orderId)
  });

  // Add timeline entry mutation
  const addTimelineEntryMutation = useMutation({
    mutationFn: (entry: {
      type: TimelineEntryType;
      title: string;
      description?: string;
      timeSpentMinutes?: number;
      attachments?: string[];
      tags?: string[];
      checklist?: Json;
    }) => {
      const timelineEntry: TimelineEntryInsert = {
        order_id: orderId,
        type: entry.type,
        title: entry.title,
        description: entry.description || null,
        time_spent_minutes: entry.timeSpentMinutes || null,
        attachments: entry.attachments || [],
        tags: entry.tags || [],
        metadata: {},
        checklist: entry.checklist ?? undefined,
        author_id: '' // Will be set by the API
      };
      return timelineApi.addEntry(timelineEntry);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', orderId] });
      toast.success('Entrada agregada exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error?.message || 'Error al agregar entrada');
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-6 w-32 bg-muted animate-pulse rounded" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-muted animate-pulse rounded" />
                    <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="space-y-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-6 w-24 bg-muted animate-pulse rounded" />
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-muted animate-pulse rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!orderResponse?.success || !orderResponse.data) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2">Orden no encontrada</h3>
        <p className="text-muted-foreground mb-4">
          La orden solicitada no existe o no tienes permisos para verla.
        </p>
        <Button onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      </div>
    );
  }

  const order = orderResponse.data;

  // Map timeline entries to the format expected by Timeline component
  const mappedTimelineEntries = (order.timeline_entries || []).map(mapTimelineEntry);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Orden {order.folio}</h1>
          <p className="text-muted-foreground">
            {order.owner.name} • {order.vehicle.brand} {order.vehicle.model} ({order.vehicle.plate})
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="inline-flex w-max sm:w-auto h-auto flex-wrap sm:flex-nowrap gap-1 p-1">
            <TabsTrigger value="summary" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2">
              <FileText className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Resumen</span>
            </TabsTrigger>
            <TabsTrigger value="timeline" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2">
              <Clock className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Bitácora</span>
            </TabsTrigger>
            <TabsTrigger value="budget" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2">
              <Wrench className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Presupuesto</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2">
              <DollarSign className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Pagos</span>
            </TabsTrigger>
            <TabsTrigger value="parts" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2">
              <Package className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Repuestos</span>
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2">
              <MessageSquare className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">WhatsApp</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="summary" className="mt-6">
          <OrderSummary order={order} />
        </TabsContent>

        <TabsContent value="timeline" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Bitácora de Trabajo</CardTitle>
            </CardHeader>
            <CardContent>
              <Timeline
                entries={mappedTimelineEntries}
                onAddEntry={(entry) => addTimelineEntryMutation.mutate(entry)}
                editable={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budget" className="mt-6">
          <OrderBudget orderId={orderId} />
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <OrderPayments orderId={orderId} totalAmount={order.total} />
        </TabsContent>

        <TabsContent value="parts" className="mt-6">
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Facturas de Repuestos</CardTitle>
              </CardHeader>
              <CardContent>
                {order.parts_invoices && order.parts_invoices.length > 0 ? (
                  <div className="space-y-4">
                    {order.parts_invoices.map((invoice) => (
                      <Card key={invoice.id} className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium">{invoice.supplier}</h4>
                            <p className="text-sm text-muted-foreground">
                              Factura #{invoice.invoice_number || 'N/A'}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">
                              {formatCurrency(invoice.total)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              +{formatCurrency(invoice.tax_amount)} IVA
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDateTime(invoice.created_at)}
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay facturas de repuestos</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Subir Documentos</CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                <FileUploader
                  acceptedTypes={['image/*', 'application/pdf']}
                  maxFiles={5}
                  onFilesChange={(files) => {
                    console.log('Files uploaded:', files);
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="whatsapp" className="mt-6">
          <WhatsAppSender
            order={order}
            onMessageSent={() => {
              queryClient.invalidateQueries({ queryKey: ['orders', orderId] });
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
