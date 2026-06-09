export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      admin_notes: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          id: string
          job_id: string | null
          subject_user_id: string | null
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          id?: string
          job_id?: string | null
          subject_user_id?: string | null
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
          job_id?: string | null
          subject_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_notes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "cleaning_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_notes_subject_user_id_fkey"
            columns: ["subject_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cleaner_locations: {
        Row: {
          cleaner_id: string
          id: string
          job_id: string | null
          lat: number
          lng: number
          recorded_at: string
        }
        Insert: {
          cleaner_id: string
          id?: string
          job_id?: string | null
          lat: number
          lng: number
          recorded_at?: string
        }
        Update: {
          cleaner_id?: string
          id?: string
          job_id?: string | null
          lat?: number
          lng?: number
          recorded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cleaner_locations_cleaner_id_fkey"
            columns: ["cleaner_id"]
            isOneToOne: false
            referencedRelation: "cleaners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaner_locations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "cleaning_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      cleaners: {
        Row: {
          base_lat: number | null
          base_lng: number | null
          bio: string | null
          completion_rate: number
          created_at: string
          id: string
          is_available: boolean
          jobs_completed: number
          profile_id: string
          rating: number
          review_count: number
          specialties: Database["public"]["Enums"]["cleaning_type"][]
          updated_at: string
          verification: Database["public"]["Enums"]["cleaner_verification_status"]
        }
        Insert: {
          base_lat?: number | null
          base_lng?: number | null
          bio?: string | null
          completion_rate?: number
          created_at?: string
          id?: string
          is_available?: boolean
          jobs_completed?: number
          profile_id: string
          rating?: number
          review_count?: number
          specialties?: Database["public"]["Enums"]["cleaning_type"][]
          updated_at?: string
          verification?: Database["public"]["Enums"]["cleaner_verification_status"]
        }
        Update: {
          base_lat?: number | null
          base_lng?: number | null
          bio?: string | null
          completion_rate?: number
          created_at?: string
          id?: string
          is_available?: boolean
          jobs_completed?: number
          profile_id?: string
          rating?: number
          review_count?: number
          specialties?: Database["public"]["Enums"]["cleaning_type"][]
          updated_at?: string
          verification?: Database["public"]["Enums"]["cleaner_verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "cleaners_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cleaning_jobs: {
        Row: {
          address: string
          cleaner_id: string | null
          cleaning_type: Database["public"]["Enums"]["cleaning_type"]
          created_at: string
          eta_minutes: number | null
          final_price: number | null
          guest_contact: string | null
          homeowner_id: string | null
          id: string
          lat: number
          lng: number
          notes: string | null
          price_estimate_high: number
          price_estimate_low: number
          property_id: string | null
          property_size: Database["public"]["Enums"]["property_size"]
          scheduled_for: string | null
          status: Database["public"]["Enums"]["job_status"]
          updated_at: string
        }
        Insert: {
          address: string
          cleaner_id?: string | null
          cleaning_type: Database["public"]["Enums"]["cleaning_type"]
          created_at?: string
          eta_minutes?: number | null
          final_price?: number | null
          guest_contact?: string | null
          homeowner_id?: string | null
          id?: string
          lat: number
          lng: number
          notes?: string | null
          price_estimate_high?: number
          price_estimate_low?: number
          property_id?: string | null
          property_size: Database["public"]["Enums"]["property_size"]
          scheduled_for?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
        }
        Update: {
          address?: string
          cleaner_id?: string | null
          cleaning_type?: Database["public"]["Enums"]["cleaning_type"]
          created_at?: string
          eta_minutes?: number | null
          final_price?: number | null
          guest_contact?: string | null
          homeowner_id?: string | null
          id?: string
          lat?: number
          lng?: number
          notes?: string | null
          price_estimate_high?: number
          price_estimate_low?: number
          property_id?: string | null
          property_size?: Database["public"]["Enums"]["property_size"]
          scheduled_for?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cleaning_jobs_cleaner_id_fkey"
            columns: ["cleaner_id"]
            isOneToOne: false
            referencedRelation: "cleaners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_jobs_homeowner_id_fkey"
            columns: ["homeowner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_jobs_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      job_status_updates: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          job_id: string
          note: string | null
          status: Database["public"]["Enums"]["job_status"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          job_id: string
          note?: string | null
          status: Database["public"]["Enums"]["job_status"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          job_id?: string
          note?: string | null
          status?: Database["public"]["Enums"]["job_status"]
        }
        Relationships: [
          {
            foreignKeyName: "job_status_updates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_status_updates_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "cleaning_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      macao_banks: {
        Row: {
          id: string
          name: string | null
          paybill: string | null
        }
        Insert: {
          id: string
          name?: string | null
          paybill?: string | null
        }
        Update: {
          id?: string
          name?: string | null
          paybill?: string | null
        }
        Relationships: []
      }
      macao_invoices: {
        Row: {
          amount: number | null
          balance: number | null
          created_at: string | null
          createdBy: string | null
          dueDate: string | null
          id: string
          propertyId: string | null
          rentAmount: number | null
          status: string | null
          tenantId: string | null
          totalDue: number | null
          unitId: string | null
        }
        Insert: {
          amount?: number | null
          balance?: number | null
          created_at?: string | null
          createdBy?: string | null
          dueDate?: string | null
          id: string
          propertyId?: string | null
          rentAmount?: number | null
          status?: string | null
          tenantId?: string | null
          totalDue?: number | null
          unitId?: string | null
        }
        Update: {
          amount?: number | null
          balance?: number | null
          created_at?: string | null
          createdBy?: string | null
          dueDate?: string | null
          id?: string
          propertyId?: string | null
          rentAmount?: number | null
          status?: string | null
          tenantId?: string | null
          totalDue?: number | null
          unitId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "macao_invoices_tenantId_fkey"
            columns: ["tenantId"]
            isOneToOne: false
            referencedRelation: "macao_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      macao_payments: {
        Row: {
          amount: number | null
          created_at: string | null
          createdBy: string | null
          date: string | null
          id: string
          invoiceId: string | null
          method: string | null
          propertyId: string | null
          reference: string | null
          status: string | null
          tenantId: string | null
          unitId: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          createdBy?: string | null
          date?: string | null
          id: string
          invoiceId?: string | null
          method?: string | null
          propertyId?: string | null
          reference?: string | null
          status?: string | null
          tenantId?: string | null
          unitId?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          createdBy?: string | null
          date?: string | null
          id?: string
          invoiceId?: string | null
          method?: string | null
          propertyId?: string | null
          reference?: string | null
          status?: string | null
          tenantId?: string | null
          unitId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "macao_payments_invoiceId_fkey"
            columns: ["invoiceId"]
            isOneToOne: false
            referencedRelation: "macao_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "macao_payments_tenantId_fkey"
            columns: ["tenantId"]
            isOneToOne: false
            referencedRelation: "macao_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      macao_properties: {
        Row: {
          address: string | null
          created_at: string | null
          createdBy: string | null
          creatorEmail: string | null
          description: string | null
          id: string
          location: Json | null
          numberOfUnits: number | null
          paymentDetails: Json | null
          propertyName: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          createdBy?: string | null
          creatorEmail?: string | null
          description?: string | null
          id: string
          location?: Json | null
          numberOfUnits?: number | null
          paymentDetails?: Json | null
          propertyName?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          createdBy?: string | null
          creatorEmail?: string | null
          description?: string | null
          id?: string
          location?: Json | null
          numberOfUnits?: number | null
          paymentDetails?: Json | null
          propertyName?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      macao_tenants: {
        Row: {
          balance: number | null
          created_at: string | null
          createdBy: string | null
          creatorEmail: string | null
          email: string | null
          firstRentDueDate: string | null
          id: string
          leaseEndDate: string | null
          leaseStartDate: string | null
          moveInDate: string | null
          name: string | null
          nationalId: string | null
          phone: string | null
          propertyId: string | null
          securityDeposit: number | null
          status: string | null
          unitId: string | null
          unitName: string | null
          updated_at: string | null
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          createdBy?: string | null
          creatorEmail?: string | null
          email?: string | null
          firstRentDueDate?: string | null
          id: string
          leaseEndDate?: string | null
          leaseStartDate?: string | null
          moveInDate?: string | null
          name?: string | null
          nationalId?: string | null
          phone?: string | null
          propertyId?: string | null
          securityDeposit?: number | null
          status?: string | null
          unitId?: string | null
          unitName?: string | null
          updated_at?: string | null
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          createdBy?: string | null
          creatorEmail?: string | null
          email?: string | null
          firstRentDueDate?: string | null
          id?: string
          leaseEndDate?: string | null
          leaseStartDate?: string | null
          moveInDate?: string | null
          name?: string | null
          nationalId?: string | null
          phone?: string | null
          propertyId?: string | null
          securityDeposit?: number | null
          status?: string | null
          unitId?: string | null
          unitName?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "macao_tenants_propertyId_fkey"
            columns: ["propertyId"]
            isOneToOne: false
            referencedRelation: "macao_properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "macao_tenants_unitId_fkey"
            columns: ["unitId"]
            isOneToOne: false
            referencedRelation: "macao_units"
            referencedColumns: ["id"]
          },
        ]
      }
      macao_units: {
        Row: {
          bathrooms: number | null
          bedrooms: number | null
          created_at: string | null
          createdBy: string | null
          id: string
          name: string | null
          powerMeter: string | null
          propertyId: string | null
          rentAmount: number | null
          status: string | null
          tenantId: string | null
          updated_at: string | null
          waterMeter: string | null
        }
        Insert: {
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string | null
          createdBy?: string | null
          id: string
          name?: string | null
          powerMeter?: string | null
          propertyId?: string | null
          rentAmount?: number | null
          status?: string | null
          tenantId?: string | null
          updated_at?: string | null
          waterMeter?: string | null
        }
        Update: {
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string | null
          createdBy?: string | null
          id?: string
          name?: string | null
          powerMeter?: string | null
          propertyId?: string | null
          rentAmount?: number | null
          status?: string | null
          tenantId?: string | null
          updated_at?: string | null
          waterMeter?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "macao_units_propertyId_fkey"
            columns: ["propertyId"]
            isOneToOne: false
            referencedRelation: "macao_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      mpato_customers: {
        Row: {
          color: string
          created_at: string
          id: string
          last_seen: string | null
          name: string
          phone: string | null
          spent_cents: number
          store_id: string
          tag: Database["public"]["Enums"]["mpato_customer_tag"]
          visits: number
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          last_seen?: string | null
          name: string
          phone?: string | null
          spent_cents?: number
          store_id: string
          tag?: Database["public"]["Enums"]["mpato_customer_tag"]
          visits?: number
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          last_seen?: string | null
          name?: string
          phone?: string | null
          spent_cents?: number
          store_id?: string
          tag?: Database["public"]["Enums"]["mpato_customer_tag"]
          visits?: number
        }
        Relationships: [
          {
            foreignKeyName: "mpato_customers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "mpato_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      mpato_products: {
        Row: {
          category: string
          created_at: string
          glyph: string
          id: string
          name: string
          price_cents: number
          stock: number
          store_id: string
          tile: string
        }
        Insert: {
          category?: string
          created_at?: string
          glyph?: string
          id?: string
          name: string
          price_cents: number
          stock?: number
          store_id: string
          tile?: string
        }
        Update: {
          category?: string
          created_at?: string
          glyph?: string
          id?: string
          name?: string
          price_cents?: number
          stock?: number
          store_id?: string
          tile?: string
        }
        Relationships: [
          {
            foreignKeyName: "mpato_products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "mpato_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      mpato_sale_items: {
        Row: {
          id: string
          product_id: string | null
          product_name_snapshot: string
          qty: number
          sale_id: string
          unit_price_cents: number
        }
        Insert: {
          id?: string
          product_id?: string | null
          product_name_snapshot: string
          qty: number
          sale_id: string
          unit_price_cents: number
        }
        Update: {
          id?: string
          product_id?: string | null
          product_name_snapshot?: string
          qty?: number
          sale_id?: string
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "mpato_sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "mpato_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mpato_sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "mpato_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      mpato_sales: {
        Row: {
          cashier_id: string | null
          created_at: string
          customer_id: string | null
          id: string
          method: Database["public"]["Enums"]["mpato_payment_method"]
          mpesa_ref: string | null
          receipt_no: string
          store_id: string
          total_cents: number
        }
        Insert: {
          cashier_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          method: Database["public"]["Enums"]["mpato_payment_method"]
          mpesa_ref?: string | null
          receipt_no: string
          store_id: string
          total_cents: number
        }
        Update: {
          cashier_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          method?: Database["public"]["Enums"]["mpato_payment_method"]
          mpesa_ref?: string | null
          receipt_no?: string
          store_id?: string
          total_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "mpato_sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "mpato_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mpato_sales_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "mpato_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      mpato_store_members: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["mpato_role"]
          store_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["mpato_role"]
          store_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["mpato_role"]
          store_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mpato_store_members_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "mpato_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      mpato_stores: {
        Row: {
          area: string | null
          created_at: string
          default_payment_method: string
          id: string
          mpesa_paybill_number: string | null
          mpesa_till_number: string | null
          name: string
          owner_id: string
          receipt_footer: string | null
          receipt_show_contact: boolean
        }
        Insert: {
          area?: string | null
          created_at?: string
          default_payment_method?: string
          id?: string
          mpesa_paybill_number?: string | null
          mpesa_till_number?: string | null
          name: string
          owner_id: string
          receipt_footer?: string | null
          receipt_show_contact?: boolean
        }
        Update: {
          area?: string | null
          created_at?: string
          default_payment_method?: string
          id?: string
          mpesa_paybill_number?: string | null
          mpesa_till_number?: string | null
          name?: string
          owner_id?: string
          receipt_footer?: string | null
          receipt_show_contact?: boolean
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string
          id: string
          job_id: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          id?: string
          job_id?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          id?: string
          job_id?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "cleaning_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pato_appointments: {
        Row: {
          appointment_time: string
          commission_amount: number | null
          created_at: string | null
          customer_id: string | null
          id: string
          note: string | null
          organization_id: string | null
          service_id: string | null
          staff_name: string
          status: string | null
          user_id: string
        }
        Insert: {
          appointment_time: string
          commission_amount?: number | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          note?: string | null
          organization_id?: string | null
          service_id?: string | null
          staff_name: string
          status?: string | null
          user_id: string
        }
        Update: {
          appointment_time?: string
          commission_amount?: number | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          note?: string | null
          organization_id?: string | null
          service_id?: string | null
          staff_name?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pato_appointments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "pato_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pato_appointments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "pato_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pato_appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "pato_inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      pato_categories: {
        Row: {
          icon: string | null
          id: string
          name: string
          type: string
        }
        Insert: {
          icon?: string | null
          id?: string
          name: string
          type: string
        }
        Update: {
          icon?: string | null
          id?: string
          name?: string
          type?: string
        }
        Relationships: []
      }
      pato_customers: {
        Row: {
          created_at: string
          email: string | null
          id: string
          metadata: Json | null
          name: string
          notes: string | null
          organization_id: string | null
          phone: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          metadata?: Json | null
          name: string
          notes?: string | null
          organization_id?: string | null
          phone?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          notes?: string | null
          organization_id?: string | null
          phone?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "pato_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pato_customers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "pato_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pato_goods_receipts: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          organization_id: string | null
          purchase_order_id: string | null
          receipt_date: string | null
          received_by: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          purchase_order_id?: string | null
          receipt_date?: string | null
          received_by?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          purchase_order_id?: string | null
          receipt_date?: string | null
          received_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pato_goods_receipts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "pato_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pato_goods_receipts_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "pato_purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      pato_industries: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      pato_inventory: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          name: string
          organization_id: string | null
          quantity: number
          reorder_level: number | null
          sku: string | null
          unit_price: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          name: string
          organization_id?: string | null
          quantity?: number
          reorder_level?: number | null
          sku?: string | null
          unit_price?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          organization_id?: string | null
          quantity?: number
          reorder_level?: number | null
          sku?: string | null
          unit_price?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pato_inventory_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "pato_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pato_organization_members: {
        Row: {
          created_at: string | null
          email: string
          id: string
          organization_id: string
          role: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          organization_id: string
          role?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          organization_id?: string
          role?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "pato_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pato_organizations: {
        Row: {
          created_at: string | null
          id: string
          industry: string | null
          kra_pin: string | null
          name: string
          owner_id: string
          type: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          industry?: string | null
          kra_pin?: string | null
          name: string
          owner_id: string
          type?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          industry?: string | null
          kra_pin?: string | null
          name?: string
          owner_id?: string
          type?: string | null
        }
        Relationships: []
      }
      pato_payments: {
        Row: {
          amount: number
          created_at: string | null
          customer_id: string | null
          id: string
          organization_id: string | null
          payment_date: string | null
          payment_method: string | null
          payment_type: string | null
          purchase_order_id: string | null
          recorded_by: string | null
          sales_order_id: string | null
          transaction_reference: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          customer_id?: string | null
          id?: string
          organization_id?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_type?: string | null
          purchase_order_id?: string | null
          recorded_by?: string | null
          sales_order_id?: string | null
          transaction_reference?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          customer_id?: string | null
          id?: string
          organization_id?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_type?: string | null
          purchase_order_id?: string | null
          recorded_by?: string | null
          sales_order_id?: string | null
          transaction_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pato_payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "pato_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pato_payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "pato_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pato_payments_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "pato_purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pato_payments_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "pato_sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      pato_profiles: {
        Row: {
          business_name: string | null
          business_type: string | null
          full_name: string | null
          id: string
          income_types: string[] | null
          metadata: Json | null
          organization_id: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          business_name?: string | null
          business_type?: string | null
          full_name?: string | null
          id: string
          income_types?: string[] | null
          metadata?: Json | null
          organization_id?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          business_name?: string | null
          business_type?: string | null
          full_name?: string | null
          id?: string
          income_types?: string[] | null
          metadata?: Json | null
          organization_id?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "pato_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pato_purchase_order_items: {
        Row: {
          created_at: string | null
          id: string
          inventory_id: string | null
          purchase_order_id: string | null
          quantity: number
          received_quantity: number | null
          unit_cost: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          inventory_id?: string | null
          purchase_order_id?: string | null
          quantity: number
          received_quantity?: number | null
          unit_cost: number
        }
        Update: {
          created_at?: string | null
          id?: string
          inventory_id?: string | null
          purchase_order_id?: string | null
          quantity?: number
          received_quantity?: number | null
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "pato_purchase_order_items_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "pato_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pato_purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "pato_purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      pato_purchase_orders: {
        Row: {
          amount_paid: number | null
          created_at: string | null
          created_by: string | null
          expected_delivery_date: string | null
          id: string
          notes: string | null
          organization_id: string | null
          status: string | null
          supplier_id: string | null
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          amount_paid?: number | null
          created_at?: string | null
          created_by?: string | null
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          status?: string | null
          supplier_id?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          amount_paid?: number | null
          created_at?: string | null
          created_by?: string | null
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          status?: string | null
          supplier_id?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pato_purchase_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "pato_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pato_purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "pato_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      pato_sales_order_items: {
        Row: {
          created_at: string | null
          discount: number | null
          id: string
          inventory_id: string | null
          quantity: number
          sales_order_id: string | null
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          discount?: number | null
          id?: string
          inventory_id?: string | null
          quantity: number
          sales_order_id?: string | null
          unit_price: number
        }
        Update: {
          created_at?: string | null
          discount?: number | null
          id?: string
          inventory_id?: string | null
          quantity?: number
          sales_order_id?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "pato_sales_order_items_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "pato_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pato_sales_order_items_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "pato_sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      pato_sales_orders: {
        Row: {
          amount_paid: number | null
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          due_date: string | null
          id: string
          notes: string | null
          organization_id: string | null
          status: string | null
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          amount_paid?: number | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          amount_paid?: number | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pato_sales_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "pato_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pato_sales_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "pato_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pato_stock_ledger: {
        Row: {
          created_at: string | null
          created_by: string | null
          goods_receipt_id: string | null
          id: string
          inventory_id: string | null
          notes: string | null
          organization_id: string | null
          quantity_change: number
          reason_code: string | null
          sales_order_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          goods_receipt_id?: string | null
          id?: string
          inventory_id?: string | null
          notes?: string | null
          organization_id?: string | null
          quantity_change: number
          reason_code?: string | null
          sales_order_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          goods_receipt_id?: string | null
          id?: string
          inventory_id?: string | null
          notes?: string | null
          organization_id?: string | null
          quantity_change?: number
          reason_code?: string | null
          sales_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pato_stock_ledger_goods_receipt_id_fkey"
            columns: ["goods_receipt_id"]
            isOneToOne: false
            referencedRelation: "pato_goods_receipts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pato_stock_ledger_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "pato_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pato_stock_ledger_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "pato_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pato_stock_ledger_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "pato_sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      pato_suppliers: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          organization_id: string | null
          phone: string | null
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          organization_id?: string | null
          phone?: string | null
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          organization_id?: string | null
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pato_suppliers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "pato_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pato_transactions: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string | null
          customer_id: string | null
          id: string
          metadata: Json | null
          note: string | null
          organization_id: string | null
          source: string | null
          status: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          metadata?: Json | null
          note?: string | null
          organization_id?: string | null
          source?: string | null
          status?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          metadata?: Json | null
          note?: string | null
          organization_id?: string | null
          source?: string | null
          status?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pato_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "pato_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "pato_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "pato_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          job_id: string
          provider_ref: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          job_id: string
          provider_ref?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          job_id?: string
          provider_ref?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "cleaning_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_jobs: {
        Row: {
          job_id: string
          payout_id: string
        }
        Insert: {
          job_id: string
          payout_id: string
        }
        Update: {
          job_id?: string
          payout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_jobs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "cleaning_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_jobs_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "payouts"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          amount: number
          cleaner_id: string
          created_at: string
          currency: string
          id: string
          phone: string
          provider_ref: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          cleaner_id: string
          created_at?: string
          currency?: string
          id?: string
          phone: string
          provider_ref?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          cleaner_id?: string
          created_at?: string
          currency?: string
          id?: string
          phone?: string
          provider_ref?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payouts_cleaner_id_fkey"
            columns: ["cleaner_id"]
            isOneToOne: false
            referencedRelation: "cleaners"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_blocked: boolean
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          is_blocked?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_blocked?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string
          created_at: string
          id: string
          is_primary: boolean
          label: string
          lat: number
          lng: number
          notes: string | null
          owner_id: string
          size: Database["public"]["Enums"]["property_size"]
          updated_at: string
        }
        Insert: {
          address: string
          created_at?: string
          id?: string
          is_primary?: boolean
          label: string
          lat: number
          lng: number
          notes?: string | null
          owner_id: string
          size?: Database["public"]["Enums"]["property_size"]
          updated_at?: string
        }
        Update: {
          address?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          label?: string
          lat?: number
          lng?: number
          notes?: string | null
          owner_id?: string
          size?: Database["public"]["Enums"]["property_size"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          author_id: string | null
          cleaner_id: string
          comment: string | null
          created_at: string
          id: string
          job_id: string
          rating: number
        }
        Insert: {
          author_id?: string | null
          cleaner_id: string
          comment?: string | null
          created_at?: string
          id?: string
          job_id: string
          rating: number
        }
        Update: {
          author_id?: string | null
          cleaner_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          job_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_cleaner_id_fkey"
            columns: ["cleaner_id"]
            isOneToOne: false
            referencedRelation: "cleaners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "cleaning_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      uploaded_media: {
        Row: {
          captured_at: string
          created_at: string
          id: string
          job_id: string | null
          kind: Database["public"]["Enums"]["media_kind"]
          storage_path: string
          uploaded_by: string | null
          url: string | null
        }
        Insert: {
          captured_at?: string
          created_at?: string
          id?: string
          job_id?: string | null
          kind: Database["public"]["Enums"]["media_kind"]
          storage_path: string
          uploaded_by?: string | null
          url?: string | null
        }
        Update: {
          captured_at?: string
          created_at?: string
          id?: string
          job_id?: string | null
          kind?: Database["public"]["Enums"]["media_kind"]
          storage_path?: string
          uploaded_by?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "uploaded_media_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "cleaning_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uploaded_media_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_user_organizations: { Args: never; Returns: string[] }
      get_user_organizations_v3: { Args: never; Returns: string[] }
      get_user_organizations_v4: { Args: never; Returns: string[] }
      is_admin: { Args: never; Returns: boolean }
      mpato_is_store_member: { Args: { p_store: string }; Returns: boolean }
      recompute_cleaner_rating: {
        Args: { p_cleaner_id: string }
        Returns: undefined
      }
    }
    Enums: {
      cleaner_verification_status:
        | "pending"
        | "in_review"
        | "verified"
        | "rejected"
        | "suspended"
      cleaning_type: "standard" | "deep" | "move_out" | "airbnb_turnover"
      job_status:
        | "draft"
        | "searching"
        | "matched"
        | "accepted"
        | "on_the_way"
        | "arrived"
        | "started"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "issue"
      media_kind: "before" | "after" | "issue" | "verification"
      mpato_customer_tag: "Regular" | "VIP" | "Lapsing"
      mpato_payment_method: "mpesa" | "cash"
      mpato_role: "owner" | "manager" | "cashier"
      notification_channel: "in_app" | "push" | "email" | "sms"
      payment_status:
        | "pending"
        | "authorized"
        | "captured"
        | "refunded"
        | "failed"
      property_size: "studio" | "one_bed" | "two_bed" | "three_plus" | "house"
      user_role: "homeowner" | "cleaner" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      cleaner_verification_status: [
        "pending",
        "in_review",
        "verified",
        "rejected",
        "suspended",
      ],
      cleaning_type: ["standard", "deep", "move_out", "airbnb_turnover"],
      job_status: [
        "draft",
        "searching",
        "matched",
        "accepted",
        "on_the_way",
        "arrived",
        "started",
        "in_progress",
        "completed",
        "cancelled",
        "issue",
      ],
      media_kind: ["before", "after", "issue", "verification"],
      mpato_customer_tag: ["Regular", "VIP", "Lapsing"],
      mpato_payment_method: ["mpesa", "cash"],
      mpato_role: ["owner", "manager", "cashier"],
      notification_channel: ["in_app", "push", "email", "sms"],
      payment_status: [
        "pending",
        "authorized",
        "captured",
        "refunded",
        "failed",
      ],
      property_size: ["studio", "one_bed", "two_bed", "three_plus", "house"],
      user_role: ["homeowner", "cleaner", "admin"],
    },
  },
} as const
