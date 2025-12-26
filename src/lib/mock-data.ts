import { 
  Owner, 
  Vehicle, 
  Order, 
  TimelineEntry, 
  PartsInvoice, 
  WhatsAppMessage, 
  WhatsAppTemplate, 
  User, 
  WorkshopConfig,
  DashboardKPIs,
  RecentActivity,
  OrderStatus,
  OwnerType,
  MessageStatus,
  TimelineEntryType,
  UserRole
} from '@/types';

// Mock Users
export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Carlos Méndez',
    email: 'carlos@taller.com',
    role: 'admin',
    active: true,
    permissions: ['*'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '2',
    name: 'María González',
    email: 'maria@taller.com',
    role: 'reception',
    active: true,
    permissions: ['orders:read', 'orders:create', 'owners:*', 'vehicles:*'],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: '3',
    name: 'José Rodríguez',
    email: 'jose@taller.com',
    role: 'technician',
    active: true,
    permissions: ['orders:read', 'orders:update', 'timeline:*'],
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01')
  }
];

// Mock Owners
export const mockOwners: Owner[] = [
  {
    id: '1',
    name: 'Juan Pérez',
    type: 'person',
    email: 'juan.perez@email.com',
    phone: '+503 7123-4567',
    whatsappConsent: true,
    address: 'Col. Escalón, San Salvador',
    tags: ['VIP'],
    notes: 'Cliente frecuente, siempre puntual con pagos',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: '2',
    name: 'Transportes El Salvador S.A.',
    type: 'company',
    email: 'contacto@transportes.com',
    phone: '+503 2234-5678',
    whatsappConsent: true,
    address: 'Zona Industrial, Santa Tecla',
    taxId: '0614-150284-001-3',
    tags: ['Empresa', 'Flota'],
    notes: 'Empresa de transporte con 15 vehículos',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20')
  },
  {
    id: '3',
    name: 'Ana Martínez',
    type: 'person',
    email: 'ana.martinez@email.com',
    phone: '+503 7987-6543',
    whatsappConsent: false,
    address: 'Col. San Benito, San Salvador',
    tags: [],
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01')
  },
  {
    id: '4',
    name: 'Roberto Silva',
    type: 'person',
    email: 'roberto.silva@email.com',
    phone: '+503 7456-7890',
    whatsappConsent: true,
    address: 'Antiguo Cuscatlán',
    tags: ['Deudor'],
    notes: 'Revisar historial de pagos',
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-10')
  }
];

// Mock Vehicles
export const mockVehicles: Vehicle[] = [
  {
    id: '1',
    ownerId: '1',
    plate: 'P123-456',
    brand: 'Toyota',
    model: 'Corolla',
    year: 2020,
    vin: '1HGBH41JXMN109186',
    color: 'Blanco',
    engine: '1.8L',
    notes: 'Mantenimiento regular cada 5,000 km',
    photos: [],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: '2',
    ownerId: '2',
    plate: 'M789-012',
    brand: 'Mercedes-Benz',
    model: 'Sprinter',
    year: 2019,
    color: 'Blanco',
    engine: '2.1L Diesel',
    notes: 'Vehículo comercial - revisar frenos frecuentemente',
    photos: [],
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20')
  },
  {
    id: '3',
    ownerId: '3',
    plate: 'N345-678',
    brand: 'Honda',
    model: 'Civic',
    year: 2021,
    color: 'Azul',
    engine: '1.5L Turbo',
    photos: [],
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01')
  },
  {
    id: '4',
    ownerId: '4',
    plate: 'P901-234',
    brand: 'Nissan',
    model: 'Sentra',
    year: 2018,
    color: 'Gris',
    engine: '1.6L',
    notes: 'Problemas recurrentes con el sistema eléctrico',
    photos: [],
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-10')
  }
];

