import { MainLayout } from '@/components/layout/main-layout';
import { VehicleDetailContent } from '@/components/vehicles/vehicle-detail-content';

interface VehicleDetailPageProps {
  params: {
    id: string;
    locale: string;
  };
  searchParams: {
    tab?: string;
  };
}

export default function VehicleDetailPage({ params, searchParams }: VehicleDetailPageProps) {
  return (
    <MainLayout>
      <VehicleDetailContent 
        vehicleId={params.id} 
        defaultTab={searchParams.tab}
      />
    </MainLayout>
  );
}
