// Base types
export type UserRole = 'admin' | 'reception' | 'technician';

export type OrderStatus = 
  | 'new' 
  | 'diagnosis' 
  | 'in_progress' 
  | 'waiting' 
  | 'approval' 
  | 'finished' 
  | 'delivered';

export type OwnerType = 'person' | 'company';

export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'error';

export type TimelineEntryType = 
  | 'note' 
  | 'task' 
  | 'diagnosis' 
  | 'labor' 
  | 'parts_purchase' 
  | 'status_change'
  | 'message_sent';

export type BudgetLineType = 'labor' | 'parts';

// Owner entity
export interface Owner {
  id: string;
  name: string;
  type: OwnerType;
  email?: string;
  phone: string;
  whatsappConsent: boolean;
  address?: string;
  taxId?: string; // RFC/NIT for companies
  tags: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Vehicle entity
export interface Vehicle {
  id: string;
  ownerId: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  vin?: string;
  color?: string;
  engine?: string;
  notes?: string;
  photos: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Budget line item
export interface BudgetLine {
  id: string;
  type: BudgetLineType;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number; // percentage
  discount: number; // percentage
  total: number;
  approved: boolean;
}

// Budget totals
export interface BudgetTotals {
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
}

// Order entity
export interface Order {
  id: string;
  folio: string;
  ownerId: string;
  vehicleId: string;
  status: OrderStatus;
  technicianId?: string;
  entryDate: Date;
  commitmentDate?: Date;
  deliveryDate?: Date;
  mileage?: number;
  fuelLevel?: number;
  reason: string;
  entryPhotos: string[];
  signature?: string; // base64 signature
  budget: {
    lines: BudgetLine[];
    totals: BudgetTotals;
    approved: boolean;
    approvedAt?: Date;
    approvedBy?: string;
  };
  attachments: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// Timeline entry
export interface TimelineEntry {
  id: string;
  orderId: string;
  type: TimelineEntryType;
  title: string;
  description: string;
  timeSpentMinutes?: number;
  authorId: string;
  authorName: string;
  attachments: string[];
  tags: string[];
  checklist?: {
    id: string;
    text: string;
    completed: boolean;
  }[];
  createdAt: Date;
}

// Parts invoice
export interface PartsInvoice {
  id: string;
  orderId: string;
  supplier: string;
  invoiceNumber: string;
  amount: number;
  taxAmount: number;
  currency: string;
  files: string[];
  linkedToBudgetLineId?: string;
  notes?: string;
  createdAt: Date;
  createdBy: string;
}

// WhatsApp message
export interface WhatsAppMessage {
  id: string;
  orderId: string;
  ownerId: string;
  templateId: string;
  variables: Record<string, string>;
  status: MessageStatus;
  content: string;
  channel: 'whatsapp';
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  errorMessage?: string;
  createdAt: Date;
  createdBy: string;
}

// WhatsApp template
export interface WhatsAppTemplate {
  id: string;
  name: string;
  content: string;
  variables: string[];
  language: string;
  active: boolean;
  category: 'order_update' | 'reminder' | 'approval' | 'delivery' | 'general';
  createdAt: Date;
  updatedAt: Date;
}

// User entity
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Workshop configuration (removed - see below for actual definition)

// Catalog entities
export interface OrderStatusConfig {
  id: string;
  key: OrderStatus;
  name: string;
  color: string;
  order: number;
  active: boolean;
}

export interface WorkType {
  id: string;
  name: string;
  description?: string;
  estimatedHours?: number;
  active: boolean;
}

export interface TaxConfig {
  id: string;
  name: string;
  rate: number;
  active: boolean;
}

export interface WorkshopConfig {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  tax_id: string | null;
  tax_regime: string;
  currency: string;
  logo_url: string | null;
  business_hours: any;
  order_prefix: string;
  order_counter: number;
  whatsapp_enabled: boolean;
  whatsapp_business_number: string | null;
  whatsapp_api_token: string | null;
  created_at: string;
  updated_at: string;
}

// API Response types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Filter and search types
export interface OrderFilters {
  status?: OrderStatus[];
  technicianId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  ownerId?: string;
  vehicleId?: string;
}

export interface OwnerFilters {
  type?: OwnerType;
  tags?: string[];
  search?: string;
  hasWhatsappConsent?: boolean;
}

export interface VehicleFilters {
  brand?: string;
  model?: string;
  year?: number;
  ownerId?: string;
  search?: string;
}

// Form types
export interface CreateOrderForm {
  ownerId: string;
  vehicleId: string;
  reason: string;
  mileage?: number;
  fuelLevel?: number;
  entryPhotos: File[];
  signature?: string;
  technicianId?: string;
  commitmentDate?: Date;
  budgetLines: Omit<BudgetLine, 'id' | 'total' | 'approved'>[];
}

export interface CreateOwnerForm {
  name: string;
  type: OwnerType;
  email?: string;
  phone: string;
  whatsappConsent: boolean;
  address?: string;
  taxId?: string;
  tags: string[];
  notes?: string;
}

export interface CreateVehicleForm {
  ownerId: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  vin?: string;
  color?: string;
  engine?: string;
  notes?: string;
  photos: File[];
}

// Dashboard KPIs
export interface DashboardKPIs {
  openOrders: number;
  inProgressOrders: number;
  deliveriesToday: number;
  pendingApproval: number;
  totalRevenue: number;
  averageOrderValue: number;
}

// Recent activities
export interface RecentActivity {
  id: string;
  type: 'order_created' | 'status_changed' | 'message_sent' | 'payment_received';
  title: string;
  description: string;
  orderId?: string;
  userId: string;
  userName: string;
  createdAt: Date;
}

// Permission system
export interface Permission {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete';
  condition?: string;
}

export interface RolePermissions {
  [key: string]: Permission[];
}

// UI State types
export interface UIState {
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  tableColumns: Record<string, string[]>;
  recentFilters: Record<string, any>;
}

// File upload types
export interface FileUpload {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  url?: string;
  error?: string;
}

// Notification types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  actions?: {
    label: string;
    action: () => void;
  }[];
}

// Extended types with relations
export interface OrderWithRelations extends Order {
  owner: Owner;
  vehicle: Vehicle;
  technician?: User;
  timeline: TimelineEntry[];
  invoices: PartsInvoice[];
  messages: WhatsAppMessage[];
}

export interface OwnerWithRelations extends Owner {
  vehicles: Vehicle[];
  orders: Order[];
}

export interface VehicleWithRelations extends Vehicle {
  owner: Owner;
  orders: Order[];
}