// Mock Orders
export const mockOrders: Order[] = [
  {
    id: '1',
    folio: 'ORD-2024-001',
    ownerId: '1',
    vehicleId: '1',
    status: 'in_progress',
    technicianId: '3',
    entryDate: new Date('2024-03-01'),
    commitmentDate: new Date('2024-03-05'),
    mileage: 45000,
    fuelLevel: 75,
    reason: 'Mantenimiento preventivo - cambio de aceite y filtros',
    entryPhotos: [],
    budget: {
      lines: [
        {
          id: '1',
          type: 'labor',
          description: 'Cambio de aceite y filtro',
          quantity: 1,
          unitPrice: 35.00,
          taxRate: 13,
          discount: 0,
          total: 39.55,
          approved: true
        },
        {
          id: '2',
          type: 'parts',
          description: 'Aceite 5W-30 (5 litros)',
          quantity: 1,
          unitPrice: 45.00,
          taxRate: 13,
          discount: 0,
          total: 50.85,
          approved: true
        }
      ],
      totals: {
        subtotal: 80.00,
        taxAmount: 10.40,
        discountAmount: 0,
        total: 90.40
      },
      approved: true,
      approvedAt: new Date('2024-03-01T10:30:00'),
      approvedBy: '1'
    },
    attachments: [],
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-01'),
    createdBy: '2'
  },
  {
    id: '2',
    folio: 'ORD-2024-002',
    ownerId: '2',
    vehicleId: '2',
    status: 'waiting',
    technicianId: '3',
    entryDate: new Date('2024-03-02'),
    commitmentDate: new Date('2024-03-08'),
    mileage: 120000,
    fuelLevel: 50,
    reason: 'Reparación de frenos - pastillas y discos',
    entryPhotos: [],
    budget: {
      lines: [
        {
          id: '3',
          type: 'labor',
          description: 'Cambio de pastillas y discos de freno',
          quantity: 1,
          unitPrice: 120.00,
          taxRate: 13,
          discount: 0,
          total: 135.60,
          approved: false
        },
        {
          id: '4',
          type: 'parts',
          description: 'Kit de pastillas delanteras',
          quantity: 1,
          unitPrice: 85.00,
          taxRate: 13,
          discount: 0,
          total: 96.05,
          approved: false
        }
      ],
      totals: {
        subtotal: 205.00,
        taxAmount: 26.65,
        discountAmount: 0,
        total: 231.65
      },
      approved: false
    },
    attachments: [],
    createdAt: new Date('2024-03-02'),
    updatedAt: new Date('2024-03-02'),
    createdBy: '2'
  },
  {
    id: '3',
    folio: 'ORD-2024-003',
    ownerId: '3',
    vehicleId: '3',
    status: 'new',
    entryDate: new Date('2024-03-03'),
    mileage: 25000,
    fuelLevel: 80,
    reason: 'Diagnóstico - ruido extraño en el motor',
    entryPhotos: [],
    budget: {
      lines: [],
      totals: {
        subtotal: 0,
        taxAmount: 0,
        discountAmount: 0,
        total: 0
      },
      approved: false
    },
    attachments: [],
    createdAt: new Date('2024-03-03'),
    updatedAt: new Date('2024-03-03'),
    createdBy: '2'
  }
];

// Mock Timeline Entries
export const mockTimelineEntries: TimelineEntry[] = [
  {
    id: '1',
    orderId: '1',
    type: 'note',
    title: 'Recepción del vehículo',
    description: 'Vehículo recibido en buenas condiciones. Cliente solicita mantenimiento preventivo.',
    authorId: '2',
    authorName: 'María González',
    attachments: [],
    tags: ['recepción'],
    createdAt: new Date('2024-03-01T08:00:00')
  },
  {
    id: '2',
    orderId: '1',
    type: 'task',
    title: 'Cambio de aceite iniciado',
    description: 'Se procede con el cambio de aceite y filtro según especificaciones del fabricante.',
    timeSpentMinutes: 45,
    authorId: '3',
    authorName: 'José Rodríguez',
    attachments: [],
    tags: ['mantenimiento'],
    createdAt: new Date('2024-03-01T09:15:00')
  },
  {
    id: '3',
    orderId: '2',
    type: 'diagnosis',
    title: 'Inspección de frenos',
    description: 'Se confirma desgaste excesivo en pastillas y discos delanteros. Recomendado cambio inmediato.',
    authorId: '3',
    authorName: 'José Rodríguez',
    attachments: [],
    tags: ['diagnóstico', 'frenos'],
    createdAt: new Date('2024-03-02T10:30:00')
  }
];

// Mock Parts Invoices
export const mockPartsInvoices: PartsInvoice[] = [
  {
    id: '1',
    orderId: '1',
    supplier: 'Repuestos Toyota El Salvador',
    invoiceNumber: 'FAC-001234',
    amount: 45.00,
    taxAmount: 5.85,
    currency: 'USD',
    files: [],
    linkedToBudgetLineId: '2',
    notes: 'Aceite sintético 5W-30',
    createdAt: new Date('2024-03-01T11:00:00'),
    createdBy: '3'
  }
];

