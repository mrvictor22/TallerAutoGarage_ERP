import { MainLayout } from '@/components/layout/main-layout';
import { OwnerDetailContent } from '@/components/owners/owner-detail-content';

interface OwnerDetailPageProps {
  params: {
    id: string;
    locale: string;
  };
  searchParams: {
    tab?: string;
  };
}

export default function OwnerDetailPage({ params, searchParams }: OwnerDetailPageProps) {
  return (
    <MainLayout>
      <OwnerDetailContent 
        ownerId={params.id} 
        defaultTab={searchParams.tab}
      />
    </MainLayout>
  );
}
