import { MainLayout } from '@/components/layout/main-layout';
import { OrdersListContent } from '@/components/orders/orders-list-content';

export default function OrdersPage() {
  return (
    <MainLayout>
      <OrdersListContent />
    </MainLayout>
  );
}
