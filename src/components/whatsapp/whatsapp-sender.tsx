'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { whatsappApiEnhanced } from '@/services/whatsapp-api-enhanced';
import { WhatsAppTemplate, OrderWithRelations } from '@/types/database';
import { getMessageStatusColor } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  MessageSquare,
  Send,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface WhatsAppSenderProps {
  order: OrderWithRelations;
  onMessageSent?: () => void;
}

interface TemplatePreviewProps {
  template: WhatsAppTemplate;
  variables: Record<string, string>;
}

function TemplatePreview({ template, variables }: TemplatePreviewProps) {
  let content = template.content;
  
  // Replace variables in template
  Object.entries(variables).forEach(([key, value]) => {
    content = content.replace(new RegExp(`{{${key}}}`, 'g'), value || `{{${key}}}`);
  });

  return (
    <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Vista Previa del Mensaje
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border">
          <p className="text-sm whitespace-pre-wrap">{content}</p>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          Para: {variables.cliente || 'Cliente'}
        </div>
      </CardContent>
    </Card>
  );
}

function MessageHistory({ messages }: { messages: Array<{ id: string; status: string; created_at: string; content: string }> }) {
  if (messages.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No hay mensajes enviados</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((message) => (
        <Card key={message.id} className="p-3">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <Badge className={getMessageStatusColor(message.status)}>
                {message.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                {message.status === 'sent' && <Send className="h-3 w-3 mr-1" />}
                {message.status === 'delivered' && <CheckCircle className="h-3 w-3 mr-1" />}
                {message.status === 'read' && <CheckCircle className="h-3 w-3 mr-1" />}
                {message.status === 'failed' && <AlertCircle className="h-3 w-3 mr-1" />}
                {message.status === 'pending' && 'Pendiente'}
                {message.status === 'sent' && 'Enviado'}
                {message.status === 'delivered' && 'Entregado'}
                {message.status === 'read' && 'Leído'}
                {message.status === 'failed' && 'Error'}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground">
              {new Date(message.created_at).toLocaleString('es-SV')}
            </span>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {message.content}
          </p>
        </Card>
      ))}
    </div>
  );
}

export function WhatsAppSender({ order, onMessageSent }: WhatsAppSenderProps) {
  const queryClient = useQueryClient();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(true);

  // Load templates
  const { data: templatesResponse, isLoading: templatesLoading } = useQuery({
    queryKey: ['whatsapp-templates-enhanced'],
    queryFn: () => whatsappApiEnhanced.getTemplates()
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ templateId, variables }: { templateId: string; variables: Record<string, string> }) => {
      const result = await whatsappApiEnhanced.sendMessage(order.owner_id, order.id, templateId, variables, order.owner.phone);
      if (!result.success) {
        throw new Error(result.error || 'Error al enviar mensaje');
      }
      return result;
    },
    onSuccess: () => {
      toast.success('Mensaje enviado exitosamente');
      setSelectedTemplateId('');
      setVariables({});
      queryClient.invalidateQueries({ queryKey: ['whatsapp-messages-enhanced'] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-stats'] });
      onMessageSent?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al enviar mensaje');
    }
  });

  const templates = templatesResponse?.data || [];
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  // Auto-populate variables when template is selected
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates.find(t => t.id === templateId);
    
    if (template) {
      const autoVariables: Record<string, string> = {};
      
      // Auto-fill common variables
      template.variables.forEach(variable => {
        switch (variable) {
          case 'cliente':
            autoVariables[variable] = order.owner.name;
            break;
          case 'placa':
            autoVariables[variable] = order.vehicle.plate;
            break;
          case 'ordenId':
            autoVariables[variable] = order.folio;
            break;
          case 'total':
            autoVariables[variable] = order.total.toFixed(2);
            break;
          case 'vehiculo':
            autoVariables[variable] = `${order.vehicle.brand} ${order.vehicle.model}`;
            break;
          case 'servicio':
            autoVariables[variable] = order.reason;
            break;
          case 'linkSeguimiento':
            autoVariables[variable] = `${window.location.origin}/seguimiento/${order.id}`;
            break;
          default:
            autoVariables[variable] = '';
        }
      });
      
      setVariables(autoVariables);
    }
  };

  const handleVariableChange = (variable: string, value: string) => {
    setVariables(prev => ({ ...prev, [variable]: value }));
  };

  const handleSendMessage = () => {
    if (!selectedTemplateId) {
      toast.error('Selecciona una plantilla');
      return;
    }

    // Check if owner has WhatsApp consent
    if (!order.owner.whatsapp_consent) {
      toast.error('El cliente no ha dado consentimiento para WhatsApp');
      return;
    }

    sendMessageMutation.mutate({
      templateId: selectedTemplateId,
      variables
    });
  };

  const canSendMessage = selectedTemplateId && order.owner.whatsapp_consent && !sendMessageMutation.isPending;

  return (
    <div className="space-y-6">
      {/* WhatsApp consent warning */}
      {!order.owner.whatsapp_consent && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">
                El cliente no ha dado consentimiento para recibir mensajes de WhatsApp.
                Actualiza el perfil del cliente para habilitar esta función.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Template selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Enviar Mensaje WhatsApp</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="template">Plantilla</Label>
            <Select
              value={selectedTemplateId}
              onValueChange={handleTemplateChange}
              disabled={templatesLoading || !order.owner.whatsapp_consent}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una plantilla" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div>
                      <div className="font-medium">{template.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {template.category}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Variables */}
          {selectedTemplate && selectedTemplate.variables.length > 0 && (
            <div className="space-y-3">
              <Label>Variables</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedTemplate.variables.map((variable) => (
                  <div key={variable}>
                    <Label htmlFor={variable} className="text-sm">
                      {variable}
                    </Label>
                    <Input
                      id={variable}
                      value={variables[variable] || ''}
                      onChange={(e) => handleVariableChange(variable, e.target.value)}
                      placeholder={`Valor para {{${variable}}}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview */}
          {selectedTemplate && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Vista Previa</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {showPreview ? 'Ocultar' : 'Mostrar'} Vista Previa
                </Button>
              </div>
              
              {showPreview && (
                <TemplatePreview template={selectedTemplate} variables={variables} />
              )}
            </div>
          )}

          {/* Send button */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSendMessage}
              disabled={!canSendMessage}
              className="flex-1"
            >
              {sendMessageMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Enviar Mensaje
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Message history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Historial de Mensajes</CardTitle>
        </CardHeader>
        <CardContent>
          <MessageHistory messages={order.messages} />
        </CardContent>
      </Card>
    </div>
  );
}
