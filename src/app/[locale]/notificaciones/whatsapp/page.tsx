import { MainLayout } from '@/components/layout/main-layout';
import { WhatsAppManagementContent } from '@/components/whatsapp/whatsapp-management-content';

interface WhatsAppPageProps {
  searchParams: {
    ownerId?: string;
    vehicleId?: string;
    orderId?: string;
  };
}

export default function WhatsAppPage({ searchParams }: WhatsAppPageProps) {
  return (
    <MainLayout>
      <WhatsAppManagementContent 
        preselectedOwnerId={searchParams.ownerId}
        preselectedVehicleId={searchParams.vehicleId}
        preselectedOrderId={searchParams.orderId}
      />
    </MainLayout>
  );
}