// Mock WhatsApp Templates
export const mockWhatsAppTemplates: WhatsAppTemplate[] = [
  {
    id: '1',
    name: 'Orden Recibida',
    content: 'Hola {{cliente}}, hemos recibido su vehículo {{placa}} para {{servicio}}. Su orden es {{ordenId}}. Le notificaremos el progreso.',
    variables: ['cliente', 'placa', 'servicio', 'ordenId'],
    language: 'es',
    active: true,
    category: 'order_update',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '2',
    name: 'Presupuesto Listo',
    content: 'Estimado {{cliente}}, el presupuesto para su vehículo {{placa}} está listo. Total: ${{total}}. ¿Autoriza proceder?',
    variables: ['cliente', 'placa', 'total'],
    language: 'es',
    active: true,
    category: 'approval',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '3',
    name: 'Vehículo Listo',
    content: 'Su vehículo {{placa}} está listo para entrega. Total: ${{total}}. Horario: Lunes a Viernes 8AM-5PM.',
    variables: ['placa', 'total'],
    language: 'es',
    active: true,
    category: 'delivery',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];

// Mock WhatsApp Messages
export const mockWhatsAppMessages: WhatsAppMessage[] = [
  {
    id: '1',
    orderId: '1',
    ownerId: '1',
    templateId: '1',
    variables: {
      cliente: 'Juan Pérez',
      placa: 'P123-456',
      servicio: 'mantenimiento preventivo',
      ordenId: 'ORD-2024-001'
    },
    status: 'delivered',
    content: 'Hola Juan Pérez, hemos recibido su vehículo P123-456 para mantenimiento preventivo. Su orden es ORD-2024-001. Le notificaremos el progreso.',
    channel: 'whatsapp',
    sentAt: new Date('2024-03-01T08:30:00'),
    deliveredAt: new Date('2024-03-01T08:31:00'),
    createdAt: new Date('2024-03-01T08:30:00'),
    createdBy: '2'
  }
];

// Mock Workshop Config
export const mockWorkshopConfig: WorkshopConfig = {
  id: '1',
  name: 'Taller Automotriz El Salvador',
  address: 'Blvd. Los Héroes, San Salvador',
  phone: '+503 2234-5678',
  email: 'info@tallerelsalvador.com',
  tax_id: '0614-150284-001-3',
  tax_regime: 'general',
  currency: 'USD',
  logo_url: null,
  business_hours: {
    open: '08:00',
    close: '17:00',
    workingDays: [0, 1, 2, 3, 4, 5]
  },
  order_prefix: 'ORD',
  order_counter: 3,
  whatsapp_enabled: true,
  whatsapp_business_number: '+503 7234-5678',
  whatsapp_api_token: null,
  primary_color: '#f97316',
  secondary_color: '#ef4444',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z'
};

// Mock Dashboard KPIs
export const mockDashboardKPIs: DashboardKPIs = {
  openOrders: 8,
  inProgressOrders: 3,
  deliveriesToday: 2,
  pendingApproval: 1,
  totalRevenue: 15420.50,
  averageOrderValue: 285.75
};

// Mock Recent Activities
export const mockRecentActivities: RecentActivity[] = [
  {
    id: '1',
    type: 'order_created',
    title: 'Nueva orden creada',
    description: 'ORD-2024-003 - Honda Civic N345-678',
    orderId: '3',
    userId: '2',
    userName: 'María González',
    createdAt: new Date('2024-03-03T14:30:00')
  },
  {
    id: '2',
    type: 'status_changed',
    title: 'Estado de orden actualizado',
    description: 'ORD-2024-001 cambió a "En Proceso"',
    orderId: '1',
    userId: '3',
    userName: 'José Rodríguez',
    createdAt: new Date('2024-03-01T09:15:00')
  },
  {
    id: '3',
    type: 'message_sent',
    title: 'Mensaje WhatsApp enviado',
    description: 'Notificación de recepción a Juan Pérez',
    orderId: '1',
    userId: '2',
    userName: 'María González',
    createdAt: new Date('2024-03-01T08:30:00')
  }
];

// Helper functions to get related data
export const getOwnerById = (id: string): Owner | undefined => 
  mockOwners.find(owner => owner.id === id);

export const getVehicleById = (id: string): Vehicle | undefined => 
  mockVehicles.find(vehicle => vehicle.id === id);

export const getUserById = (id: string): User | undefined => 
  mockUsers.find(user => user.id === id);

export const getOrdersByOwnerId = (ownerId: string): Order[] => 
  mockOrders.filter(order => order.ownerId === ownerId);

export const getVehiclesByOwnerId = (ownerId: string): Vehicle[] => 
  mockVehicles.filter(vehicle => vehicle.ownerId === ownerId);

export const getTimelineByOrderId = (orderId: string): TimelineEntry[] => 
  mockTimelineEntries.filter(entry => entry.orderId === orderId);

export const getInvoicesByOrderId = (orderId: string): PartsInvoice[] => 
  mockPartsInvoices.filter(invoice => invoice.orderId === orderId);

export const getMessagesByOrderId = (orderId: string): WhatsAppMessage[] => 
  mockWhatsAppMessages.filter(message => message.orderId === orderId);
