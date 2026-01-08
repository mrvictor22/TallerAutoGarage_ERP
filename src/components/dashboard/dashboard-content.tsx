'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/services/supabase-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FileText,
  Clock,
  Truck,
  CheckCircle,
  DollarSign,
  TrendingUp,
  Activity,
  MessageSquare,
  Package
} from 'lucide-react';
import { WelcomeModal } from './welcome-modal';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { TimelineEntry, WhatsAppMessage, Owner, Order } from '@/types/database';

function KPICard({ 
  title, 
  value, 
  icon,
  trend 
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  trend?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {React.createElement(icon, { className: "h-4 w-4 text-muted-foreground" })}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <div className="flex items-center text-xs text-green-600 mt-1">
            <TrendingUp className="h-3 w-3 mr-1" />
            {trend}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RecentActivityItem({ activity }: { activity: TimelineEntry & { author?: { full_name: string } } }) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'status_change':
        return <Activity className="h-4 w-4" />;
      case 'message_sent':
        return <MessageSquare className="h-4 w-4" />;
      case 'note':
      case 'task':
      case 'diagnosis':
      case 'labor':
      case 'parts_purchase':
        return <FileText className="h-4 w-4" />;
      case 'payment':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'status_change':
        return 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300';
      case 'message_sent':
        return 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300';
      case 'payment':
        return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300';
      case 'diagnosis':
        return 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300';
      case 'labor':
        return 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300';
      case 'parts_purchase':
        return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
      <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
        {getActivityIcon(activity.type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">
          {activity.title}
        </p>
        {activity.description && (
          <p className="text-sm text-muted-foreground truncate">
            {activity.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1">
          {activity.author?.full_name && (
            <>
              <span className="text-xs text-muted-foreground">
                {activity.author.full_name}
              </span>
              <span className="text-xs text-muted-foreground">•</span>
            </>
          )}
          <span className="text-xs text-muted-foreground">
            {formatDate(activity.created_at)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function DashboardContent() {

  const { data: kpisResponse, isLoading: kpisLoading } = useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: () => dashboardApi.getKPIs(),
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const { data: activitiesResponse, isLoading: activitiesLoading } = useQuery({
    queryKey: ['dashboard', 'activities'],
    queryFn: () => dashboardApi.getRecentActivity(10),
    refetchInterval: 30000
  });

  const { data: messagesResponse, isLoading: messagesLoading } = useQuery({
    queryKey: ['dashboard', 'messages'],
    queryFn: () => dashboardApi.getRecentMessages(5),
    refetchInterval: 30000
  });

  const kpis = kpisResponse?.data;
  const activities = activitiesResponse?.data;
  const messages = messagesResponse?.data;

  if (kpisLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Panel de Control</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Modal */}
      <WelcomeModal />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Panel de Control</h1>
        <p className="text-muted-foreground">
          Resumen general de las operaciones del taller
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Órdenes Abiertas"
          value={kpis?.openOrders || 0}
          icon={FileText}
        />
        <KPICard
          title="En Proceso"
          value={kpis?.inProgressOrders || 0}
          icon={Clock}
        />
        <KPICard
          title="Completadas Hoy"
          value={kpis?.completedToday || 0}
          icon={Truck}
        />
        <KPICard
          title="Pendientes de Pago"
          value={kpis?.pendingPayment || 0}
          icon={CheckCircle}
        />
      </div>

      {/* Revenue KPIs - Ganancias = solo mano de obra */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Ganancias del Mes"
          value={formatCurrency(kpis?.revenueThisMonth || 0)}
          icon={DollarSign}
        />
        <KPICard
          title="Ganancias Totales"
          value={formatCurrency(kpis?.totalRevenue || 0)}
          icon={TrendingUp}
        />
        <KPICard
          title="Repuestos del Mes"
          value={formatCurrency(kpis?.partsExpenseThisMonth || 0)}
          icon={Package}
        />
        <KPICard
          title="Repuestos Totales"
          value={formatCurrency(kpis?.totalPartsExpense || 0)}
          icon={Package}
        />
      </div>

      {/* Recent Activities */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Actividades Recientes
            </CardTitle>
            <CardDescription>
              Últimas actividades en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {activitiesLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-3 p-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))
            ) : activities?.length ? (
              activities.map((activity) => (
                <RecentActivityItem key={activity.id} activity={activity} />
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay actividades recientes
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Mensajes Recientes
            </CardTitle>
            <CardDescription>
              Mensajes WhatsApp enviados recientemente
            </CardDescription>
          </CardHeader>
          <CardContent>
            {messagesLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                ))}
              </div>
            ) : messages?.length ? (
              <div className="space-y-3">
                {messages.map((message: WhatsAppMessage & { owner?: Pick<Owner, 'name'>; order?: Pick<Order, 'folio'> }) => {
                  const getStatusBadge = (status: string) => {
                    switch (status) {
                      case 'delivered':
                        return (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                            Entregado
                          </Badge>
                        );
                      case 'sent':
                        return (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                            Enviado
                          </Badge>
                        );
                      case 'read':
                        return (
                          <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                            Leído
                          </Badge>
                        );
                      case 'failed':
                        return (
                          <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                            Error
                          </Badge>
                        );
                      default:
                        return (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300">
                            Pendiente
                          </Badge>
                        );
                    }
                  };

                  return (
                    <div key={message.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {message.owner?.name || 'Cliente desconocido'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {message.content.substring(0, 50)}
                          {message.content.length > 50 ? '...' : ''}
                          {message.order?.folio && ` - ${message.order.folio}`}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(message.created_at)}
                        </p>
                      </div>
                      {getStatusBadge(message.status)}
                    </div>
                  );
                })}
                <div className="text-center py-2">
                  <Link href="/es/notificaciones/whatsapp" className="text-xs text-muted-foreground hover:text-primary">
                    Ver todos los mensajes →
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay mensajes recientes
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
