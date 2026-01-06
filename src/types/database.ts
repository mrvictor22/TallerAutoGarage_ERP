export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'admin' | 'reception' | 'mechanic_lead' | 'technician'
export type OwnerType = 'person' | 'company'
export type OrderStatus =
  | 'new'
  | 'diagnosis'
  | 'waiting_approval'
  | 'approved'
  | 'in_progress'
  | 'waiting_parts'
  | 'quality_check'
  | 'ready'
  | 'delivered'
  | 'cancelled'
export type BudgetLineType = 'labor' | 'parts'
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
export type TimelineEntryType =
  | 'note'
  | 'task'
  | 'diagnosis'
  | 'labor'
  | 'parts_purchase'
  | 'status_change'
  | 'message_sent'
  | 'payment'
  | 'photo_added'
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'check' | 'credit'
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'refunded'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          avatar_url: string | null
          role: UserRole
          phone: string | null
          is_active: boolean
          is_approved: boolean
          approved_by: string | null
          approved_at: string | null
          permissions: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          avatar_url?: string | null
          role?: UserRole
          phone?: string | null
          is_active?: boolean
          is_approved?: boolean
          approved_by?: string | null
          approved_at?: string | null
          permissions?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          avatar_url?: string | null
          role?: UserRole
          phone?: string | null
          is_active?: boolean
          is_approved?: boolean
          approved_by?: string | null
          approved_at?: string | null
          permissions?: Json
          created_at?: string
          updated_at?: string
        }
      }
      owners: {
        Row: {
          id: string
          type: OwnerType
          name: string
          email: string | null
          phone: string
          phone_secondary: string | null
          whatsapp_consent: boolean
          address: string | null
          city: string | null
          state: string | null
          postal_code: string | null
          tax_id: string | null
          company_name: string | null
          contact_person: string | null
          tags: string[]
          notes: string | null
          total_spent: number
          total_orders: number
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          type?: OwnerType
          name: string
          email?: string | null
          phone: string
          phone_secondary?: string | null
          whatsapp_consent?: boolean
          address?: string | null
          city?: string | null
          state?: string | null
          postal_code?: string | null
          tax_id?: string | null
          company_name?: string | null
          contact_person?: string | null
          tags?: string[]
          notes?: string | null
          total_spent?: number
          total_orders?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          type?: OwnerType
          name?: string
          email?: string | null
          phone?: string
          phone_secondary?: string | null
          whatsapp_consent?: boolean
          address?: string | null
          city?: string | null
          state?: string | null
          postal_code?: string | null
          tax_id?: string | null
          company_name?: string | null
          contact_person?: string | null
          tags?: string[]
          notes?: string | null
          total_spent?: number
          total_orders?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      vehicles: {
        Row: {
          id: string
          owner_id: string
          plate: string
          brand: string
          model: string
          year: number
          vin: string | null
          color: string | null
          engine: string | null
          transmission: string | null
          fuel_type: string | null
          mileage: number | null
          last_service_date: string | null
          notes: string | null
          photos: string[]
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          plate: string
          brand: string
          model: string
          year: number
          vin?: string | null
          color?: string | null
          engine?: string | null
          transmission?: string | null
          fuel_type?: string | null
          mileage?: number | null
          last_service_date?: string | null
          notes?: string | null
          photos?: string[]
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          plate?: string
          brand?: string
          model?: string
          year?: number
          vin?: string | null
          color?: string | null
          engine?: string | null
          transmission?: string | null
          fuel_type?: string | null
          mileage?: number | null
          last_service_date?: string | null
          notes?: string | null
          photos?: string[]
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          folio: string
          owner_id: string
          vehicle_id: string
          status: OrderStatus
          technician_id: string | null
          entry_date: string
          entry_mileage: number | null
          fuel_level: number | null
          reason: string
          customer_complaints: string | null
          entry_photos: string[]
          entry_signature: string | null
          estimated_completion: string | null
          commitment_date: string | null
          actual_completion: string | null
          delivery_date: string | null
          diagnosis: string | null
          diagnosis_date: string | null
          diagnosed_by: string | null
          budget_approved: boolean
          budget_approved_at: string | null
          budget_approved_by: string | null
          approval_signature: string | null
          subtotal: number
          tax_amount: number
          discount_amount: number
          total: number
          payment_status: PaymentStatus
          amount_paid: number
          exit_mileage: number | null
          exit_photos: string[]
          exit_signature: string | null
          priority: number
          internal_notes: string | null
          attachments: string[]
          tags: string[]
          created_by: string | null
          created_at: string
          updated_at: string
          archived_at: string | null
          archived_by: string | null
        }
        Insert: {
          id?: string
          folio?: string
          owner_id: string
          vehicle_id: string
          status?: OrderStatus
          technician_id?: string | null
          entry_date?: string
          entry_mileage?: number | null
          fuel_level?: number | null
          reason: string
          customer_complaints?: string | null
          entry_photos?: string[]
          entry_signature?: string | null
          estimated_completion?: string | null
          commitment_date?: string | null
          actual_completion?: string | null
          delivery_date?: string | null
          diagnosis?: string | null
          diagnosis_date?: string | null
          diagnosed_by?: string | null
          budget_approved?: boolean
          budget_approved_at?: string | null
          budget_approved_by?: string | null
          approval_signature?: string | null
          subtotal?: number
          tax_amount?: number
          discount_amount?: number
          total?: number
          payment_status?: PaymentStatus
          amount_paid?: number
          exit_mileage?: number | null
          exit_photos?: string[]
          exit_signature?: string | null
          priority?: number
          internal_notes?: string | null
          attachments?: string[]
          tags?: string[]
          created_by?: string | null
          created_at?: string
          updated_at?: string
          archived_at?: string | null
          archived_by?: string | null
        }
        Update: {
          id?: string
          folio?: string
          owner_id?: string
          vehicle_id?: string
          status?: OrderStatus
          technician_id?: string | null
          entry_date?: string
          entry_mileage?: number | null
          fuel_level?: number | null
          reason?: string
          customer_complaints?: string | null
          entry_photos?: string[]
          entry_signature?: string | null
          estimated_completion?: string | null
          commitment_date?: string | null
          actual_completion?: string | null
          delivery_date?: string | null
          diagnosis?: string | null
          diagnosis_date?: string | null
          diagnosed_by?: string | null
          budget_approved?: boolean
          budget_approved_at?: string | null
          budget_approved_by?: string | null
          approval_signature?: string | null
          subtotal?: number
          tax_amount?: number
          discount_amount?: number
          total?: number
          payment_status?: PaymentStatus
          amount_paid?: number
          exit_mileage?: number | null
          exit_photos?: string[]
          exit_signature?: string | null
          priority?: number
          internal_notes?: string | null
          attachments?: string[]
          tags?: string[]
          created_by?: string | null
          created_at?: string
          updated_at?: string
          archived_at?: string | null
          archived_by?: string | null
        }
      }
      budget_lines: {
        Row: {
          id: string
          order_id: string
          type: BudgetLineType
          description: string
          quantity: number
          unit_price: number
          tax_rate: number
          discount_percent: number
          subtotal: number
          tax_amount: number
          total: number
          approved: boolean
          part_number: string | null
          supplier: string | null
          cost_price: number | null
          sort_order: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          type: BudgetLineType
          description: string
          quantity?: number
          unit_price: number
          tax_rate?: number
          discount_percent?: number
          subtotal?: number
          tax_amount?: number
          total?: number
          approved?: boolean
          part_number?: string | null
          supplier?: string | null
          cost_price?: number | null
          sort_order?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          type?: BudgetLineType
          description?: string
          quantity?: number
          unit_price?: number
          tax_rate?: number
          discount_percent?: number
          subtotal?: number
          tax_amount?: number
          total?: number
          approved?: boolean
          part_number?: string | null
          supplier?: string | null
          cost_price?: number | null
          sort_order?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      timeline_entries: {
        Row: {
          id: string
          order_id: string
          type: TimelineEntryType
          title: string
          description: string | null
          time_spent_minutes: number | null
          old_status: OrderStatus | null
          new_status: OrderStatus | null
          attachments: string[]
          tags: string[]
          metadata: Json
          checklist: Json
          author_id: string
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          type: TimelineEntryType
          title: string
          description?: string | null
          time_spent_minutes?: number | null
          old_status?: OrderStatus | null
          new_status?: OrderStatus | null
          attachments?: string[]
          tags?: string[]
          metadata?: Json
          checklist?: Json
          author_id: string
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          type?: TimelineEntryType
          title?: string
          description?: string | null
          time_spent_minutes?: number | null
          old_status?: OrderStatus | null
          new_status?: OrderStatus | null
          attachments?: string[]
          tags?: string[]
          metadata?: Json
          checklist?: Json
          author_id?: string
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          order_id: string
          amount: number
          payment_method: PaymentMethod
          reference_number: string | null
          notes: string | null
          payment_date: string
          received_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          amount: number
          payment_method: PaymentMethod
          reference_number?: string | null
          notes?: string | null
          payment_date?: string
          received_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          amount?: number
          payment_method?: PaymentMethod
          reference_number?: string | null
          notes?: string | null
          payment_date?: string
          received_by?: string | null
          created_at?: string
        }
      }
      parts_invoices: {
        Row: {
          id: string
          order_id: string
          budget_line_id: string | null
          supplier: string
          invoice_number: string | null
          invoice_date: string | null
          subtotal: number
          tax_amount: number
          total: number
          currency: string
          file_urls: string[]
          notes: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          budget_line_id?: string | null
          supplier: string
          invoice_number?: string | null
          invoice_date?: string | null
          subtotal: number
          tax_amount?: number
          total: number
          currency?: string
          file_urls?: string[]
          notes?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          budget_line_id?: string | null
          supplier?: string
          invoice_number?: string | null
          invoice_date?: string | null
          subtotal?: number
          tax_amount?: number
          total?: number
          currency?: string
          file_urls?: string[]
          notes?: string | null
          created_by?: string | null
          created_at?: string
        }
      }
      whatsapp_templates: {
        Row: {
          id: string
          name: string
          category: string
          content: string
          variables: string[]
          language: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category: string
          content: string
          variables?: string[]
          language?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string
          content?: string
          variables?: string[]
          language?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      whatsapp_messages: {
        Row: {
          id: string
          order_id: string | null
          owner_id: string
          template_id: string | null
          phone_number: string
          content: string
          variables: Json
          status: MessageStatus
          external_id: string | null
          error_message: string | null
          sent_at: string | null
          delivered_at: string | null
          read_at: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id?: string | null
          owner_id: string
          template_id?: string | null
          phone_number: string
          content: string
          variables?: Json
          status?: MessageStatus
          external_id?: string | null
          error_message?: string | null
          sent_at?: string | null
          delivered_at?: string | null
          read_at?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string | null
          owner_id?: string
          template_id?: string | null
          phone_number?: string
          content?: string
          variables?: Json
          status?: MessageStatus
          external_id?: string | null
          error_message?: string | null
          sent_at?: string | null
          delivered_at?: string | null
          read_at?: string | null
          created_by?: string | null
          created_at?: string
        }
      }
      workshop_config: {
        Row: {
          id: string
          name: string
          address: string | null
          phone: string | null
          email: string | null
          tax_id: string | null
          tax_regime: string
          currency: string
          logo_url: string | null
          business_hours: Json
          order_prefix: string
          order_counter: number
          whatsapp_enabled: boolean
          whatsapp_business_number: string | null
          whatsapp_api_token: string | null
          primary_color: string | null
          secondary_color: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address?: string | null
          phone?: string | null
          email?: string | null
          tax_id?: string | null
          tax_regime?: string
          currency?: string
          logo_url?: string | null
          business_hours?: Json
          order_prefix?: string
          order_counter?: number
          whatsapp_enabled?: boolean
          whatsapp_business_number?: string | null
          whatsapp_api_token?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string | null
          phone?: string | null
          email?: string | null
          tax_id?: string | null
          tax_regime?: string
          currency?: string
          logo_url?: string | null
          business_hours?: Json
          order_prefix?: string
          order_counter?: number
          whatsapp_enabled?: boolean
          whatsapp_business_number?: string | null
          whatsapp_api_token?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      expense_categories: {
        Row: {
          id: string
          name: string
          description: string | null
          color: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          color?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          color?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          category_id: string | null
          description: string
          amount: number
          expense_date: string
          payment_method: PaymentMethod | null
          reference_number: string | null
          file_urls: string[]
          notes: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          category_id?: string | null
          description: string
          amount: number
          expense_date: string
          payment_method?: PaymentMethod | null
          reference_number?: string | null
          file_urls?: string[]
          notes?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          category_id?: string | null
          description?: string
          amount?: number
          expense_date?: string
          payment_method?: PaymentMethod | null
          reference_number?: string | null
          file_urls?: string[]
          notes?: string | null
          created_by?: string | null
          created_at?: string
        }
      }
      audit_log: {
        Row: {
          id: string
          table_name: string
          record_id: string
          action: string
          old_data: Json | null
          new_data: Json | null
          user_id: string | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          table_name: string
          record_id: string
          action: string
          old_data?: Json | null
          new_data?: Json | null
          user_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          table_name?: string
          record_id?: string
          action?: string
          old_data?: Json | null
          new_data?: Json | null
          user_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      user_role: {
        Args: Record<PropertyKey, never>
        Returns: UserRole
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      user_role: UserRole
      owner_type: OwnerType
      order_status: OrderStatus
      budget_line_type: BudgetLineType
      message_status: MessageStatus
      timeline_entry_type: TimelineEntryType
      payment_method: PaymentMethod
      payment_status: PaymentStatus
    }
  }
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Owner = Database['public']['Tables']['owners']['Row']
export type Vehicle = Database['public']['Tables']['vehicles']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type BudgetLine = Database['public']['Tables']['budget_lines']['Row']
export type TimelineEntry = Database['public']['Tables']['timeline_entries']['Row']
export type Payment = Database['public']['Tables']['payments']['Row']
export type PartsInvoice = Database['public']['Tables']['parts_invoices']['Row']
export type WhatsAppTemplate = Database['public']['Tables']['whatsapp_templates']['Row']
export type WhatsAppMessage = Database['public']['Tables']['whatsapp_messages']['Row']
export type WorkshopConfig = Database['public']['Tables']['workshop_config']['Row']
export type ExpenseCategory = Database['public']['Tables']['expense_categories']['Row']
export type Expense = Database['public']['Tables']['expenses']['Row']

// Insert types
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type OwnerInsert = Database['public']['Tables']['owners']['Insert']
export type VehicleInsert = Database['public']['Tables']['vehicles']['Insert']
export type OrderInsert = Database['public']['Tables']['orders']['Insert']
export type BudgetLineInsert = Database['public']['Tables']['budget_lines']['Insert']
export type TimelineEntryInsert = Database['public']['Tables']['timeline_entries']['Insert']
export type PaymentInsert = Database['public']['Tables']['payments']['Insert']

// Update types
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
export type OwnerUpdate = Database['public']['Tables']['owners']['Update']
export type VehicleUpdate = Database['public']['Tables']['vehicles']['Update']
export type OrderUpdate = Database['public']['Tables']['orders']['Update']
export type BudgetLineUpdate = Database['public']['Tables']['budget_lines']['Update']

// Extended types with relations
export interface OrderWithRelations extends Order {
  owner: Owner
  vehicle: Vehicle
  technician?: Profile
  budget_lines: BudgetLine[]
  timeline_entries: TimelineEntry[]
  payments: Payment[]
  parts_invoices: PartsInvoice[]
  messages: WhatsAppMessage[]
}

export interface OwnerWithRelations extends Owner {
  vehicles: Vehicle[]
  orders: Order[]
}

export interface VehicleWithRelations extends Vehicle {
  owner: Owner
  orders: Order[]
}
