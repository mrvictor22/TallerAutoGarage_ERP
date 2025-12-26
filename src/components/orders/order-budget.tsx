'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { budgetLinesApi, ordersApi } from '@/services/supabase-api';
import { BudgetLine, BudgetLineInsert, BudgetLineType } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';
import {
  Plus,
  Wrench,
  Package,
  Edit,
  Trash2,
  Check,
  X,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface OrderBudgetProps {
  orderId: string;
}

interface BudgetLineFormData {
  type: BudgetLineType;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  discount_percent: number;
  part_number?: string;
  supplier?: string;
  notes?: string;
}

const defaultFormData: BudgetLineFormData = {
  type: 'labor',
  description: '',
  quantity: 1,
  unit_price: 0,
  tax_rate: 13, // El Salvador IVA rate
  discount_percent: 0
};

export function OrderBudget({ orderId }: OrderBudgetProps) {
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingLine, setEditingLine] = useState<BudgetLine | null>(null);
  const [formData, setFormData] = useState<BudgetLineFormData>(defaultFormData);

  // Fetch budget lines
  const { data: linesResponse, isLoading } = useQuery({
    queryKey: ['budget-lines', orderId],
    queryFn: async () => {
      const response = await budgetLinesApi.getBudgetLines(orderId);
      if (!response.success) {
        toast.error('Error al cargar presupuesto');
        return null;
      }
      return response.data;
    }
  });

  const lines = linesResponse || [];

  // Calculate totals
  const calculateLineTotals = (data: BudgetLineFormData) => {
    const subtotal = data.quantity * data.unit_price;
    const discountAmount = subtotal * (data.discount_percent / 100);
    const subtotalAfterDiscount = subtotal - discountAmount;
    const taxAmount = subtotalAfterDiscount * (data.tax_rate / 100);
    const total = subtotalAfterDiscount + taxAmount;

    return {
      subtotal: subtotalAfterDiscount,
      tax_amount: taxAmount,
      total
    };
  };

  const budgetTotals = lines.reduce(
    (acc, line) => ({
      subtotal: acc.subtotal + line.subtotal,
      tax: acc.tax + line.tax_amount,
      total: acc.total + line.total
    }),
    { subtotal: 0, tax: 0, total: 0 }
  );

  // Create budget line mutation
  const createLineMutation = useMutation({
    mutationFn: async (data: BudgetLineFormData) => {
      const totals = calculateLineTotals(data);
      const lineData: BudgetLineInsert = {
        order_id: orderId,
        type: data.type,
        description: data.description,
        quantity: data.quantity,
        unit_price: data.unit_price,
        tax_rate: data.tax_rate,
        discount_percent: data.discount_percent,
        subtotal: totals.subtotal,
        tax_amount: totals.tax_amount,
        total: totals.total,
        part_number: data.part_number || null,
        supplier: data.supplier || null,
        notes: data.notes || null,
        approved: false,
        sort_order: lines.length
      };

      const response = await budgetLinesApi.createBudgetLine(lineData);
      if (!response.success) {
        throw new Error(response.error || 'Error al crear línea');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-lines', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders', orderId] });
      toast.success('Línea agregada exitosamente');
      setShowAddDialog(false);
      setFormData(defaultFormData);
      updateOrderTotals();
    },
    onError: (error: Error) => {
      toast.error(error?.message || 'Error al crear línea');
    }
  });

  // Update budget line mutation
  const updateLineMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<BudgetLine> }) => {
      const response = await budgetLinesApi.updateBudgetLine(id, data);
      if (!response.success) {
        throw new Error(response.error || 'Error al actualizar línea');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-lines', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders', orderId] });
      toast.success('Línea actualizada exitosamente');
      setEditingLine(null);
      updateOrderTotals();
    },
    onError: (error: Error) => {
      toast.error(error?.message || 'Error al actualizar línea');
    }
  });

  // Delete budget line mutation
  const deleteLineMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await budgetLinesApi.deleteBudgetLine(id);
      if (!response.success) {
        throw new Error(response.error || 'Error al eliminar línea');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-lines', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders', orderId] });
      toast.success('Línea eliminada exitosamente');
      updateOrderTotals();
    },
    onError: (error: Error) => {
      toast.error(error?.message || 'Error al eliminar línea');
    }
  });

  // Update order totals
  const updateOrderTotals = async () => {
    // Fetch updated lines to calculate new totals
    const response = await budgetLinesApi.getBudgetLines(orderId);
    if (response.success && response.data) {
      const totals = response.data.reduce(
        (acc, line) => ({
          subtotal: acc.subtotal + line.subtotal,
          tax_amount: acc.tax_amount + line.tax_amount,
          total: acc.total + line.total
        }),
        { subtotal: 0, tax_amount: 0, total: 0 }
      );

      await ordersApi.updateOrder(orderId, {
        subtotal: totals.subtotal,
        tax_amount: totals.tax_amount,
        total: totals.total
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLine) {
      const totals = calculateLineTotals(formData);
      updateLineMutation.mutate({
        id: editingLine.id,
        data: {
          ...formData,
          ...totals
        }
      });
    } else {
      createLineMutation.mutate(formData);
    }
  };

  const handleEdit = (line: BudgetLine) => {
    setEditingLine(line);
    setFormData({
      type: line.type,
      description: line.description,
      quantity: line.quantity,
      unit_price: line.unit_price,
      tax_rate: line.tax_rate,
      discount_percent: line.discount_percent,
      part_number: line.part_number || '',
      supplier: line.supplier || '',
      notes: line.notes || ''
    });
    setShowAddDialog(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta línea?')) {
      deleteLineMutation.mutate(id);
    }
  };

  const handleApprove = (id: string, approved: boolean) => {
    updateLineMutation.mutate({
      id,
      data: { approved }
    });
  };

  const resetForm = () => {
    setFormData(defaultFormData);
    setEditingLine(null);
  };

  const linePreview = calculateLineTotals(formData);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Presupuesto</h3>
          <p className="text-sm text-muted-foreground">
            {lines.length} {lines.length === 1 ? 'línea' : 'líneas'} de presupuesto
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={(open) => {
          setShowAddDialog(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Línea
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingLine ? 'Editar Línea' : 'Agregar Línea de Presupuesto'}
              </DialogTitle>
              <DialogDescription>
                {formData.type === 'labor' ? 'Mano de obra o servicio' : 'Repuestos o materiales'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="type">Tipo *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value as BudgetLineType })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="labor">
                      <div className="flex items-center gap-2">
                        <Wrench className="h-4 w-4" />
                        <span>Mano de Obra</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="parts">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        <span>Repuestos</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Descripción *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción detallada del servicio o repuesto"
                  required
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">Cantidad *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="unit_price">Precio Unitario *</Label>
                  <Input
                    id="unit_price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={(e) =>
                      setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tax_rate">IVA (%)</Label>
                  <Input
                    id="tax_rate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.tax_rate}
                    onChange={(e) =>
                      setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="discount">Descuento (%)</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.discount_percent}
                    onChange={(e) =>
                      setFormData({ ...formData, discount_percent: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>

              {formData.type === 'parts' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="part_number">Número de Parte</Label>
                    <Input
                      id="part_number"
                      value={formData.part_number || ''}
                      onChange={(e) => setFormData({ ...formData, part_number: e.target.value })}
                      placeholder="ABC-123"
                    />
                  </div>
                  <div>
                    <Label htmlFor="supplier">Proveedor</Label>
                    <Input
                      id="supplier"
                      value={formData.supplier || ''}
                      onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                      placeholder="Nombre del proveedor"
                    />
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notas adicionales..."
                  rows={2}
                />
              </div>

              <Separator />

              {/* Preview */}
              <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                <h4 className="font-medium">Vista Previa</h4>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>{formatCurrency(linePreview.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IVA ({formData.tax_rate}%):</span>
                  <span>{formatCurrency(linePreview.tax_amount)}</span>
                </div>
                {formData.discount_percent > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Descuento ({formData.discount_percent}%):</span>
                    <span>
                      -{formatCurrency((formData.quantity * formData.unit_price * formData.discount_percent) / 100)}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Total:</span>
                  <span>{formatCurrency(linePreview.total)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={createLineMutation.isPending || updateLineMutation.isPending}
                >
                  {(createLineMutation.isPending || updateLineMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingLine ? 'Actualizar' : 'Agregar'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddDialog(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Budget Lines Table */}
      {lines.length > 0 ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Tipo</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Cant.</TableHead>
                <TableHead className="text-right">P. Unit.</TableHead>
                <TableHead className="text-right">Desc.</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
                <TableHead className="text-right">IVA</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="w-24">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell>
                    {line.type === 'labor' ? (
                      <Wrench className="h-4 w-4 text-purple-500" />
                    ) : (
                      <Package className="h-4 w-4 text-orange-500" />
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{line.description}</div>
                      {line.part_number && (
                        <div className="text-xs text-muted-foreground">
                          P/N: {line.part_number}
                        </div>
                      )}
                      {line.supplier && (
                        <div className="text-xs text-muted-foreground">
                          Proveedor: {line.supplier}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{line.quantity}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(line.unit_price)}
                  </TableCell>
                  <TableCell className="text-right">
                    {line.discount_percent > 0 ? `${line.discount_percent}%` : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(line.subtotal)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(line.tax_amount)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(line.total)}
                  </TableCell>
                  <TableCell className="text-center">
                    {line.approved ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <Check className="h-3 w-3 mr-1" />
                        Aprobado
                      </Badge>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleApprove(line.id, true)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(line)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(line.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Totals */}
          <CardContent className="border-t">
            <div className="flex justify-end">
              <div className="w-80 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>{formatCurrency(budgetTotals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">IVA:</span>
                  <span>{formatCurrency(budgetTotals.tax)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium text-lg">
                  <span>Total:</span>
                  <span>{formatCurrency(budgetTotals.total)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No hay líneas de presupuesto</h3>
            <p className="text-muted-foreground mb-4">
              Comienza agregando servicios o repuestos al presupuesto
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Primera Línea
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
