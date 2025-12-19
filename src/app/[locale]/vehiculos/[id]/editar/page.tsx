'use client';

import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/main-layout';
import { VehicleForm, VehicleFormData } from '@/components/vehicles/vehicle-form';
import { vehiclesApi } from '@/services/supabase-api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface VehicleEditPageProps {
  params: {
    id: string;
    locale: string;
  };
}

export default function VehicleEditPage({ params }: VehicleEditPageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const vehicleId = params.id;

  // Fetch vehicle data
  const { data: vehicleResponse, isLoading, error } = useQuery({
    queryKey: ['vehicle', vehicleId],
    queryFn: async () => {
      const response = await vehiclesApi.getVehicle(vehicleId);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch vehicle');
      }
      return response.data;
    }
  });

  const vehicle = vehicleResponse;

  const updateVehicleMutation = useMutation({
    mutationFn: async (data: VehicleFormData) => {
      const response = await vehiclesApi.updateVehicle(vehicleId, {
        owner_id: data.owner_id,
        plate: data.plate,
        brand: data.brand,
        model: data.model,
        year: data.year,
        color: data.color || null,
        vin: data.vin || null,
        engine: data.engine || null,
        transmission: data.transmission || null,
        fuel_type: data.fuel_type || null,
        mileage: data.mileage || null,
        notes: data.notes || null,
      });

      if (!response.success) {
        throw new Error(response.error || 'Error al actualizar vehículo');
      }

      return response.data;
    },
    onSuccess: () => {
      toast.success('Vehículo actualizado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['vehicle', vehicleId] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      if (vehicle?.owner_id) {
        queryClient.invalidateQueries({ queryKey: ['vehicles', { owner_id: vehicle.owner_id }] });
        queryClient.invalidateQueries({ queryKey: ['owner', vehicle.owner_id] });
      }
      router.push(`/vehiculos/${vehicleId}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar vehículo');
    }
  });

  const handleSubmit = async (data: VehicleFormData) => {
    await updateVehicleMutation.mutateAsync(data);
  };

  const handleCancel = () => {
    router.push(`/vehiculos/${vehicleId}`);
  };

  if (error) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-center">
            <h3 className="text-lg font-medium mb-2">Error al cargar vehículo</h3>
            <p className="text-muted-foreground mb-4">
              No se pudo cargar la información del vehículo
            </p>
            <Button onClick={() => router.push('/vehiculos')} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a la lista
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <Skeleton className="h-96" />
        </div>
      </MainLayout>
    );
  }

  if (!vehicle) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-center">
            <h3 className="text-lg font-medium mb-2">Vehículo no encontrado</h3>
            <p className="text-muted-foreground mb-4">
              El vehículo que buscas no existe o ha sido eliminado
            </p>
            <Button onClick={() => router.push('/vehiculos')} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a la lista
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Editar Vehículo</h1>
            <p className="text-muted-foreground">
              {vehicle.brand} {vehicle.model} - {vehicle.plate}
            </p>
          </div>
        </div>

        {/* Form */}
        <VehicleForm
          initialData={vehicle}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={updateVehicleMutation.isPending}
        />
      </div>
    </MainLayout>
  );
}
