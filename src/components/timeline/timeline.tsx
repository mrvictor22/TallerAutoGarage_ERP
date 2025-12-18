'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { TimelineEntry, TimelineEntryType } from '@/types';
import { formatDateTime, timeAgo } from '@/lib/utils';
import {
  FileText,
  Clock,
  Wrench,
  AlertTriangle,
  ShoppingCart,
  MessageSquare,
  Plus,
  Paperclip,
  Tag,
  CheckCircle,
  Circle,
  Edit,
  Save,
  X
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TimelineProps {
  entries: TimelineEntry[];
  onAddEntry?: (entry: Omit<TimelineEntry, 'id' | 'orderId' | 'authorId' | 'authorName' | 'createdAt'>) => void;
  onUpdateEntry?: (id: string, entry: Partial<TimelineEntry>) => void;
  editable?: boolean;
}

interface NewEntryFormProps {
  onSubmit: (entry: Omit<TimelineEntry, 'id' | 'orderId' | 'authorId' | 'authorName' | 'createdAt'>) => void;
  onCancel: () => void;
}

function NewEntryForm({ onSubmit, onCancel }: NewEntryFormProps) {
  const [type, setType] = useState<TimelineEntryType>('note');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeSpent, setTimeSpent] = useState('');
  const [tags, setTags] = useState('');
  const [checklist, setChecklist] = useState<{ text: string; completed: boolean }[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const entry = {
      type,
      title,
      description,
      timeSpentMinutes: timeSpent ? parseInt(timeSpent) : undefined,
      attachments: [],
      tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
      checklist: checklist.length > 0 ? checklist.map((item, index) => ({
        id: index.toString(),
        text: item.text,
        completed: item.completed
      })) : undefined
    };

    onSubmit(entry);
  };

  const addChecklistItem = () => {
    setChecklist([...checklist, { text: '', completed: false }]);
  };

  const updateChecklistItem = (index: number, text: string) => {
    const updated = [...checklist];
    updated[index].text = text;
    setChecklist(updated);
  };

  const removeChecklistItem = (index: number) => {
    setChecklist(checklist.filter((_, i) => i !== index));
  };

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="text-lg">Nueva Entrada</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Tipo</Label>
              <Select value={type} onValueChange={(value) => setType(value as TimelineEntryType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="note">Nota</SelectItem>
                  <SelectItem value="task">Tarea</SelectItem>
                  <SelectItem value="diagnosis">Diagnóstico</SelectItem>
                  <SelectItem value="labor">Mano de Obra</SelectItem>
                  <SelectItem value="parts_purchase">Compra Repuestos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(type === 'labor' || type === 'task') && (
              <div>
                <Label htmlFor="timeSpent">Tiempo (minutos)</Label>
                <Input
                  id="timeSpent"
                  type="number"
                  value={timeSpent}
                  onChange={(e) => setTimeSpent(e.target.value)}
                  placeholder="60"
                />
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título de la entrada"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción detallada..."
              rows={3}
              required
            />
          </div>

          <div>
            <Label htmlFor="tags">Etiquetas (separadas por comas)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="diagnóstico, frenos, urgente"
            />
          </div>

          {/* Checklist for tasks */}
          {type === 'task' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Lista de Verificación</Label>
                <Button type="button" variant="outline" size="sm" onClick={addChecklistItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar Item
                </Button>
              </div>
              <div className="space-y-2">
                {checklist.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={item.text}
                      onChange={(e) => updateChecklistItem(index, e.target.value)}
                      placeholder="Descripción del item"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeChecklistItem(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button type="submit">
              <Save className="h-4 w-4 mr-2" />
              Guardar
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function TimelineEntryItem({ 
  entry, 
  onUpdate, 
  editable 
}: { 
  entry: TimelineEntry; 
  onUpdate?: (id: string, entry: Partial<TimelineEntry>) => void;
  editable?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);

  const getTypeIcon = (type: TimelineEntryType) => {
    switch (type) {
      case 'note':
        return <FileText className="h-4 w-4" />;
      case 'task':
        return <CheckCircle className="h-4 w-4" />;
      case 'diagnosis':
        return <AlertTriangle className="h-4 w-4" />;
      case 'labor':
        return <Wrench className="h-4 w-4" />;
      case 'parts_purchase':
        return <ShoppingCart className="h-4 w-4" />;
      case 'status_change':
        return <Circle className="h-4 w-4" />;
      case 'message_sent':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: TimelineEntryType) => {
    switch (type) {
      case 'note':
        return 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300';
      case 'task':
        return 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300';
      case 'diagnosis':
        return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300';
      case 'labor':
        return 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300';
      case 'parts_purchase':
        return 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300';
      case 'status_change':
        return 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300';
      case 'message_sent':
        return 'bg-pink-100 text-pink-600 dark:bg-pink-900 dark:text-pink-300';
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const updateChecklistItem = (itemId: string, completed: boolean) => {
    if (!onUpdate || !entry.checklist) return;
    
    const updatedChecklist = entry.checklist.map(item => 
      item.id === itemId ? { ...item, completed } : item
    );
    
    onUpdate(entry.id, { checklist: updatedChecklist });
  };

  return (
    <div className="flex gap-4 pb-6 last:pb-0">
      {/* Timeline line and icon */}
      <div className="flex flex-col items-center">
        <div className={`p-2 rounded-full ${getTypeColor(entry.type)}`}>
          {getTypeIcon(entry.type)}
        </div>
        <div className="w-px bg-border flex-1 mt-2"></div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h4 className="font-medium">{entry.title}</h4>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{entry.authorName}</span>
              <span>•</span>
              <span>{timeAgo(entry.createdAt)}</span>
              {entry.timeSpentMinutes && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{entry.timeSpentMinutes} min</span>
                  </div>
                </>
              )}
            </div>
          </div>
          {editable && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {entry.description}
          </p>

          {/* Checklist */}
          {entry.checklist && entry.checklist.length > 0 && (
            <div className="space-y-2">
              {entry.checklist.map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  <Checkbox
                    checked={item.completed}
                    onCheckedChange={(checked) => updateChecklistItem(item.id, !!checked)}
                    disabled={!editable}
                  />
                  <span className={`text-sm ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Tags */}
          {entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {entry.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Attachments */}
          {entry.attachments.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Paperclip className="h-4 w-4" />
              <span>{entry.attachments.length} archivo(s) adjunto(s)</span>
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            {formatDateTime(entry.createdAt)}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Timeline({ entries, onAddEntry, onUpdateEntry, editable = false }: TimelineProps) {
  const [showNewEntryForm, setShowNewEntryForm] = useState(false);

  const handleAddEntry = (entry: Omit<TimelineEntry, 'id' | 'orderId' | 'authorId' | 'authorName' | 'createdAt'>) => {
    if (onAddEntry) {
      onAddEntry(entry);
      setShowNewEntryForm(false);
    }
  };

  const sortedEntries = [...entries].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Add new entry button */}
      {editable && !showNewEntryForm && (
        <Button onClick={() => setShowNewEntryForm(true)} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Agregar Entrada
        </Button>
      )}

      {/* New entry form */}
      {showNewEntryForm && (
        <NewEntryForm
          onSubmit={handleAddEntry}
          onCancel={() => setShowNewEntryForm(false)}
        />
      )}

      {/* Timeline entries */}
      <div className="relative">
        {sortedEntries.length > 0 ? (
          sortedEntries.map((entry) => (
            <TimelineEntryItem
              key={entry.id}
              entry={entry}
              onUpdate={onUpdateEntry}
              editable={editable}
            />
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay entradas en la bitácora</p>
            {editable && (
              <p className="text-sm">Agrega la primera entrada para comenzar</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
