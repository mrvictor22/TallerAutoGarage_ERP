'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi, ownersApi, vehiclesApi, configApi, usersApi } from '@/services/supabase-api';
import { OrderInsert, Owner, Vehicle, OwnerInsert, VehicleInsert } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Check, ChevronsUpDown, User, Car, FileText, Loader2, Plus, Phone, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function NewOrderContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);

  // Form state
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [reason, setReason] = useState('');
  const [customerComplaints, setCustomerComplaints] = useState('');
  const [technicianId, setTechnicianId] = useState<string>('');
  const [entryMileage, setEntryMileage] = useState('');
  const [fuelLevel, setFuelLevel] = useState('');
  const [commitmentDate, setCommitmentDate] = useState('');
  const [internalNotes, setInternalNotes] = useState('');

  // Modal states
  const [showNewOwnerModal, setShowNewOwnerModal] = useState(false);
  const [showNewVehicleModal, setShowNewVehicleModal] = useState(false);

  // New owner form state
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerPhone, setNewOwnerPhone] = useState('');
  const [newOwnerEmail, setNewOwnerEmail] = useState('');
  const [newOwnerType, setNewOwnerType] = useState<'person' | 'company'>('person');

  // New vehicle form state
  const [newVehiclePlate, setNewVehiclePlate] = useState('');
  const [newVehicleBrand, setNewVehicleBrand] = useState('');
  const [newVehicleModel, setNewVehicleModel] = useState('');
  const [newVehicleYear, setNewVehicleYear] = useState('');
  const [newVehicleColor, setNewVehicleColor] = useState('');

  // Fetch owners for selection
  const { data: ownersResponse, isLoading: ownersLoading } = useQuery({
    queryKey: ['owners', 'all'],
    queryFn: async () => {
      const response = await ownersApi.getOwners({}, 1, 100);
      if (!response.success) {
        toast.error('Error al cargar clientes');
        return null;
      }
      return response.data;
    }
  });

  const owners = ownersResponse?.data || [];

  // Fetch vehicles for selected owner
  const { data: vehiclesResponse, isLoading: vehiclesLoading } = useQuery({
    queryKey: ['vehicles', 'owner', selectedOwnerId],
    queryFn: async () => {
      if (!selectedOwnerId) return null;
      const response = await vehiclesApi.getVehiclesByOwner(selectedOwnerId);
      if (!response.success) {
        toast.error('Error al cargar vehículos');
        return null;
      }
      return response.data;
    },
    enabled: !!selectedOwnerId
  });

  const vehicles = vehiclesResponse || [];

  // Fetch technicians
  const { data: techniciansResponse } = useQuery({
    queryKey: ['technicians'],
    queryFn: async () => {
      const response = await usersApi.getTechnicians();
      if (!response.success) {
        toast.error('Error al cargar técnicos');
        return null;
      }
      return response.data;
    }
  });

  const technicians = techniciansResponse || [];

  // Fetch workshop config for folio generation
  const { data: configResponse } = useQuery({
    queryKey: ['workshop-config'],
    queryFn: async () => {
      const response = await configApi.getWorkshopConfig();
      if (!response.success) {
        return null;
      }
      return response.data;
    }
  });

  // Create owner mutation
  const createOwnerMutation = useMutation({
    mutationFn: async (owner: OwnerInsert) => {
      const response = await ownersApi.createOwner(owner);
      if (!response.success) {
        throw new Error(response.error || 'Error al crear cliente');
      }
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Cliente creado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['owners'] });
      if (data) {
        setSelectedOwnerId(data.id);
      }
      resetNewOwnerForm();
      setShowNewOwnerModal(false);
    },
    onError: (error: Error) => {
      toast.error(error?.message || 'Error al crear cliente');
    }
  });

  // Create vehicle mutation
  const createVehicleMutation = useMutation({
    mutationFn: async (vehicle: VehicleInsert) => {
      const response = await vehiclesApi.createVehicle(vehicle);
      if (!response.success) {
        throw new Error(response.error || 'Error al crear vehículo');
      }
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Vehículo creado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['vehicles', 'owner', selectedOwnerId] });
      if (data) {
        setSelectedVehicleId(data.id);
      }
      resetNewVehicleForm();
      setShowNewVehicleModal(false);
    },
    onError: (error: Error) => {
      toast.error(error?.message || 'Error al crear vehículo');
    }
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (order: OrderInsert) => {
      const response = await ordersApi.createOrder(order);
      if (!response.success) {
        throw new Error(response.error || 'Error al crear orden');
      }
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Orden creada exitosamente');
      router.push(`/es/ordenes/${data?.id}`);
    },
    onError: (error: Error) => {
      toast.error(error?.message || 'Error al crear orden');
    }
  });

  const selectedOwner = owners.find(o => o.id === selectedOwnerId);
  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

  const generateFolioPreview = () => {
    if (!configResponse) return '(Automático)';
    const prefix = configResponse.order_prefix || 'ORD';
    const counter = (configResponse.order_counter || 0) + 1;
    return `${prefix}-${counter.toString().padStart(4, '0')} (aprox.)`;
  };

  const resetNewOwnerForm = () => {
    setNewOwnerName('');
    setNewOwnerPhone('');
    setNewOwnerEmail('');
    setNewOwnerType('person');
  };

  const resetNewVehicleForm = () => {
    setNewVehiclePlate('');
    setNewVehicleBrand('');
    setNewVehicleModel('');
    setNewVehicleYear('');
    setNewVehicleColor('');
  };

  const handleCreateOwner = () => {
    if (!newOwnerName.trim() || !newOwnerPhone.trim()) {
      toast.error('Nombre y teléfono son requeridos');
      return;
    }

    const ownerData: OwnerInsert = {
      name: newOwnerName.trim(),
      phone: newOwnerPhone.trim(),
      email: newOwnerEmail.trim() || null,
      type: newOwnerType,
      whatsapp_consent: true,
      tags: [],
      total_spent: 0,
      total_orders: 0
    };

    createOwnerMutation.mutate(ownerData);
  };

  const handleCreateVehicle = () => {
    if (!newVehiclePlate.trim() || !newVehicleBrand.trim() || !newVehicleModel.trim() || !newVehicleYear) {
      toast.error('Placa, marca, modelo y año son requeridos');
      return;
    }

    const vehicleData: VehicleInsert = {
      owner_id: selectedOwnerId,
      plate: newVehiclePlate.trim().toUpperCase(),
      brand: newVehicleBrand.trim(),
      model: newVehicleModel.trim(),
      year: parseInt(newVehicleYear),
      color: newVehicleColor.trim() || null,
      photos: []
    };

    createVehicleMutation.mutate(vehicleData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedOwnerId || !selectedVehicleId || !reason) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    const orderData: OrderInsert = {
      owner_id: selectedOwnerId,
      vehicle_id: selectedVehicleId,
      reason,
      customer_complaints: customerComplaints || null,
      technician_id: technicianId || null,
      entry_mileage: entryMileage ? parseInt(entryMileage) : null,
      fuel_level: fuelLevel ? parseInt(fuelLevel) : null,
      commitment_date: commitmentDate || null,
      internal_notes: internalNotes || null,
      status: 'new',
      entry_date: new Date().toISOString(),
      subtotal: 0,
      tax_amount: 0,
      discount_amount: 0,
      total: 0,
      payment_status: 'pending',
      amount_paid: 0,
      budget_approved: false,
      priority: 1,
      entry_photos: [],
      exit_photos: [],
      attachments: [],
      tags: []
    };

    createOrderMutation.mutate(orderData);
  };

  const canProceedToStep2 = selectedOwnerId !== '';
  const canProceedToStep3 = selectedVehicleId !== '';
  const canSubmit = reason !== '';

  return (
    <div className="space-y-4 md:space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 md:gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-xl md:text-3xl font-bold tracking-tight">Nueva Orden</h1>
          <p className="text-sm text-muted-foreground">
            Folio: {generateFolioPreview()}
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between px-2">
        {[
          { num: 1, label: 'Cliente', mobileLabel: 'Cliente', icon: User },
          { num: 2, label: 'Vehículo', mobileLabel: 'Vehículo', icon: Car },
          { num: 3, label: 'Servicio', mobileLabel: 'Servicio', icon: FileText }
        ].map((step, index) => (
          <div key={step.num} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={cn(
                  'w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 transition-colors',
                  currentStep >= step.num
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'border-muted-foreground text-muted-foreground'
                )}
              >
                {currentStep > step.num ? (
                  <Check className="h-4 w-4 md:h-5 md:w-5" />
                ) : (
                  <step.icon className="h-4 w-4 md:h-5 md:w-5" />
                )}
              </div>
              <span
                className={cn(
                  'text-xs md:text-sm mt-1.5 md:mt-2 text-center',
                  currentStep >= step.num
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground'
                )}
              >
                <span className="hidden sm:inline">{step.label}</span>
                <span className="sm:hidden">{step.mobileLabel}</span>
              </span>
            </div>
            {index < 2 && (
              <div
                className={cn(
                  'h-0.5 flex-1 mx-2 md:mx-4',
                  currentStep > step.num ? 'bg-primary' : 'bg-muted'
                )}
              />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Select Owner */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Paso 1: Seleccionar Cliente</CardTitle>
              <CardDescription>
                Busca y selecciona el cliente para esta orden
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="owner">Cliente *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {selectedOwner ? (
                        <div className="flex items-center gap-2">
                          <span>{selectedOwner.name}</span>
                          {selectedOwner.type === 'company' && (
                            <Badge variant="outline">Empresa</Badge>
                          )}
                        </div>
                      ) : (
                        'Seleccionar cliente...'
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Buscar cliente..." />
                      <CommandList>
                        <CommandEmpty>No se encontraron clientes.</CommandEmpty>
                        <CommandGroup>
                          {owners.map((owner) => (
                            <CommandItem
                              key={owner.id}
                              onSelect={() => {
                                setSelectedOwnerId(owner.id);
                                setSelectedVehicleId(''); // Reset vehicle selection
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  selectedOwnerId === owner.id
                                    ? 'opacity-100'
                                    : 'opacity-0'
                                )}
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span>{owner.name}</span>
                                  {owner.type === 'company' && (
                                    <Badge variant="outline" className="text-xs">
                                      Empresa
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {owner.phone} {owner.email && `• ${owner.email}`}
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {selectedOwner && (
                <div className="p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-2">Información del Cliente</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Teléfono:</span>
                      <span className="ml-2">{selectedOwner.phone}</span>
                    </div>
                    {selectedOwner.email && (
                      <div>
                        <span className="text-muted-foreground">Email:</span>
                        <span className="ml-2">{selectedOwner.email}</span>
                      </div>
                    )}
                    {selectedOwner.address && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Dirección:</span>
                        <span className="ml-2">{selectedOwner.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewOwnerModal(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Nuevo Cliente
                </Button>
                <Button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  disabled={!canProceedToStep2}
                >
                  Siguiente
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Select Vehicle */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Paso 2: Seleccionar Vehículo</CardTitle>
              <CardDescription>
                Selecciona el vehículo del cliente para esta orden
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="vehicle">Vehículo *</Label>
                {vehiclesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : vehicles.length === 0 ? (
                  <div className="text-center py-8">
                    <Car className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground mb-4">
                      Este cliente no tiene vehículos registrados
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowNewVehicleModal(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Registrar Vehículo
                    </Button>
                  </div>
                ) : (
                  <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar vehículo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.brand} {vehicle.model} ({vehicle.year}) - {vehicle.plate}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {vehicles.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNewVehicleModal(true)}
                  className="text-muted-foreground"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar otro vehículo
                </Button>
              )}

              {selectedVehicle && (
                <div className="p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-2">Información del Vehículo</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Marca:</span>
                      <span className="ml-2">{selectedVehicle.brand}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Modelo:</span>
                      <span className="ml-2">{selectedVehicle.model}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Año:</span>
                      <span className="ml-2">{selectedVehicle.year}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Placa:</span>
                      <span className="ml-2">{selectedVehicle.plate}</span>
                    </div>
                    {selectedVehicle.color && (
                      <div>
                        <span className="text-muted-foreground">Color:</span>
                        <span className="ml-2">{selectedVehicle.color}</span>
                      </div>
                    )}
                    {selectedVehicle.mileage && (
                      <div>
                        <span className="text-muted-foreground">Kilometraje:</span>
                        <span className="ml-2">{selectedVehicle.mileage.toLocaleString()} km</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                >
                  Anterior
                </Button>
                <Button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  disabled={!canProceedToStep3}
                >
                  Siguiente
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Service Details */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Paso 3: Detalles del Servicio</CardTitle>
              <CardDescription>
                Completa la información del servicio a realizar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="reason">Motivo del Servicio *</Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ej: Mantenimiento preventivo, Revisión de frenos, etc."
                  rows={3}
                  required
                />
              </div>

              <div>
                <Label htmlFor="complaints">Quejas del Cliente</Label>
                <Textarea
                  id="complaints"
                  value={customerComplaints}
                  onChange={(e) => setCustomerComplaints(e.target.value)}
                  placeholder="Describe cualquier problema o queja reportada por el cliente..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="mileage">Kilometraje de Entrada</Label>
                  <Input
                    id="mileage"
                    type="number"
                    inputMode="numeric"
                    value={entryMileage}
                    onChange={(e) => setEntryMileage(e.target.value)}
                    placeholder="125000"
                  />
                </div>
                <div>
                  <Label htmlFor="fuel">Nivel de Combustible (%)</Label>
                  <Input
                    id="fuel"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    max="100"
                    value={fuelLevel}
                    onChange={(e) => setFuelLevel(e.target.value)}
                    placeholder="50"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="technician">Técnico Asignado</Label>
                <Select
                  value={technicianId || '__none__'}
                  onValueChange={(value) => setTechnicianId(value === '__none__' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Asignar más tarde" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sin asignar</SelectItem>
                    {technicians.map((tech) => (
                      <SelectItem key={tech.id} value={tech.id}>
                        {tech.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="commitment">Fecha Compromiso</Label>
                <Input
                  id="commitment"
                  type="date"
                  value={commitmentDate}
                  onChange={(e) => setCommitmentDate(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="notes">Notas Internas</Label>
                <Textarea
                  id="notes"
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Notas internas del taller (no visibles para el cliente)..."
                  rows={3}
                />
              </div>

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                >
                  Anterior
                </Button>
                <Button
                  type="submit"
                  disabled={!canSubmit || createOrderMutation.isPending}
                >
                  {createOrderMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Crear Orden
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </form>

      {/* Summary sidebar (optional, shows after step 1) */}
      {currentStep > 1 && (
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-lg">Resumen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="text-muted-foreground">Cliente:</span>
              <span className="ml-2 font-medium">{selectedOwner?.name}</span>
            </div>
            {selectedVehicle && (
              <div>
                <span className="text-muted-foreground">Vehículo:</span>
                <span className="ml-2 font-medium">
                  {selectedVehicle.brand} {selectedVehicle.model} ({selectedVehicle.plate})
                </span>
              </div>
            )}
            {reason && (
              <div>
                <span className="text-muted-foreground">Motivo:</span>
                <p className="mt-1 text-foreground">{reason}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* New Owner Modal */}
      <Dialog open={showNewOwnerModal} onOpenChange={setShowNewOwnerModal}>
        <DialogContent className="w-[95vw] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Nuevo Cliente
            </DialogTitle>
            <DialogDescription>
              Registra un nuevo cliente de forma rápida
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="new-owner-type">Tipo de Cliente</Label>
              <Select value={newOwnerType} onValueChange={(v: 'person' | 'company') => setNewOwnerType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="person">Persona</SelectItem>
                  <SelectItem value="company">Empresa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="new-owner-name">
                {newOwnerType === 'company' ? 'Nombre de la Empresa' : 'Nombre Completo'} *
              </Label>
              <Input
                id="new-owner-name"
                value={newOwnerName}
                onChange={(e) => setNewOwnerName(e.target.value)}
                placeholder={newOwnerType === 'company' ? 'Ej: Transportes García S.A.' : 'Ej: Juan Pérez'}
              />
            </div>
            <div>
              <Label htmlFor="new-owner-phone">Teléfono *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="new-owner-phone"
                  value={newOwnerPhone}
                  onChange={(e) => setNewOwnerPhone(e.target.value)}
                  placeholder="Ej: 5512345678"
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="new-owner-email">Email (Opcional)</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="new-owner-email"
                  type="email"
                  value={newOwnerEmail}
                  onChange={(e) => setNewOwnerEmail(e.target.value)}
                  placeholder="cliente@email.com"
                  className="pl-10"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetNewOwnerForm();
                setShowNewOwnerModal(false);
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleCreateOwner}
              disabled={createOwnerMutation.isPending}
            >
              {createOwnerMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Crear Cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Vehicle Modal */}
      <Dialog open={showNewVehicleModal} onOpenChange={setShowNewVehicleModal}>
        <DialogContent className="w-[95vw] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Nuevo Vehículo
            </DialogTitle>
            <DialogDescription>
              Registra un nuevo vehículo para {selectedOwner?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="new-vehicle-plate">Placa *</Label>
              <Input
                id="new-vehicle-plate"
                value={newVehiclePlate}
                onChange={(e) => setNewVehiclePlate(e.target.value.toUpperCase())}
                placeholder="Ej: ABC-123"
                className="uppercase"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="new-vehicle-brand">Marca *</Label>
                <Input
                  id="new-vehicle-brand"
                  value={newVehicleBrand}
                  onChange={(e) => setNewVehicleBrand(e.target.value)}
                  placeholder="Ej: Toyota"
                />
              </div>
              <div>
                <Label htmlFor="new-vehicle-model">Modelo *</Label>
                <Input
                  id="new-vehicle-model"
                  value={newVehicleModel}
                  onChange={(e) => setNewVehicleModel(e.target.value)}
                  placeholder="Ej: Corolla"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="new-vehicle-year">Año *</Label>
                <Input
                  id="new-vehicle-year"
                  type="number"
                  inputMode="numeric"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  value={newVehicleYear}
                  onChange={(e) => setNewVehicleYear(e.target.value)}
                  placeholder="Ej: 2020"
                />
              </div>
              <div>
                <Label htmlFor="new-vehicle-color">Color</Label>
                <Input
                  id="new-vehicle-color"
                  value={newVehicleColor}
                  onChange={(e) => setNewVehicleColor(e.target.value)}
                  placeholder="Ej: Blanco"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetNewVehicleForm();
                setShowNewVehicleModal(false);
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleCreateVehicle}
              disabled={createVehicleMutation.isPending}
            >
              {createVehicleMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Crear Vehículo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
