import { 
  Order, 
  OrderWithRelations, 
  OrderFilters, 
  OrderStatus,
  Owner,
  OwnerWithRelations,
  OwnerFilters,
  Vehicle,
  VehicleWithRelations,
  VehicleFilters,
  TimelineEntry,
  WhatsAppTemplate,
  WhatsAppMessage,
  User,
  DashboardKPIs,
  RecentActivity,
  PaginatedResponse,
  ApiResponse,
  WorkshopConfig,
  CreateOrderForm,
  CreateOwnerForm,
  CreateVehicleForm
} from '@/types';

import {
  mockOrders,
  mockOwners,
  mockVehicles,
  mockTimelineEntries,
  mockPartsInvoices,
  mockWhatsAppMessages,
  mockWhatsAppTemplates,
  mockUsers,
  mockDashboardKPIs,
  mockRecentActivities,
  getOwnerById,
  getVehicleById,
  getUserById,
  getOrdersByOwnerId,
  getVehiclesByOwnerId,
  getTimelineByOrderId,
  getInvoicesByOrderId,
  getMessagesByOrderId
} from '@/lib/mock-data';

// Simulate network delay
const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Simulate random errors (5% chance)
const shouldSimulateError = () => Math.random() < 0.05;

// Generic API response wrapper
const createApiResponse = <T>(data: T, success: boolean = true, message?: string): ApiResponse<T> => ({
  success,
  data: success ? data : undefined,
  error: success ? undefined : message || 'Error desconocido',
  message
});

// Pagination helper
const paginate = <T>(data: T[], page: number = 1, pageSize: number = 10): PaginatedResponse<T> => {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = data.slice(startIndex, endIndex);
  
  return {
    data: paginatedData,
    total: data.length,
    page,
    pageSize,
    totalPages: Math.ceil(data.length / pageSize)
  };
};

