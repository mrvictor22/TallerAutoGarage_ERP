'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Vehicle } from '@/types/database';
import { ownersApi } from '@/services/supabase-api';
import { Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';

const vehicleFormSchema = z.object({
  owner_id: z.string().min(1, 'Debe seleccionar un propietario'),
  plate: z.string().min(2, 'La placa debe tener al menos 2 caracteres'),
  brand: z.string().min(2, 'La marca debe tener al menos 2 caracteres'),
  model: z.string().min(2, 'El modelo debe tener al menos 2 caracteres'),
  year: z.number().min(1900, 'Año inválido').max(new Date().getFullYear() + 1, 'Año inválido'),
  color: z.string().optional().or(z.literal('')),
  vin: z.string().optional().or(z.literal('')),
  engine: z.string().optional().or(z.literal('')),
  transmission: z.string().optional().or(z.literal('')),
  fuel_type: z.string().optional().or(z.literal('')),
  mileage: z.number().optional().nullable(),
  notes: z.string().optional().or(z.literal('')),
});

export type VehicleFormData = z.infer<typeof vehicleFormSchema>;

interface VehicleFormProps {
  initialData?: Partial<Vehicle>;
  preSelectedOwnerId?: string;
  onSubmit: (data: VehicleFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function VehicleForm({
  initialData,
  preSelectedOwnerId,
  onSubmit,
  onCancel,
  isLoading
}: VehicleFormProps) {
  const [ownerSearch, setOwnerSearch] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: {
      owner_id: preSelectedOwnerId || initialData?.owner_id || '',
      plate: initialData?.plate || '',
      brand: initialData?.brand || '',
      model: initialData?.model || '',
      year: initialData?.year || new Date().getFullYear(),
      color: initialData?.color || '',
      vin: initialData?.vin || '',
      engine: initialData?.engine || '',
      transmission: initialData?.transmission || '',
      fuel_type: initialData?.fuel_type || '',
      mileage: initialData?.mileage || null,
      notes: initialData?.notes || '',
    }
  });

  const ownerId = watch('owner_id');

  // Fetch owners for selector
  const { data: ownersResponse, isLoading: ownersLoading } = useQuery({
    queryKey: ['owners', { search: ownerSearch }],
    queryFn: () => ownersApi.getOwners({ search: ownerSearch }, 1, 50)
  });

  const owners = ownersResponse?.success ? ownersResponse.data?.data || [] : [];

  const handleFormSubmit = async (data: VehicleFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Owner Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Propietario</CardTitle>
          <CardDescription>
            Seleccione el propietario del vehículo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="owner_id">
              Propietario <span className="text-red-500">*</span>
            </Label>
            {preSelectedOwnerId ? (
              <div className="text-sm text-muted-foreground">
                Propietario preseleccionado
              </div>
            ) : (
              <>
                <Select
                  value={ownerId}
                  onValueChange={(value) => setValue('owner_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un propietario" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar propietario..."
                          value={ownerSearch}
                          onChange={(e) => setOwnerSearch(e.target.value)}
                          className="pl-8"
                        />
                      </div>
                    </div>
                    {ownersLoading ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        Cargando...
                      </div>
                    ) : owners.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No se encontraron propietarios
                      </div>
                    ) : (
                      owners.map((owner) => (
                        <SelectItem key={owner.id} value={owner.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{owner.name}</span>
                            <span className="text-xs text-muted-foreground">{owner.phone}</span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.owner_id && (
                  <p className="text-sm text-red-500">{errors.owner_id.message}</p>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Información Básica</CardTitle>
          <CardDescription>
            Información principal del vehículo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plate">
                Placa <span className="text-red-500">*</span>
              </Label>
              <Input
                id="plate"
                placeholder="Ej: P123456"
                {...register('plate')}
              />
              {errors.plate && (
                <p className="text-sm text-red-500">{errors.plate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="vin">VIN / Número de Serie</Label>
              <Input
                id="vin"
                placeholder="Ej: 1HGBH41JXMN109186"
                {...register('vin')}
              />
              {errors.vin && (
                <p className="text-sm text-red-500">{errors.vin.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand">
                Marca <span className="text-red-500">*</span>
              </Label>
              <Input
                id="brand"
                placeholder="Ej: Toyota"
                {...register('brand')}
              />
              {errors.brand && (
                <p className="text-sm text-red-500">{errors.brand.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">
                Modelo <span className="text-red-500">*</span>
              </Label>
              <Input
                id="model"
                placeholder="Ej: Corolla"
                {...register('model')}
              />
              {errors.model && (
                <p className="text-sm text-red-500">{errors.model.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year">
                Año <span className="text-red-500">*</span>
              </Label>
              <Input
                id="year"
                type="number"
                placeholder="Ej: 2020"
                {...register('year', { valueAsNumber: true })}
              />
              {errors.year && (
                <p className="text-sm text-red-500">{errors.year.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                placeholder="Ej: Blanco"
                {...register('color')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mileage">Kilometraje</Label>
              <Input
                id="mileage"
                type="number"
                placeholder="Ej: 50000"
                {...register('mileage', {
                  valueAsNumber: true,
                  setValueAs: (v) => v === '' ? null : Number(v)
                })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technical Specifications */}
      <Card>
        <CardHeader>
          <CardTitle>Especificaciones Técnicas</CardTitle>
          <CardDescription>
            Información técnica del vehículo (opcional)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="engine">Motor</Label>
              <Input
                id="engine"
                placeholder="Ej: 2.0L 4 cilindros"
                {...register('engine')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transmission">Transmisión</Label>
              <Select
                value={watch('transmission') || ''}
                onValueChange={(value) => setValue('transmission', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin especificar</SelectItem>
                  <SelectItem value="Manual">Manual</SelectItem>
                  <SelectItem value="Automática">Automática</SelectItem>
                  <SelectItem value="CVT">CVT</SelectItem>
                  <SelectItem value="Semi-automática">Semi-automática</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fuel_type">Tipo de Combustible</Label>
              <Select
                value={watch('fuel_type') || ''}
                onValueChange={(value) => setValue('fuel_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin especificar</SelectItem>
                  <SelectItem value="Gasolina">Gasolina</SelectItem>
                  <SelectItem value="Diesel">Diesel</SelectItem>
                  <SelectItem value="Eléctrico">Eléctrico</SelectItem>
                  <SelectItem value="Híbrido">Híbrido</SelectItem>
                  <SelectItem value="Gas">Gas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Notas Adicionales</CardTitle>
          <CardDescription>
            Información adicional sobre el vehículo (opcional)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            id="notes"
            placeholder="Modificaciones, historial de daños, preferencias del propietario, etc."
            rows={4}
            {...register('notes')}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting || isLoading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting || isLoading}>
          {(isSubmitting || isLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? 'Actualizar Vehículo' : 'Crear Vehículo'}
        </Button>
      </div>
    </form>
  );
}
