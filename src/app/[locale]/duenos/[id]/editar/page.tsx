'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/main-layout';
import { OwnerForm, OwnerFormData } from '@/components/owners/owner-form';
import { ownersApi } from '@/services/supabase-api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

export default function EditOwnerPage({ params }: { params: { id: string } }) {
  const router = useRouter();

  // Fetch owner details
  const { data: ownerResponse, isLoading, error } = useQuery({
    queryKey: ['owner', params.id],
    queryFn: () => ownersApi.getOwner(params.id)
  });

  const owner = ownerResponse?.success ? ownerResponse.data : null;

  const handleSubmit = async (data: OwnerFormData) => {
    try {
      const response = await ownersApi.updateOwner(params.id, {
        name: data.name,
        type: data.type,
        email: data.email || null,
        phone: data.phone,
        phone_secondary: data.phone_secondary || null,
        whatsapp_consent: data.whatsapp_consent,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        postal_code: data.postal_code || null,
        tax_id: data.tax_id || null,
        company_name: data.company_name || null,
        contact_person: data.contact_person || null,
        notes: data.notes || null,
      });

      if (response.success) {
        toast.success(response.message || 'Cliente actualizado exitosamente');
        router.push(`/es/duenos/${params.id}`);
        router.refresh();
      } else {
        toast.error(response.error || 'Error al actualizar el cliente');
      }
    } catch (error) {
      toast.error('Error al actualizar el cliente');
      console.error(error);
    }
  };

  const handleCancel = () => {
    router.push(`/es/duenos/${params.id}`);
  };

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
          <Skeleton className="h-96 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (error || !owner) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Cliente no encontrado</h3>
          <p className="text-muted-foreground mb-4">
            El cliente que intentas editar no existe o ha sido eliminado
          </p>
          <Button onClick={() => router.push('/es/duenos')}>
            Volver a la lista
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/es/duenos/${params.id}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Editar Cliente</h1>
            <p className="text-muted-foreground">
              Actualiza la información de {owner.name}
            </p>
          </div>
        </div>

        {/* Form */}
        <OwnerForm initialData={owner} onSubmit={handleSubmit} onCancel={handleCancel} />
      </div>
    </MainLayout>
  );
}