// Orders API
export const ordersApi = {
  // Get paginated orders with filters
  getOrders: async (
    filters: OrderFilters = {}, 
    page: number = 1, 
    pageSize: number = 10
  ): Promise<ApiResponse<PaginatedResponse<OrderWithRelations>>> => {
    await delay();
    
    if (shouldSimulateError()) {
      return createApiResponse(null as any, false, 'Error al cargar órdenes');
    }

    let filteredOrders = [...mockOrders];

    // Apply filters
    if (filters.status?.length) {
      filteredOrders = filteredOrders.filter(order => filters.status!.includes(order.status));
    }
    
    if (filters.technicianId) {
      filteredOrders = filteredOrders.filter(order => order.technicianId === filters.technicianId);
    }
    
    if (filters.dateFrom) {
      filteredOrders = filteredOrders.filter(order => order.entryDate >= filters.dateFrom!);
    }
    
    if (filters.dateTo) {
      filteredOrders = filteredOrders.filter(order => order.entryDate <= filters.dateTo!);
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredOrders = filteredOrders.filter(order => {
        const owner = getOwnerById(order.ownerId);
        const vehicle = getVehicleById(order.vehicleId);
        return (
          order.folio.toLowerCase().includes(searchLower) ||
          owner?.name.toLowerCase().includes(searchLower) ||
          vehicle?.plate.toLowerCase().includes(searchLower)
        );
      });
    }

    // Add relations
    const ordersWithRelations: OrderWithRelations[] = filteredOrders.map(order => ({
      ...order,
      owner: getOwnerById(order.ownerId)!,
      vehicle: getVehicleById(order.vehicleId)!,
      technician: order.technicianId ? getUserById(order.technicianId) : undefined,
      timeline: getTimelineByOrderId(order.id),
      invoices: getInvoicesByOrderId(order.id),
      messages: getMessagesByOrderId(order.id)
    }));

    const paginatedResult = paginate(ordersWithRelations, page, pageSize);
    return createApiResponse(paginatedResult);
  },

  // Get single order by ID
  getOrder: async (id: string): Promise<ApiResponse<OrderWithRelations>> => {
    await delay();
    
    if (shouldSimulateError()) {
      return createApiResponse(null as any, false, 'Error al cargar orden');
    }

    const order = mockOrders.find(o => o.id === id);
    if (!order) {
      return createApiResponse(null as any, false, 'Orden no encontrada');
    }

    const orderWithRelations: OrderWithRelations = {
      ...order,
      owner: getOwnerById(order.ownerId)!,
      vehicle: getVehicleById(order.vehicleId)!,
      technician: order.technicianId ? getUserById(order.technicianId) : undefined,
      timeline: getTimelineByOrderId(order.id),
      invoices: getInvoicesByOrderId(order.id),
      messages: getMessagesByOrderId(order.id)
    };

    return createApiResponse(orderWithRelations);
  },

  // Create new order
  createOrder: async (orderData: CreateOrderForm): Promise<ApiResponse<Order>> => {
    await delay(1000); // Longer delay for create operations
    
    if (shouldSimulateError()) {
      return createApiResponse(null as any, false, 'Error al crear orden');
    }

    const newOrder: Order = {
      id: (mockOrders.length + 1).toString(),
      folio: `ORD-2024-${String(mockOrders.length + 1).padStart(3, '0')}`,
      ownerId: orderData.ownerId,
      vehicleId: orderData.vehicleId,
      status: 'new',
      technicianId: orderData.technicianId,
      entryDate: new Date(),
      commitmentDate: orderData.commitmentDate,
      mileage: orderData.mileage,
      fuelLevel: orderData.fuelLevel,
      reason: orderData.reason,
      entryPhotos: [], // In real app, would handle file uploads
      signature: orderData.signature,
      budget: {
        lines: orderData.budgetLines.map((line, index) => ({
          ...line,
          id: (index + 1).toString(),
          total: line.quantity * line.unitPrice * (1 + line.taxRate / 100) * (1 - line.discount / 100),
          approved: false
        })),
        totals: {
          subtotal: 0,
          taxAmount: 0,
          discountAmount: 0,
          total: 0
        },
        approved: false
      },
      attachments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: '1' // Mock current user
    };

    // Calculate totals
    const subtotal = newOrder.budget.lines.reduce((sum, line) => sum + (line.quantity * line.unitPrice), 0);
    const taxAmount = newOrder.budget.lines.reduce((sum, line) => sum + (line.quantity * line.unitPrice * line.taxRate / 100), 0);
    const discountAmount = newOrder.budget.lines.reduce((sum, line) => sum + (line.quantity * line.unitPrice * line.discount / 100), 0);
    
    newOrder.budget.totals = {
      subtotal,
      taxAmount,
      discountAmount,
      total: subtotal + taxAmount - discountAmount
    };

    mockOrders.push(newOrder);
    return createApiResponse(newOrder, true, 'Orden creada exitosamente');
  },

  // Update order status
  updateOrderStatus: async (id: string, status: Order['status'], notes?: string): Promise<ApiResponse<Order>> => {
    await delay();
    
    if (shouldSimulateError()) {
      return createApiResponse(null as any, false, 'Error al actualizar estado');
    }

    const orderIndex = mockOrders.findIndex(o => o.id === id);
    if (orderIndex === -1) {
      return createApiResponse(null as any, false, 'Orden no encontrada');
    }

    mockOrders[orderIndex] = {
      ...mockOrders[orderIndex],
      status,
      updatedAt: new Date()
    };

    // Add timeline entry for status change
    const newTimelineEntry: TimelineEntry = {
      id: (mockTimelineEntries.length + 1).toString(),
      orderId: id,
      type: 'status_change',
      title: `Estado cambiado a ${status}`,
      description: notes || `Estado de la orden actualizado a ${status}`,
      authorId: '1',
      authorName: 'Usuario Actual',
      attachments: [],
      tags: ['estado'],
      createdAt: new Date()
    };
    mockTimelineEntries.push(newTimelineEntry);

    return createApiResponse(mockOrders[orderIndex], true, 'Estado actualizado exitosamente');
  }
};

