'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/main-layout';
import { VehicleForm, VehicleFormData } from '@/components/vehicles/vehicle-form';
import { vehiclesApi } from '@/services/supabase-api';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function NewVehiclePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [preSelectedOwnerId, setPreSelectedOwnerId] = useState<string | undefined>();

  useEffect(() => {
    // Support both ownerId and owner_id parameters
    const ownerId = searchParams.get('ownerId') || searchParams.get('owner_id');
    if (ownerId) {
      setPreSelectedOwnerId(ownerId);
    }
  }, [searchParams]);

  const createVehicleMutation = useMutation({
    mutationFn: async (data: VehicleFormData) => {
      const response = await vehiclesApi.createVehicle({
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
        throw new Error(response.error || 'Error al crear vehículo');
      }

      return response.data;
    },
    onSuccess: (vehicle) => {
      toast.success('Vehículo creado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      if (preSelectedOwnerId) {
        queryClient.invalidateQueries({ queryKey: ['vehicles', { owner_id: preSelectedOwnerId }] });
        queryClient.invalidateQueries({ queryKey: ['owner', preSelectedOwnerId] });
      }
      router.push(`/es/vehiculos/${vehicle?.id}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al crear vehículo');
    }
  });

  const handleSubmit = async (data: VehicleFormData) => {
    await createVehicleMutation.mutateAsync(data);
  };

  const handleCancel = () => {
    if (preSelectedOwnerId) {
      router.push(`/es/duenos/${preSelectedOwnerId}?tab=vehiculos`);
    } else {
      router.push('/es/vehiculos');
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nuevo Vehículo</h1>
            <p className="text-muted-foreground">
              Registra un nuevo vehículo en el sistema
            </p>
          </div>
        </div>

        {/* Form */}
        <VehicleForm
          preSelectedOwnerId={preSelectedOwnerId}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={createVehicleMutation.isPending}
        />
      </div>
    </MainLayout>
  );
}
