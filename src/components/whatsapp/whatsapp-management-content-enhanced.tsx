'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { whatsappApiEnhanced, WhatsAppMessageFilters, WhatsAppStats } from '@/services/whatsapp-api-enhanced';
import { ownersApi } from '@/services/supabase-api';
import { WhatsAppTemplate, WhatsAppMessage } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { DataTable } from '@/components/tables/data-table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDate, formatPhone } from '@/lib/utils';
import {
  MessageSquare,
  Plus,
  Edit,
  Trash2,
  Send,
  Settings,
  Users,
  FileText,
  Eye,
  Copy,
  CheckCircle,
  XCircle,
  Clock,
  Phone,
  MoreVertical,
  Filter,
  TrendingUp,
  AlertCircle,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import { ColumnDef } from '@tanstack/react-table';

export function WhatsAppManagementContentEnhanced() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('plantillas');
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [messageFilters, setMessageFilters] = useState<WhatsAppMessageFilters>({});
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<WhatsAppTemplate | null>(null);

  // Fetch templates
  const { data: templatesResponse, isLoading: templatesLoading } = useQuery({
    queryKey: ['whatsapp-templates-enhanced'],
    queryFn: () => whatsappApiEnhanced.getTemplates(true) // Include inactive
  });

  // Fetch message history
  const { data: messagesResponse, isLoading: messagesLoading } = useQuery({
    queryKey: ['whatsapp-messages-enhanced', messageFilters],
    queryFn: () => whatsappApiEnhanced.getMessages(messageFilters, 200)
  });

  // Fetch stats
  const { data: statsResponse } = useQuery({
    queryKey: ['whatsapp-stats'],
    queryFn: () => whatsappApiEnhanced.getStats()
  });

  // Fetch owners with WhatsApp consent
  const { data: ownersResponse } = useQuery({
    queryKey: ['owners', { has_whatsapp_consent: true }],
    queryFn: () => ownersApi.getOwners({ has_whatsapp_consent: true }, 1, 100)
  });

  const templates = templatesResponse?.data || [];
  const messages = messagesResponse?.data || [];
  const stats: WhatsAppStats | undefined = statsResponse?.data;
  const owners = ownersResponse?.data?.data || [];

  // Mutations
  const createTemplateMutation = useMutation({
    mutationFn: (template: Omit<WhatsAppTemplate, 'id' | 'created_at' | 'updated_at'>) =>
      whatsappApiEnhanced.createTemplate(template),
    onSuccess: () => {
      toast.success('Plantilla creada exitosamente');
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates-enhanced'] });
      setIsTemplateDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al crear plantilla');
    }
  });

  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, template }: { id: string; template: Partial<WhatsAppTemplate> }) =>
      whatsappApiEnhanced.updateTemplate(id, template),
    onSuccess: () => {
      toast.success('Plantilla actualizada exitosamente');
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates-enhanced'] });
      setIsTemplateDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar plantilla');
    }
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id: string) => whatsappApiEnhanced.deleteTemplate(id),
    onSuccess: () => {
      toast.success('Plantilla eliminada exitosamente');
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates-enhanced'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al eliminar plantilla');
    }
  });

  const duplicateTemplateMutation = useMutation({
    mutationFn: (id: string) => whatsappApiEnhanced.duplicateTemplate(id),
    onSuccess: () => {
      toast.success('Plantilla duplicada exitosamente');
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates-enhanced'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al duplicar plantilla');
    }
  });

  // Template columns
  const templateColumns: ColumnDef<WhatsAppTemplate>[] = [
    {
      accessorKey: 'name',
      header: 'Nombre',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.name}</div>
          <div className="text-xs text-muted-foreground">
            {row.original.variables.length} variable(s)
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Categoría',
      cell: ({ row }) => {
        const category = row.getValue('category') as string;
        const categoryLabels: Record<string, string> = {
          order_status: 'Estado de Orden',
          appointment: 'Cita',
          reminder: 'Recordatorio',
          promotion: 'Promoción',
          general: 'General'
        };
        return (
          <Badge variant="outline">
            {categoryLabels[category] || category}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'is_active',
      header: 'Estado',
      cell: ({ row }) => {
        const isActive = row.getValue('is_active') as boolean;
        return (
          <Badge variant={isActive ? 'default' : 'secondary'}>
            {isActive ? 'Activa' : 'Inactiva'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'content',
      header: 'Contenido',
      cell: ({ row }) => {
        const content = row.getValue('content') as string;
        return (
          <div className="max-w-xs truncate text-sm text-muted-foreground" title={content}>
            {content}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => {
        const template = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleViewTemplate(template)}>
                <Eye className="mr-2 h-4 w-4" />
                Ver Preview
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEditTemplate(template)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDuplicateTemplate(template)}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDeleteTemplate(template.id)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Message columns
  const messageColumns: ColumnDef<WhatsAppMessage>[] = [
    {
      accessorKey: 'created_at',
      header: 'Fecha',
      cell: ({ row }) => {
        const date = row.getValue('created_at') as string;
        return <span className="text-sm">{formatDate(date)}</span>;
      },
    },
    {
      accessorKey: 'phone_number',
      header: 'Destinatario',
      cell: ({ row }) => {
        const message = row.original;
        const owner = owners.find(o => o.id === message.owner_id);
        return (
          <div>
            <div className="font-medium text-sm">{owner?.name || 'Cliente'}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {formatPhone(message.phone_number)}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'template_id',
      header: 'Plantilla',
      cell: ({ row }) => {
        const message = row.original;
        const template = templates.find(t => t.id === message.template_id);
        return (
          <Badge variant="outline" className="text-xs">
            {template?.name || 'Sin plantilla'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        const statusConfig = {
          pending: { label: 'Pendiente', icon: Clock, variant: 'outline' as const },
          sent: { label: 'Enviado', icon: Send, variant: 'default' as const },
          delivered: { label: 'Entregado', icon: CheckCircle, variant: 'secondary' as const },
          read: { label: 'Leído', icon: CheckCircle, variant: 'default' as const },
          failed: { label: 'Fallido', icon: XCircle, variant: 'destructive' as const }
        };
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
        const Icon = config.icon;
        return (
          <Badge variant={config.variant} className="text-xs">
            <Icon className="mr-1 h-3 w-3" />
            {config.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'content',
      header: 'Mensaje',
      cell: ({ row }) => {
        const content = row.getValue('content') as string;
        return (
          <div className="max-w-md truncate text-sm" title={content}>
            {content}
          </div>
        );
      },
    },
  ];

  const handleViewTemplate = (template: WhatsAppTemplate) => {
    setPreviewTemplate(template);
    setIsPreviewDialogOpen(true);
  };

  const handleEditTemplate = (template: WhatsAppTemplate) => {
    setSelectedTemplate(template);
    setIsEditingTemplate(true);
    setIsTemplateDialogOpen(true);
  };

  const handleDuplicateTemplate = (template: WhatsAppTemplate) => {
    duplicateTemplateMutation.mutate(template.id);
  };

  const handleDeleteTemplate = (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta plantilla?')) {
      deleteTemplateMutation.mutate(id);
    }
  };

  const handleNewTemplate = () => {
    setSelectedTemplate({
      id: '',
      name: '',
      content: '',
      category: 'general',
      variables: [],
      language: 'es',
      is_active: true,
      created_at: '',
      updated_at: ''
    });
    setIsEditingTemplate(true);
    setIsTemplateDialogOpen(true);
  };

  const handleSaveTemplate = () => {
    if (!selectedTemplate) return;

    if (!selectedTemplate.name || !selectedTemplate.content) {
      toast.error('Completa todos los campos requeridos');
      return;
    }

    if (selectedTemplate.id) {
      // Update existing
      updateTemplateMutation.mutate({
        id: selectedTemplate.id,
        template: selectedTemplate
      });
    } else {
      // Create new
      const { id, created_at, updated_at, ...templateData } = selectedTemplate;
      createTemplateMutation.mutate(templateData);
    }
  };

  // Generate preview variables
  const getPreviewVariables = (template: WhatsAppTemplate): Record<string, string> => {
    const exampleVars: Record<string, string> = {
      cliente: 'Juan Pérez',
      placa: 'P123-456',
      ordenId: 'ORD-2024-001',
      total: '$250.00',
      vehiculo: 'Toyota Corolla 2020',
      servicio: 'Cambio de aceite y filtros',
      linkSeguimiento: 'https://taller.com/seguimiento/ABC123',
      fecha: new Date().toLocaleDateString('es-SV'),
      hora: new Date().toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' })
    };

    const result: Record<string, string> = {};
    template.variables.forEach(v => {
      result[v] = exampleVars[v] || `[${v}]`;
    });
    return result;
  };

  const renderPreview = (template: WhatsAppTemplate) => {
    let content = template.content;
    const vars = getPreviewVariables(template);
    Object.entries(vars).forEach(([key, value]) => {
      content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    return content;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notificaciones WhatsApp</h1>
          <p className="text-muted-foreground">
            Gestiona plantillas, historial y estadísticas de mensajes
          </p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Mensajes</p>
                  <p className="text-2xl font-bold">{stats.totalMessages}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-muted-foreground opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Enviados Hoy</p>
                  <p className="text-2xl font-bold">{stats.sentToday}</p>
                </div>
                <Send className="h-8 w-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tasa de Entrega</p>
                  <p className="text-2xl font-bold">{stats.deliveryRate}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Clientes WhatsApp</p>
                  <p className="text-2xl font-bold">{owners.length}</p>
                </div>
                <Users className="h-8 w-8 text-purple-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Message Status Breakdown */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Estado de Mensajes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.messagesByStatus.pending}</div>
                <div className="text-xs text-muted-foreground">Pendiente</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.messagesByStatus.sent}</div>
                <div className="text-xs text-muted-foreground">Enviado</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.messagesByStatus.delivered}</div>
                <div className="text-xs text-muted-foreground">Entregado</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.messagesByStatus.read}</div>
                <div className="text-xs text-muted-foreground">Leído</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.messagesByStatus.failed}</div>
                <div className="text-xs text-muted-foreground">Fallido</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="plantillas">
            <FileText className="h-4 w-4 mr-2" />
            Plantillas ({templates.length})
          </TabsTrigger>
          <TabsTrigger value="historial">
            <MessageSquare className="h-4 w-4 mr-2" />
            Historial ({messages.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plantillas" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Plantillas de Mensajes</h3>
            <Button onClick={handleNewTemplate}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Plantilla
            </Button>
          </div>

          <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Variables disponibles para las plantillas
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    Usa estas variables en tus plantillas: {'{{cliente}}'}, {'{{placa}}'}, {'{{ordenId}}'}, {'{{total}}'}, {'{{vehiculo}}'}, {'{{servicio}}'}, {'{{linkSeguimiento}}'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <DataTable
            columns={templateColumns}
            data={templates}
            searchKey="name"
            searchPlaceholder="Buscar plantillas..."
          />
        </TabsContent>

        <TabsContent value="historial" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Historial de Mensajes</h3>
            <div className="flex items-center gap-2">
              <Select
                value={messageFilters.status?.[0] || 'all'}
                onValueChange={(value) => {
                  setMessageFilters(prev => ({
                    ...prev,
                    status: value === 'all' ? undefined : [value]
                  }));
                }}
              >
                <SelectTrigger className="w-[150px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filtrar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="sent">Enviado</SelectItem>
                  <SelectItem value="delivered">Entregado</SelectItem>
                  <SelectItem value="read">Leído</SelectItem>
                  <SelectItem value="failed">Fallido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DataTable
            columns={messageColumns}
            data={messages}
            searchKey="phone_number"
            searchPlaceholder="Buscar por teléfono..."
          />
        </TabsContent>
      </Tabs>

      {/* Template Edit/Create Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate?.id ? 'Editar Plantilla' : 'Nueva Plantilla'}
            </DialogTitle>
            <DialogDescription>
              Configura el contenido y variables de la plantilla. Usa {'{{variable}}'} para insertar datos dinámicos.
            </DialogDescription>
          </DialogHeader>

          {selectedTemplate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="template-name">Nombre *</Label>
                  <Input
                    id="template-name"
                    value={selectedTemplate.name}
                    onChange={(e) => setSelectedTemplate({
                      ...selectedTemplate,
                      name: e.target.value
                    })}
                    placeholder="Ej: Notificación de servicio listo"
                  />
                </div>
                <div>
                  <Label htmlFor="template-category">Categoría</Label>
                  <Select
                    value={selectedTemplate.category}
                    onValueChange={(value) => setSelectedTemplate({
                      ...selectedTemplate,
                      category: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="order_status">Estado de Orden</SelectItem>
                      <SelectItem value="appointment">Cita</SelectItem>
                      <SelectItem value="reminder">Recordatorio</SelectItem>
                      <SelectItem value="promotion">Promoción</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="template-content">Contenido del Mensaje *</Label>
                <Textarea
                  id="template-content"
                  value={selectedTemplate.content}
                  onChange={(e) => setSelectedTemplate({
                    ...selectedTemplate,
                    content: e.target.value
                  })}
                  rows={8}
                  placeholder="Hola {{cliente}}, tu vehículo {{vehiculo}} con placa {{placa}} está listo para recoger. Total: {{total}}."
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Variables: cliente, placa, ordenId, total, vehiculo, servicio, linkSeguimiento
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="template-active"
                  checked={selectedTemplate.is_active}
                  onCheckedChange={(checked) => setSelectedTemplate({
                    ...selectedTemplate,
                    is_active: checked
                  })}
                />
                <Label htmlFor="template-active">Plantilla activa</Label>
              </div>

              {selectedTemplate.content && (
                <div className="border rounded-lg p-4 bg-muted/50">
                  <Label className="text-sm font-medium mb-2 block">Vista Previa</Label>
                  <div className="bg-background rounded-lg p-3 text-sm whitespace-pre-wrap">
                    {renderPreview(selectedTemplate)}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveTemplate}
              disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
            >
              {createTemplateMutation.isPending || updateTemplateMutation.isPending ? 'Guardando...' : 'Guardar Plantilla'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Vista Previa de Plantilla</DialogTitle>
            <DialogDescription>
              {previewTemplate?.name}
            </DialogDescription>
          </DialogHeader>

          {previewTemplate && (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="bg-white dark:bg-gray-900 rounded-lg p-3 shadow-sm">
                  <p className="text-sm whitespace-pre-wrap">
                    {renderPreview(previewTemplate)}
                  </p>
                </div>
              </div>

              {previewTemplate.variables.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Variables detectadas:</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {previewTemplate.variables.map((variable) => (
                      <Badge key={variable} variant="outline">
                        {variable}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setIsPreviewDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
