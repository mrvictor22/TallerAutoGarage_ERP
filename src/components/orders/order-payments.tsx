'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentsApi, ordersApi } from '@/services/supabase-api';
import { Payment, PaymentInsert, PaymentMethod } from '@/types/database';
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
import { formatCurrency, formatDateTime } from '@/lib/utils';
import {
  Plus,
  DollarSign,
  CreditCard,
  Banknote,
  Building2,
  Receipt,
  Wallet,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface OrderPaymentsProps {
  orderId: string;
  totalAmount: number;
}

interface PaymentFormData {
  amount: number;
  payment_method: PaymentMethod;
  reference_number: string;
  notes: string;
  payment_date: string;
}

const defaultFormData: PaymentFormData = {
  amount: 0,
  payment_method: 'cash',
  reference_number: '',
  notes: '',
  payment_date: new Date().toISOString().split('T')[0]
};

const paymentMethods: { value: PaymentMethod; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'cash', label: 'Efectivo', icon: Banknote },
  { value: 'card', label: 'Tarjeta', icon: CreditCard },
  { value: 'transfer', label: 'Transferencia', icon: Building2 },
  { value: 'check', label: 'Cheque', icon: Receipt },
  { value: 'credit', label: 'Crédito', icon: Wallet }
];

export function OrderPayments({ orderId, totalAmount }: OrderPaymentsProps) {
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState<PaymentFormData>(defaultFormData);

  // Fetch payments
  const { data: paymentsResponse, isLoading } = useQuery({
    queryKey: ['payments', orderId],
    queryFn: async () => {
      const response = await paymentsApi.getPayments(orderId);
      if (!response.success) {
        toast.error('Error al cargar pagos');
        return null;
      }
      return response.data;
    }
  });

  const payments = paymentsResponse || [];

  // Calculate payment summary
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const remainingBalance = totalAmount - totalPaid;
  const paymentStatus =
    remainingBalance <= 0 ? 'paid' :
    totalPaid > 0 ? 'partial' :
    'pending';

  // Create payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: async (data: PaymentFormData) => {
      const paymentData: PaymentInsert = {
        order_id: orderId,
        amount: data.amount,
        payment_method: data.payment_method,
        reference_number: data.reference_number || null,
        notes: data.notes || null,
        payment_date: data.payment_date
      };

      const response = await paymentsApi.createPayment(paymentData);
      if (!response.success) {
        throw new Error(response.error || 'Error al registrar pago');
      }
      return response.data;
    },
    onSuccess: async () => {
      // Update order payment status
      const newTotalPaid = totalPaid + formData.amount;
      const newRemainingBalance = totalAmount - newTotalPaid;
      const newPaymentStatus =
        newRemainingBalance <= 0 ? 'paid' :
        newTotalPaid > 0 ? 'partial' :
        'pending';

      await ordersApi.updateOrder(orderId, {
        amount_paid: newTotalPaid,
        payment_status: newPaymentStatus
      });

      queryClient.invalidateQueries({ queryKey: ['payments', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders', orderId] });
      toast.success('Pago registrado exitosamente');
      setShowAddDialog(false);
      setFormData(defaultFormData);
    },
    onError: (error: Error) => {
      toast.error(error?.message || 'Error al registrar pago');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.amount <= 0) {
      toast.error('El monto debe ser mayor a cero');
      return;
    }

    if (formData.amount > remainingBalance) {
      if (!confirm(`El monto (${formatCurrency(formData.amount)}) es mayor al saldo pendiente (${formatCurrency(remainingBalance)}). ¿Deseas continuar?`)) {
        return;
      }
    }

    createPaymentMutation.mutate(formData);
  };

  const getPaymentMethodIcon = (method: PaymentMethod) => {
    const methodInfo = paymentMethods.find(m => m.value === method);
    const Icon = methodInfo?.icon || DollarSign;
    return <Icon className="h-4 w-4" />;
  };

  const getPaymentMethodLabel = (method: PaymentMethod) => {
    return paymentMethods.find(m => m.value === method)?.label || method;
  };

  const getPaymentStatusBadge = () => {
    switch (paymentStatus) {
      case 'paid':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Pagado
          </Badge>
        );
      case 'partial':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Pago Parcial
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            Pendiente
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Resumen de Pagos</span>
            {getPaymentStatusBadge()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Total de la Orden</div>
              <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Total Pagado</div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalPaid)}
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Saldo Pendiente</div>
              <div className={`text-2xl font-bold ${remainingBalance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                {formatCurrency(remainingBalance)}
              </div>
            </div>
          </div>

          {remainingBalance > 0 && (
            <div className="mt-4">
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Registrar Pago
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Registrar Nuevo Pago</DialogTitle>
                    <DialogDescription>
                      Saldo pendiente: {formatCurrency(remainingBalance)}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="amount">Monto *</Label>
                      <Input
                        id="amount"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={formData.amount || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
                        }
                        placeholder="0.00"
                        required
                      />
                      <div className="flex gap-2 mt-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setFormData({ ...formData, amount: remainingBalance })
                          }
                        >
                          Saldo Completo
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setFormData({ ...formData, amount: remainingBalance / 2 })
                          }
                        >
                          50%
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="payment_method">Método de Pago *</Label>
                      <Select
                        value={formData.payment_method}
                        onValueChange={(value) =>
                          setFormData({ ...formData, payment_method: value as PaymentMethod })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentMethods.map((method) => (
                            <SelectItem key={method.value} value={method.value}>
                              <div className="flex items-center gap-2">
                                <method.icon className="h-4 w-4" />
                                <span>{method.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="payment_date">Fecha de Pago *</Label>
                      <Input
                        id="payment_date"
                        type="date"
                        value={formData.payment_date}
                        onChange={(e) =>
                          setFormData({ ...formData, payment_date: e.target.value })
                        }
                        required
                      />
                    </div>

                    {formData.payment_method !== 'cash' && (
                      <div>
                        <Label htmlFor="reference">Número de Referencia</Label>
                        <Input
                          id="reference"
                          value={formData.reference_number}
                          onChange={(e) =>
                            setFormData({ ...formData, reference_number: e.target.value })
                          }
                          placeholder="Número de transacción, cheque, etc."
                        />
                      </div>
                    )}

                    <div>
                      <Label htmlFor="notes">Notas</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Notas adicionales sobre el pago..."
                        rows={2}
                      />
                    </div>

                    <Separator />

                    <div className="bg-muted p-4 rounded-lg">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Monto a pagar:</span>
                        <span className="font-medium">{formatCurrency(formData.amount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Saldo restante:</span>
                        <span className="font-medium">
                          {formatCurrency(remainingBalance - formData.amount)}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={createPaymentMutation.isPending}
                        className="flex-1"
                      >
                        {createPaymentMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Registrar Pago
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowAddDialog(false);
                          setFormData(defaultFormData);
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payments History */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Pagos</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Notas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {new Date(payment.payment_date).toLocaleDateString('es-SV', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDateTime(payment.created_at)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getPaymentMethodIcon(payment.payment_method)}
                        <span>{getPaymentMethodLabel(payment.payment_method)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {payment.reference_number ? (
                        <span className="font-mono text-sm">{payment.reference_number}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium text-green-600">
                        {formatCurrency(payment.amount)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {payment.notes ? (
                        <span className="text-sm text-muted-foreground">{payment.notes}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No hay pagos registrados</h3>
              <p className="text-muted-foreground mb-4">
                Los pagos aparecerán aquí una vez que sean registrados
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
