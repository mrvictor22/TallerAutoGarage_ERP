'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Owner, OwnerType } from '@/types/database';
import { validatePhone, validateEmail } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const ownerFormSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  type: z.enum(['person', 'company'] as const),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().min(8, 'Teléfono inválido'),
  phone_secondary: z.string().optional().or(z.literal('')),
  whatsapp_consent: z.boolean(),
  address: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  postal_code: z.string().optional().or(z.literal('')),
  tax_id: z.string().optional().or(z.literal('')),
  company_name: z.string().optional().or(z.literal('')),
  contact_person: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

export type OwnerFormData = z.infer<typeof ownerFormSchema>;

interface OwnerFormProps {
  initialData?: Partial<Owner>;
  onSubmit: (data: OwnerFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function OwnerForm({ initialData, onSubmit, onCancel, isLoading }: OwnerFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<OwnerFormData>({
    resolver: zodResolver(ownerFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      type: (initialData?.type as OwnerType) || 'person',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      phone_secondary: initialData?.phone_secondary || '',
      whatsapp_consent: initialData?.whatsapp_consent || false,
      address: initialData?.address || '',
      city: initialData?.city || '',
      state: initialData?.state || '',
      postal_code: initialData?.postal_code || '',
      tax_id: initialData?.tax_id || '',
      company_name: initialData?.company_name || '',
      contact_person: initialData?.contact_person || '',
      notes: initialData?.notes || '',
    }
  });

  const ownerType = watch('type');
  const whatsappConsent = watch('whatsapp_consent');

  const handleFormSubmit = async (data: OwnerFormData) => {
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Información Básica</CardTitle>
          <CardDescription>
            Información principal del cliente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">
                Tipo de Cliente <span className="text-red-500">*</span>
              </Label>
              <Select
                value={ownerType}
                onValueChange={(value) => setValue('type', value as OwnerType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="person">Persona</SelectItem>
                  <SelectItem value="company">Empresa</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-red-500">{errors.type.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">
                {ownerType === 'company' ? 'Nombre de la Empresa' : 'Nombre Completo'}{' '}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder={
                  ownerType === 'company' ? 'Ej: Taller Mecánico ABC' : 'Ej: Juan Pérez'
                }
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>
          </div>

          {ownerType === 'company' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Razón Social</Label>
                <Input
                  id="company_name"
                  placeholder="Nombre legal de la empresa"
                  {...register('company_name')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_person">Persona de Contacto</Label>
                <Input
                  id="contact_person"
                  placeholder="Ej: María González"
                  {...register('contact_person')}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="tax_id">
              {ownerType === 'company' ? 'NIT' : 'DUI / NIT'}
            </Label>
            <Input
              id="tax_id"
              placeholder={ownerType === 'company' ? 'Ej: 0614-123456-123-4' : 'Ej: 01234567-8'}
              {...register('tax_id')}
            />
            {errors.tax_id && (
              <p className="text-sm text-red-500">{errors.tax_id.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Información de Contacto</CardTitle>
          <CardDescription>
            Teléfono, email y dirección del cliente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">
                Teléfono Principal <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Ej: 7123-4567"
                {...register('phone')}
              />
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone_secondary">Teléfono Secundario</Label>
              <Input
                id="phone_secondary"
                type="tel"
                placeholder="Ej: 2234-5678"
                {...register('phone_secondary')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="ejemplo@correo.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="whatsapp_consent"
              checked={whatsappConsent}
              onCheckedChange={(checked) => setValue('whatsapp_consent', checked as boolean)}
            />
            <Label htmlFor="whatsapp_consent" className="text-sm font-normal cursor-pointer">
              Cliente autoriza recibir notificaciones por WhatsApp
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Address Information */}
      <Card>
        <CardHeader>
          <CardTitle>Dirección</CardTitle>
          <CardDescription>
            Ubicación del cliente (opcional)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Dirección</Label>
            <Textarea
              id="address"
              placeholder="Calle, número, colonia..."
              rows={2}
              {...register('address')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Ciudad / Municipio</Label>
              <Input
                id="city"
                placeholder="Ej: San Salvador"
                {...register('city')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">Departamento</Label>
              <Input
                id="state"
                placeholder="Ej: San Salvador"
                {...register('state')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="postal_code">Código Postal</Label>
              <Input
                id="postal_code"
                placeholder="Ej: 1101"
                {...register('postal_code')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Notas Adicionales</CardTitle>
          <CardDescription>
            Información adicional sobre el cliente (opcional)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            id="notes"
            placeholder="Notas internas, preferencias del cliente, etc."
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
          {initialData ? 'Actualizar Cliente' : 'Crear Cliente'}
        </Button>
      </div>
    </form>
  );
}