// Owners API
export const ownersApi = {
  // Get paginated owners with filters
  getOwners: async (
    filters: OwnerFilters = {}, 
    page: number = 1, 
    pageSize: number = 10
  ): Promise<ApiResponse<PaginatedResponse<OwnerWithRelations>>> => {
    await delay();
    
    if (shouldSimulateError()) {
      return createApiResponse(null as any, false, 'Error al cargar dueños');
    }

    let filteredOwners = [...mockOwners];

    // Apply filters
    if (filters.type) {
      filteredOwners = filteredOwners.filter(owner => owner.type === filters.type);
    }
    
    if (filters.tags?.length) {
      filteredOwners = filteredOwners.filter(owner => 
        filters.tags!.some(tag => owner.tags.includes(tag))
      );
    }
    
    if (filters.hasWhatsappConsent !== undefined) {
      filteredOwners = filteredOwners.filter(owner => owner.whatsappConsent === filters.hasWhatsappConsent);
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredOwners = filteredOwners.filter(owner => 
        owner.name.toLowerCase().includes(searchLower) ||
        owner.email?.toLowerCase().includes(searchLower) ||
        owner.phone.includes(filters.search!)
      );
    }

    // Add relations
    const ownersWithRelations: OwnerWithRelations[] = filteredOwners.map(owner => ({
      ...owner,
      vehicles: getVehiclesByOwnerId(owner.id),
      orders: getOrdersByOwnerId(owner.id)
    }));

    const paginatedResult = paginate(ownersWithRelations, page, pageSize);
    return createApiResponse(paginatedResult);
  },

  // Get single owner by ID
  getOwner: async (id: string): Promise<ApiResponse<OwnerWithRelations>> => {
    await delay();
    
    if (shouldSimulateError()) {
      return createApiResponse(null as any, false, 'Error al cargar dueño');
    }

    const owner = mockOwners.find(o => o.id === id);
    if (!owner) {
      return createApiResponse(null as any, false, 'Dueño no encontrado');
    }

    const ownerWithRelations: OwnerWithRelations = {
      ...owner,
      vehicles: getVehiclesByOwnerId(owner.id),
      orders: getOrdersByOwnerId(owner.id)
    };

    return createApiResponse(ownerWithRelations);
  },

  // Create new owner
  createOwner: async (ownerData: CreateOwnerForm): Promise<ApiResponse<Owner>> => {
    await delay(1000);
    
    if (shouldSimulateError()) {
      return createApiResponse(null as any, false, 'Error al crear dueño');
    }

    const newOwner: Owner = {
      id: (mockOwners.length + 1).toString(),
      ...ownerData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockOwners.push(newOwner);
    return createApiResponse(newOwner, true, 'Dueño creado exitosamente');
  }
};

// Vehicles API
export const vehiclesApi = {
  // Get paginated vehicles with filters
  getVehicles: async (
    filters: VehicleFilters = {}, 
    page: number = 1, 
    pageSize: number = 10
  ): Promise<ApiResponse<PaginatedResponse<VehicleWithRelations>>> => {
    await delay();
    
    if (shouldSimulateError()) {
      return createApiResponse(null as any, false, 'Error al cargar vehículos');
    }

    let filteredVehicles = [...mockVehicles];

    // Apply filters
    if (filters.brand) {
      filteredVehicles = filteredVehicles.filter(vehicle => 
        vehicle.brand.toLowerCase().includes(filters.brand!.toLowerCase())
      );
    }
    
    if (filters.model) {
      filteredVehicles = filteredVehicles.filter(vehicle => 
        vehicle.model.toLowerCase().includes(filters.model!.toLowerCase())
      );
    }
    
    if (filters.year) {
      filteredVehicles = filteredVehicles.filter(vehicle => vehicle.year === filters.year);
    }
    
    if (filters.ownerId) {
      filteredVehicles = filteredVehicles.filter(vehicle => vehicle.ownerId === filters.ownerId);
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredVehicles = filteredVehicles.filter(vehicle => {
        const owner = getOwnerById(vehicle.ownerId);
        return (
          vehicle.plate.toLowerCase().includes(searchLower) ||
          vehicle.brand.toLowerCase().includes(searchLower) ||
          vehicle.model.toLowerCase().includes(searchLower) ||
          owner?.name.toLowerCase().includes(searchLower)
        );
      });
    }

    // Add relations
    const vehiclesWithRelations: VehicleWithRelations[] = filteredVehicles.map(vehicle => ({
      ...vehicle,
      owner: getOwnerById(vehicle.ownerId)!,
      orders: mockOrders.filter(order => order.vehicleId === vehicle.id)
    }));

    const paginatedResult = paginate(vehiclesWithRelations, page, pageSize);
    return createApiResponse(paginatedResult);
  },

  // Get single vehicle by ID
  getVehicle: async (id: string): Promise<ApiResponse<VehicleWithRelations>> => {
    await delay();
    
    if (shouldSimulateError()) {
      return createApiResponse(null as any, false, 'Error al cargar vehículo');
    }

    const vehicle = mockVehicles.find(v => v.id === id);
    if (!vehicle) {
      return createApiResponse(null as any, false, 'Vehículo no encontrado');
    }

    const vehicleWithRelations: VehicleWithRelations = {
      ...vehicle,
      owner: getOwnerById(vehicle.ownerId)!,
      orders: mockOrders.filter(order => order.vehicleId === vehicle.id)
    };

    return createApiResponse(vehicleWithRelations);
  },

  // Create new vehicle
  createVehicle: async (vehicleData: CreateVehicleForm): Promise<ApiResponse<Vehicle>> => {
    await delay(1000);
    
    if (shouldSimulateError()) {
      return createApiResponse(null as any, false, 'Error al crear vehículo');
    }

    const newVehicle: Vehicle = {
      id: (mockVehicles.length + 1).toString(),
      ownerId: vehicleData.ownerId,
      plate: vehicleData.plate,
      brand: vehicleData.brand,
      model: vehicleData.model,
      year: vehicleData.year,
      vin: vehicleData.vin,
      color: vehicleData.color,
      engine: vehicleData.engine,
      notes: vehicleData.notes,
      photos: [], // In real app, would handle file uploads
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockVehicles.push(newVehicle);
    return createApiResponse(newVehicle, true, 'Vehículo creado exitosamente');
  }
};

// Timeline API
export const timelineApi = {
  // Add timeline entry
  addEntry: async (
    orderId: string, 
    entry: Omit<TimelineEntry, 'id' | 'orderId' | 'authorId' | 'authorName' | 'createdAt'>
  ): Promise<ApiResponse<TimelineEntry>> => {
    await delay();
    
    if (shouldSimulateError()) {
      return createApiResponse(null as any, false, 'Error al agregar entrada');
    }

    const newEntry: TimelineEntry = {
      id: (mockTimelineEntries.length + 1).toString(),
      orderId,
      authorId: '1', // Mock current user
      authorName: 'Usuario Actual',
      createdAt: new Date(),
      ...entry
    };

    mockTimelineEntries.push(newEntry);
    return createApiResponse(newEntry, true, 'Entrada agregada exitosamente');
  }
};

// WhatsApp API
export const whatsappApi = {
  // Get templates
  getTemplates: async (): Promise<ApiResponse<WhatsAppTemplate[]>> => {
    await delay();
    
    if (shouldSimulateError()) {
      return createApiResponse(null as any, false, 'Error al cargar plantillas');
    }

    return createApiResponse(mockWhatsAppTemplates.filter(t => t.active));
  },

  // Send message (simulated)
  sendMessage: async (
    orderId: string,
    ownerId: string,
    templateId: string,
    variables: Record<string, string>
  ): Promise<ApiResponse<WhatsAppMessage>> => {
    await delay(2000); // Longer delay to simulate sending
    
    if (shouldSimulateError()) {
      return createApiResponse(null as any, false, 'Error al enviar mensaje');
    }

    const template = mockWhatsAppTemplates.find(t => t.id === templateId);
    if (!template) {
      return createApiResponse(null as any, false, 'Plantilla no encontrada');
    }

    // Replace variables in template content
    let content = template.content;
    Object.entries(variables).forEach(([key, value]) => {
      content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });

    const newMessage: WhatsAppMessage = {
      id: (mockWhatsAppMessages.length + 1).toString(),
      orderId,
      ownerId,
      templateId,
      variables,
      status: 'sent',
      content,
      channel: 'whatsapp',
      sentAt: new Date(),
      createdAt: new Date(),
      createdBy: '1'
    };

    // Simulate delivery after a short delay
    setTimeout(() => {
      newMessage.status = 'delivered';
      newMessage.deliveredAt = new Date();
    }, 3000);

    mockWhatsAppMessages.push(newMessage);
    return createApiResponse(newMessage, true, 'Mensaje enviado exitosamente');
  }
};

// Dashboard API
export const dashboardApi = {
  // Get KPIs
  getKPIs: async (): Promise<ApiResponse<DashboardKPIs>> => {
    await delay();
    
    if (shouldSimulateError()) {
      return createApiResponse(null as any, false, 'Error al cargar KPIs');
    }

    return createApiResponse(mockDashboardKPIs);
  },

  // Get recent activities
  getRecentActivities: async (limit: number = 10): Promise<ApiResponse<RecentActivity[]>> => {
    await delay();
    
    if (shouldSimulateError()) {
      return createApiResponse(null as any, false, 'Error al cargar actividades');
    }

    const activities = mockRecentActivities
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);

    return createApiResponse(activities);
  }
};

// Users API
export const usersApi = {
  // Get current user (simulated)
  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    await delay();
    return createApiResponse(mockUsers[0]); // Return admin user
  },

  // Get all users
  getUsers: async (): Promise<ApiResponse<User[]>> => {
    await delay();
    
    if (shouldSimulateError()) {
      return createApiResponse(null as any, false, 'Error al cargar usuarios');
    }

    return createApiResponse(mockUsers.filter(u => u.active));
  }
};

// Config API
export const configApi = {
  getWorkshopConfig: async (): Promise<WorkshopConfig> => {
    await delay();
    return mockWorkshopConfig;
  },

  updateWorkshopConfig: async (config: Partial<WorkshopConfig>): Promise<WorkshopConfig> => {
    await delay();
    return { ...mockWorkshopConfig, ...config };
  }
};

// Mock workshop config
const mockWorkshopConfig: WorkshopConfig = {
  id: '1',
  name: 'Taller Automotriz El Salvador',
  address: 'Av. Principal #123, San Salvador, El Salvador',
  phone: '(503) 2234-5678',
  email: 'contacto@tallerelsalvador.com',
  tax_id: '1234567890123',
  tax_regime: 'general',
  currency: 'USD',
  logo_url: null,
  business_hours: {
    open: '08:00',
    close: '17:00',
    workingDays: [0, 1, 2, 3, 4, 5] // Monday to Saturday
  },
  order_prefix: 'ORD',
  order_counter: 3,
  whatsapp_enabled: true,
  whatsapp_business_number: '(503) 7234-5678',
  whatsapp_api_token: 'whatsapp_token_placeholder',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z'
};
