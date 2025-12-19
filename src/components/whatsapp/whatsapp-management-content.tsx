'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { whatsappApi, ownersApi } from '@/services/supabase-api';
import { WhatsAppTemplate, WhatsAppMessage, OwnerWithRelations } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { DataTable } from '@/components/tables/data-table';
import { WhatsAppSender } from '@/components/whatsapp/whatsapp-sender';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  History,
  Eye,
  Copy,
  CheckCircle,
  XCircle,
  Clock,
  Phone
} from 'lucide-react';
import { toast } from 'sonner';
import { ColumnDef } from '@tanstack/react-table';

interface WhatsAppManagementContentProps {
  preselectedOwnerId?: string;
  preselectedVehicleId?: string;
  preselectedOrderId?: string;
}

export function WhatsAppManagementContent({ 
  preselectedOwnerId,
  preselectedVehicleId,
  preselectedOrderId 
}: WhatsAppManagementContentProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(preselectedOwnerId ? 'enviar' : 'plantillas');
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);

  // Fetch templates
  const { data: templatesResponse, isLoading: templatesLoading } = useQuery({
    queryKey: ['whatsapp-templates'],
    queryFn: () => whatsappApi.getTemplates()
  });

  // Fetch message history
  const { data: messagesResponse, isLoading: messagesLoading } = useQuery({
    queryKey: ['whatsapp-messages'],
    queryFn: () => whatsappApi.getMessages()
  });

  // Fetch owners with WhatsApp consent
  const { data: ownersResponse } = useQuery({
    queryKey: ['owners', { has_whatsapp_consent: true }],
    queryFn: () => ownersApi.getOwners({ has_whatsapp_consent: true }, 1, 100)
  });

  const templates = templatesResponse?.data || [];
  const messages = messagesResponse?.data || [];
  const owners = ownersResponse?.data?.data || [];

  // Template columns
  const templateColumns: ColumnDef<WhatsAppTemplate>[] = [
    {
      accessorKey: 'name',
      header: 'Nombre',
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('name')}</div>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Categoría',
      cell: ({ row }) => {
        const category = row.getValue('category') as string;
        return (
          <Badge variant="outline">
            {category === 'order_status' && 'Estado de Orden'}
            {category === 'appointment' && 'Cita'}
            {category === 'reminder' && 'Recordatorio'}
            {category === 'promotion' && 'Promoción'}
            {category === 'general' && 'General'}
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
          <div className="max-w-xs truncate" title={content}>
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
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewTemplate(template)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEditTemplate(template)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDuplicateTemplate(template)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  // Message columns
  const messageColumns: ColumnDef<WhatsAppMessage>[] = [
    {
      accessorKey: 'phone_number',
      header: 'Destinatario',
      cell: ({ row }) => {
        const message = row.original;
        // Try to find owner name from the owners list
        const owner = owners.find(o => o.id === message.owner_id);
        return (
          <div>
            <div className="font-medium">{owner?.name || 'Cliente'}</div>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
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
        // Try to find template name from templates list
        const template = templates.find(t => t.id === message.template_id);
        return (
          <Badge variant="outline">{template?.name || 'Sin plantilla'}</Badge>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return (
          <Badge 
            variant={
              status === 'sent' ? 'default' :
              status === 'delivered' ? 'secondary' :
              status === 'read' ? 'default' :
              status === 'failed' ? 'destructive' : 'outline'
            }
          >
            {status === 'sent' && <><Send className="mr-1 h-3 w-3" />Enviado</>}
            {status === 'delivered' && <><CheckCircle className="mr-1 h-3 w-3" />Entregado</>}
            {status === 'read' && <><CheckCircle className="mr-1 h-3 w-3" />Leído</>}
            {status === 'failed' && <><XCircle className="mr-1 h-3 w-3" />Fallido</>}
            {status === 'pending' && <><Clock className="mr-1 h-3 w-3" />Pendiente</>}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'sent_at',
      header: 'Enviado',
      cell: ({ row }) => {
        const date = row.getValue('sent_at') as string | null;
        return <span className="text-sm">{date ? formatDate(date) : 'Pendiente'}</span>;
      },
    },
    {
      accessorKey: 'content',
      header: 'Mensaje',
      cell: ({ row }) => {
        const content = row.getValue('content') as string;
        return (
          <div className="max-w-xs truncate" title={content}>
            {content}
          </div>
        );
      },
    },
  ];

  const handleViewTemplate = (template: WhatsAppTemplate) => {
    setSelectedTemplate(template);
    setIsEditingTemplate(false);
    setIsTemplateDialogOpen(true);
  };

  const handleEditTemplate = (template: WhatsAppTemplate) => {
    setSelectedTemplate(template);
    setIsEditingTemplate(true);
    setIsTemplateDialogOpen(true);
  };

  const handleDuplicateTemplate = (template: WhatsAppTemplate) => {
    const duplicated: WhatsAppTemplate = {
      ...template,
      id: `template_${Date.now()}`,
      name: `${template.name} (Copia)`,
      is_active: false
    };
    setSelectedTemplate(duplicated);
    setIsEditingTemplate(true);
    setIsTemplateDialogOpen(true);
  };

  const handleNewTemplate = () => {
    setSelectedTemplate({
      id: `template_${Date.now()}`,
      name: '',
      content: '',
      category: 'general',
      variables: [],
      language: 'es',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    setIsEditingTemplate(true);
    setIsTemplateDialogOpen(true);
  };

  const handleSaveTemplate = () => {
    if (selectedTemplate) {
      // Simulate save
      toast.success('Plantilla guardada exitosamente');
      setIsTemplateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">WhatsApp</h1>
          <p className="text-muted-foreground">
            Gestiona plantillas y envía notificaciones por WhatsApp
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Configuración
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Plantillas</p>
                <p className="text-2xl font-bold">{templates.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Send className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Enviados Hoy</p>
                <p className="text-2xl font-bold">
                  {messages.filter((m: WhatsAppMessage) =>
                    m.sent_at && new Date(m.sent_at).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Clientes WhatsApp</p>
                <p className="text-2xl font-bold">{owners.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Tasa Entrega</p>
                <p className="text-2xl font-bold">
                  {messages.length > 0
                    ? Math.round((messages.filter((m: WhatsAppMessage) => m.status === 'delivered').length / messages.length) * 100)
                    : 0
                  }%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="enviar">Enviar Mensaje</TabsTrigger>
          <TabsTrigger value="plantillas">
            Plantillas ({templates.length})
          </TabsTrigger>
          <TabsTrigger value="historial">
            Historial ({messages.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="enviar" className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">
                  Para enviar mensajes WhatsApp, selecciona una orden desde el detalle de la orden.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plantillas" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Plantillas de Mensajes</h3>
            <Button onClick={handleNewTemplate}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Plantilla
            </Button>
          </div>
          
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
          </div>
          
          <DataTable
            columns={messageColumns}
            data={messages}
            searchKey="phone_number"
            searchPlaceholder="Buscar por destinatario..."
          />
        </TabsContent>
      </Tabs>

      {/* Template Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isEditingTemplate 
                ? (selectedTemplate?.name ? 'Editar Plantilla' : 'Nueva Plantilla')
                : 'Ver Plantilla'
              }
            </DialogTitle>
            <DialogDescription>
              {isEditingTemplate 
                ? 'Configura el contenido y variables de la plantilla'
                : 'Detalles de la plantilla de mensaje'
              }
            </DialogDescription>
          </DialogHeader>
          
          {selectedTemplate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="template-name">Nombre</Label>
                  <Input
                    id="template-name"
                    value={selectedTemplate.name}
                    onChange={(e) => setSelectedTemplate({
                      ...selectedTemplate,
                      name: e.target.value
                    })}
                    disabled={!isEditingTemplate}
                  />
                </div>
                <div>
                  <Label htmlFor="template-category">Categoría</Label>
                  <Select
                    value={selectedTemplate.category}
                    onValueChange={(value) => setSelectedTemplate({
                      ...selectedTemplate,
                      category: value as any
                    })}
                    disabled={!isEditingTemplate}
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
                <Label htmlFor="template-content">Contenido del Mensaje</Label>
                <Textarea
                  id="template-content"
                  value={selectedTemplate.content}
                  onChange={(e) => setSelectedTemplate({
                    ...selectedTemplate,
                    content: e.target.value
                  })}
                  disabled={!isEditingTemplate}
                  rows={6}
                  placeholder="Escribe el contenido del mensaje aquí. Usa {{variable}} para variables dinámicas."
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Variables disponibles: cliente, vehiculo, ordenId, fecha, total
                </p>
              </div>

              {isEditingTemplate && (
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
              )}

              {selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
                <div>
                  <Label>Variables Detectadas</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedTemplate.variables.map((variable) => (
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
            <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
              Cancelar
            </Button>
            {isEditingTemplate && (
              <Button onClick={handleSaveTemplate}>
                Guardar Plantilla
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
