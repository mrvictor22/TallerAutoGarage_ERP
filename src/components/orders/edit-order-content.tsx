'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi, ownersApi, vehiclesApi, usersApi } from '@/services/supabase-api';
import { OrderUpdate } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Save, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { VehicleInspection } from '@/components/inspection/vehicle-inspection';
import type { VehicleInspection as VehicleInspectionData, VehicleBodyType } from '@/types/inspection';

interface EditOrderContentProps {
  orderId: string;
}

export function EditOrderContent({ orderId }: EditOrderContentProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Form state
  const [reason, setReason] = useState('');
  const [customerComplaints, setCustomerComplaints] = useState('');
  const [technicianId, setTechnicianId] = useState<string>('');
  const [entryMileage, setEntryMileage] = useState('');
  const [fuelLevel, setFuelLevel] = useState(0);
  const [commitmentDate, setCommitmentDate] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [priority, setPriority] = useState('1');
  const [inspectionData, setInspectionData] = useState<VehicleInspectionData | null>(null);
  const [vehicleBodyType, setVehicleBodyType] = useState<VehicleBodyType | null>(null);
  const [showInspection, setShowInspection] = useState(false);

  // Fetch order data
  const { data: orderResponse, isLoading: orderLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const response = await ordersApi.getOrder(orderId);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch order');
      }
      return response.data;
    }
  });

  const order = orderResponse;

  // Fetch technicians
  const { data: techniciansResponse } = useQuery({
    queryKey: ['technicians'],
    queryFn: async () => {
      const response = await usersApi.getTechnicians();
      if (!response.success) {
        toast.error('Error al cargar técnicos');
        return null;
      }
      return response.data;
    }
  });

  const technicians = techniciansResponse || [];

  // Initialize form with order data
  useEffect(() => {
    if (order) {
      setReason(order.reason || '');
      setCustomerComplaints(order.customer_complaints || '');
      setTechnicianId(order.technician_id || '');
      setEntryMileage(order.entry_mileage?.toString() || '');
      setFuelLevel(order.fuel_level ?? 0);
      setCommitmentDate(order.commitment_date || '');
      setInternalNotes(order.internal_notes || '');
      setPriority(order.priority?.toString() || '1');
      setInspectionData(order.inspection_data as unknown as VehicleInspectionData | null);
      setVehicleBodyType((order.vehicle_body_type as VehicleBodyType) ?? null);
      if (order.inspection_data) {
        setShowInspection(true);
      }
    }
  }, [order]);

  // Update order mutation
  const updateOrderMutation = useMutation({
    mutationFn: async (data: OrderUpdate) => {
      const response = await ordersApi.updateOrder(orderId, data);
      if (!response.success) {
        throw new Error(response.error || 'Error al actualizar orden');
      }
      return response.data;
    },
    onSuccess: () => {
      toast.success('Orden actualizada exitosamente');
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      router.push(`/es/ordenes/${orderId}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar orden');
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason) {
      toast.error('El motivo de la orden es obligatorio');
      return;
    }

    const orderData: OrderUpdate = {
      reason,
      customer_complaints: customerComplaints || null,
      technician_id: technicianId || null,
      entry_mileage: entryMileage ? parseInt(entryMileage) : null,
      fuel_level: fuelLevel || null,
      commitment_date: commitmentDate || null,
      internal_notes: internalNotes || null,
      priority: parseInt(priority) || 1,
      inspection_data: inspectionData as unknown as OrderUpdate['inspection_data'],
      vehicle_body_type: vehicleBodyType || null,
    };

    updateOrderMutation.mutate(orderData);
  };

  const handleCancel = () => {
    router.push(`/es/ordenes/${orderId}`);
  };

  if (orderLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">Orden no encontrada</h3>
          <p className="text-muted-foreground mb-4">
            La orden que buscas no existe o ha sido eliminada
          </p>
          <Button onClick={() => router.push('/es/ordenes')} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a la lista
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar Orden</h1>
          <p className="text-muted-foreground">
            Folio: {order.folio}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Order Information */}
        <Card>
          <CardHeader>
            <CardTitle>Información de la Orden</CardTitle>
            <CardDescription>
              Edita los detalles de la orden de trabajo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Cliente y Vehículo (solo lectura) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Cliente</Label>
                <Input
                  value={order.owner?.name || 'Sin cliente'}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div>
                <Label>Vehículo</Label>
                <Input
                  value={
                    order.vehicle
                      ? `${order.vehicle.brand} ${order.vehicle.model} - ${order.vehicle.plate}`
                      : 'Sin vehículo'
                  }
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>

            {/* Motivo del servicio */}
            <div>
              <Label htmlFor="reason">Motivo del Servicio *</Label>
              <Input
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Mantenimiento preventivo, reparación, revisión, etc."
                required
              />
            </div>

            {/* Quejas del cliente */}
            <div>
              <Label htmlFor="complaints">Quejas/Descripción del Cliente</Label>
              <Textarea
                id="complaints"
                value={customerComplaints}
                onChange={(e) => setCustomerComplaints(e.target.value)}
                placeholder="Describe lo que el cliente reporta..."
                rows={3}
              />
            </div>

            {/* Técnico asignado */}
            <div>
              <Label htmlFor="technician">Técnico Asignado</Label>
              <Select
                value={technicianId || '__none__'}
                onValueChange={(value) => setTechnicianId(value === '__none__' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar técnico" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sin asignar</SelectItem>
                  {technicians.map((tech) => (
                    <SelectItem key={tech.id} value={tech.id}>
                      {tech.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Prioridad */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="priority">Prioridad</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Normal</SelectItem>
                    <SelectItem value="2">Alta</SelectItem>
                    <SelectItem value="3">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Fecha compromiso */}
            <div>
              <Label htmlFor="commitment">Fecha de Compromiso</Label>
              <Input
                id="commitment"
                type="date"
                value={commitmentDate}
                onChange={(e) => setCommitmentDate(e.target.value)}
              />
            </div>

            {/* Notas internas */}
            <div>
              <Label htmlFor="notes">Notas Internas</Label>
              <Textarea
                id="notes"
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Notas internas del taller (no visibles para el cliente)"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Inspection Section (collapsible) */}
        <Card className="mt-6">
          <CardHeader
            className="cursor-pointer select-none"
            onClick={() => setShowInspection(!showInspection)}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                Inspección del Vehículo
                {inspectionData && (
                  <Badge variant="secondary" className="text-xs">
                    {inspectionData.markers?.length || 0} daños
                  </Badge>
                )}
              </CardTitle>
              {showInspection ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <CardDescription>
              Kilometraje, combustible y estado del vehículo al ingreso
            </CardDescription>
          </CardHeader>
          {showInspection && (
            <CardContent>
              <VehicleInspection
                value={inspectionData}
                onChange={setInspectionData}
                fuelLevel={fuelLevel}
                onFuelLevelChange={setFuelLevel}
                entryMileage={entryMileage}
                onEntryMileageChange={setEntryMileage}
                bodyType={vehicleBodyType}
                onBodyTypeChange={setVehicleBodyType}
              />
            </CardContent>
          )}
        </Card>

        {/* Action buttons */}
        <div className="flex justify-end gap-2 mt-6">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={updateOrderMutation.isPending}>
            {updateOrderMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
