'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/services/api';
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
  MessageSquare
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

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

function RecentActivityItem({ activity }: { activity: any }) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'order_created':
        return <FileText className="h-4 w-4" />;
      case 'status_changed':
        return <Activity className="h-4 w-4" />;
      case 'message_sent':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'order_created':
        return 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300';
      case 'status_changed':
        return 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300';
      case 'message_sent':
        return 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300';
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
        <p className="text-sm text-muted-foreground truncate">
          {activity.description}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">
            {activity.userName}
          </span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground">
            {formatDate(activity.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function DashboardContent() {

  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: () => dashboardApi.getKPIs()
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['dashboard', 'activities'],
    queryFn: () => dashboardApi.getRecentActivities(10)
  });

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
          value={kpis?.data?.openOrders || 0}
          icon={FileText}
        />
        <KPICard
          title="En Proceso"
          value={kpis?.data?.inProgressOrders || 0}
          icon={Clock}
        />
        <KPICard
          title="Entregas Hoy"
          value={kpis?.data?.deliveriesToday || 0}
          icon={Truck}
        />
        <KPICard
          title="Pendientes de Aprobación"
          value={kpis?.data?.pendingApproval || 0}
          icon={CheckCircle}
        />
      </div>

      {/* Revenue KPIs */}
      <div className="grid gap-4 md:grid-cols-2">
        <KPICard
          title="Ingresos del Mes"
          value={formatCurrency(kpis?.data?.totalRevenue || 0)}
          icon={DollarSign}
          trend="+12.5% vs mes anterior"
        />
        <KPICard
          title="Valor Promedio por Orden"
          value={formatCurrency(kpis?.data?.averageOrderValue || 0)}
          icon={TrendingUp}
          trend="+5.2% vs mes anterior"
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
            ) : activities?.data?.length ? (
              activities.data.map((activity) => (
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
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
                <div>
                  <p className="text-sm font-medium">Juan Pérez</p>
                  <p className="text-xs text-muted-foreground">Orden recibida - P123-456</p>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Entregado
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
                <div>
                  <p className="text-sm font-medium">Transportes El Salvador</p>
                  <p className="text-xs text-muted-foreground">Presupuesto listo - M789-012</p>
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  Enviado
                </Badge>
              </div>
              <div className="text-center py-2">
                <p className="text-xs text-muted-foreground">
                  Ver todos los mensajes →
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
