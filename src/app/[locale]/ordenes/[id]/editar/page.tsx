import { MainLayout } from '@/components/layout/main-layout';
import { EditOrderContent } from '@/components/orders/edit-order-content';

interface OrderEditPageProps {
  params: {
    id: string;
    locale: string;
  };
}

export default function OrderEditPage({ params }: OrderEditPageProps) {
  return (
    <MainLayout>
      <EditOrderContent orderId={params.id} />
    </MainLayout>
  );
}
