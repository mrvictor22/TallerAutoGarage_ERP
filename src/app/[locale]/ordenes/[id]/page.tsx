import { MainLayout } from '@/components/layout/main-layout';
import { OrderDetailContent } from '@/components/orders/order-detail-content';

interface OrderDetailPageProps {
  params: {
    id: string;
    locale: string;
  };
  searchParams: {
    tab?: string;
  };
}

export default function OrderDetailPage({ params, searchParams }: OrderDetailPageProps) {
  return (
    <MainLayout>
      <OrderDetailContent orderId={params.id} defaultTab={searchParams.tab} />
    </MainLayout>
  );
}
