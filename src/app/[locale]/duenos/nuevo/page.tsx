'use client';

import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { OwnerForm, OwnerFormData } from '@/components/owners/owner-form';
import { ownersApi } from '@/services/supabase-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NewOwnerPage() {
  const router = useRouter();

  const handleSubmit = async (data: OwnerFormData) => {
    try {
      const response = await ownersApi.createOwner({
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
        toast.success(response.message || 'Cliente creado exitosamente');
        router.push('/es/duenos');
        router.refresh();
      } else {
        toast.error(response.error || 'Error al crear el cliente');
      }
    } catch (error) {
      toast.error('Error al crear el cliente');
      console.error(error);
    }
  };

  const handleCancel = () => {
    router.push('/es/duenos');
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/es/duenos')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nuevo Cliente</h1>
            <p className="text-muted-foreground">
              Registra un nuevo cliente o empresa
            </p>
          </div>
        </div>

        {/* Form */}
        <OwnerForm onSubmit={handleSubmit} onCancel={handleCancel} />
      </div>
    </MainLayout>
  );
}
