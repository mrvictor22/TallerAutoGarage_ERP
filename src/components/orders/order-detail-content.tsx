'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ordersApi, timelineApi } from '@/services/api';
import { OrderWithRelations, TimelineEntry } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Timeline } from '@/components/timeline/timeline';
import { FileUploader } from '@/components/uploader/file-uploader';
import { WhatsAppSender } from '@/components/whatsapp/whatsapp-sender';
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

function OrderSummary({ order }: { order: OrderWithRelations }) {
  const queryClient = useQueryClient();
  
  const updateStatusMutation = useMutation({
    mutationFn: ({ status, notes }: { status: string; notes?: string }) =>
      ordersApi.updateOrderStatus(order.id, status as any, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', order.id] });
      toast.success('Estado actualizado exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar estado');
    }
  });

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

  const statusOptions = [
    { value: 'new', label: 'Nuevo' },
    { value: 'diagnosis', label: 'Diagnóstico' },
    { value: 'in_progress', label: 'En Proceso' },
    { value: 'waiting', label: 'En Espera' },
    { value: 'approval', label: 'Aprobación' },
    { value: 'finished', label: 'Finalizado' },
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
                  Creada {timeAgo(order.entryDate)} • {formatDateTime(order.entryDate)}
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
              
              {order.commitmentDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Fecha compromiso: {formatDate(order.commitmentDate, 'PPP')}</span>
                  {new Date(order.commitmentDate) < new Date() && order.status !== 'delivered' && (
                    <Badge variant="destructive" className="text-xs">Vencido</Badge>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                {order.mileage && (
                  <div>
                    <span className="text-muted-foreground">Kilometraje:</span>
                    <span className="ml-2 font-medium">{order.mileage.toLocaleString()} km</span>
                  </div>
                )}
                {order.fuelLevel && (
                  <div>
                    <span className="text-muted-foreground">Combustible:</span>
                    <span className="ml-2 font-medium">{order.fuelLevel}%</span>
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
                    {order.owner.whatsappConsent && (
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
            {order.owner.whatsappConsent && (
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
                <span>{formatCurrency(order.budget.totals.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Impuestos:</span>
                <span>{formatCurrency(order.budget.totals.taxAmount)}</span>
              </div>
              {order.budget.totals.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Descuento:</span>
                  <span>-{formatCurrency(order.budget.totals.discountAmount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Total:</span>
                <span>{formatCurrency(order.budget.totals.total)}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {order.budget.approved ? (
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
                  <AvatarImage src="" alt={order.technician.name} />
                  <AvatarFallback>
                    {order.technician.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{order.technician.name}</div>
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
              <span className="font-medium">{order.timeline.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Mensajes enviados:</span>
              <span className="font-medium">{order.messages.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Facturas de repuestos:</span>
              <span className="font-medium">{order.invoices.length}</span>
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
    mutationFn: (entry: Omit<TimelineEntry, 'id' | 'orderId' | 'authorId' | 'authorName' | 'createdAt'>) =>
      timelineApi.addEntry(orderId, entry),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', orderId] });
      toast.success('Entrada agregada exitosamente');
    },
    onError: () => {
      toast.error('Error al agregar entrada');
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
        <TabsList>
          <TabsTrigger value="summary">
            <FileText className="h-4 w-4 mr-2" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="timeline">
            <Clock className="h-4 w-4 mr-2" />
            Bitácora
          </TabsTrigger>
          <TabsTrigger value="parts">
            <Package className="h-4 w-4 mr-2" />
            Repuestos
          </TabsTrigger>
          <TabsTrigger value="whatsapp">
            <MessageSquare className="h-4 w-4 mr-2" />
            WhatsApp
          </TabsTrigger>
        </TabsList>

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
                entries={order.timeline}
                onAddEntry={(entry) => addTimelineEntryMutation.mutate(entry)}
                editable={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parts" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Facturas de Repuestos</CardTitle>
              </CardHeader>
              <CardContent>
                {order.invoices.length > 0 ? (
                  <div className="space-y-4">
                    {order.invoices.map((invoice) => (
                      <Card key={invoice.id} className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium">{invoice.supplier}</h4>
                            <p className="text-sm text-muted-foreground">
                              Factura #{invoice.invoiceNumber}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">
                              {formatCurrency(invoice.amount)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              +{formatCurrency(invoice.taxAmount)} IVA
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDateTime(invoice.createdAt)}
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

            <Card>
              <CardHeader>
                <CardTitle>Subir Documentos</CardTitle>
              </CardHeader>
              <CardContent>
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
