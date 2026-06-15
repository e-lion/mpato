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
      cleanly_admin_notes: {
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
            referencedRelation: "cleanly_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_notes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "cleanly_cleaning_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_notes_subject_user_id_fkey"
            columns: ["subject_user_id"]
            isOneToOne: false
            referencedRelation: "cleanly_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cleanly_cleaner_locations: {
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
            referencedRelation: "cleanly_cleaners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaner_locations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "cleanly_cleaning_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      cleanly_cleaners: {
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
            referencedRelation: "cleanly_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cleanly_cleaning_jobs: {
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
            referencedRelation: "cleanly_cleaners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_jobs_homeowner_id_fkey"
            columns: ["homeowner_id"]
            isOneToOne: false
            referencedRelation: "cleanly_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_jobs_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "cleanly_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      cleanly_job_status_updates: {
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
            referencedRelation: "cleanly_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_status_updates_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "cleanly_cleaning_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      cleanly_notifications: {
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
            referencedRelation: "cleanly_cleaning_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "cleanly_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cleanly_payments: {
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
            referencedRelation: "cleanly_cleaning_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      cleanly_payout_jobs: {
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
            referencedRelation: "cleanly_cleaning_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_jobs_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "cleanly_payouts"
            referencedColumns: ["id"]
          },
        ]
      }
      cleanly_payouts: {
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
            referencedRelation: "cleanly_cleaners"
            referencedColumns: ["id"]
          },
        ]
      }
      cleanly_profiles: {
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
      cleanly_properties: {
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
            referencedRelation: "cleanly_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cleanly_reviews: {
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
            referencedRelation: "cleanly_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_cleaner_id_fkey"
            columns: ["cleaner_id"]
            isOneToOne: false
            referencedRelation: "cleanly_cleaners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "cleanly_cleaning_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      cleanly_uploaded_media: {
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
            referencedRelation: "cleanly_cleaning_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uploaded_media_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "cleanly_profiles"
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
      macao_messages: {
        Row: {
          body: string
          created_at: string | null
          createdBy: string | null
          id: string
          status: string | null
          tenantId: string | null
          toPhone: string | null
        }
        Insert: {
          body: string
          created_at?: string | null
          createdBy?: string | null
          id?: string
          status?: string | null
          tenantId?: string | null
          toPhone?: string | null
        }
        Update: {
          body?: string
          created_at?: string | null
          createdBy?: string | null
          id?: string
          status?: string | null
          tenantId?: string | null
          toPhone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "macao_messages_tenantId_fkey"
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
          leaseRules: Json | null
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
          leaseRules?: Json | null
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
          leaseRules?: Json | null
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
          electricityDeposit: number | null
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
          rentAmount: number | null
          rentDeposit: number | null
          securityDeposit: number | null
          status: string | null
          unitId: string | null
          unitName: string | null
          updated_at: string | null
          waterDeposit: number | null
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          createdBy?: string | null
          creatorEmail?: string | null
          electricityDeposit?: number | null
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
          rentAmount?: number | null
          rentDeposit?: number | null
          securityDeposit?: number | null
          status?: string | null
          unitId?: string | null
          unitName?: string | null
          updated_at?: string | null
          waterDeposit?: number | null
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          createdBy?: string | null
          creatorEmail?: string | null
          electricityDeposit?: number | null
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
          rentAmount?: number | null
          rentDeposit?: number | null
          securityDeposit?: number | null
          status?: string | null
          unitId?: string | null
          unitName?: string | null
          updated_at?: string | null
          waterDeposit?: number | null
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
      macao_user_settings: {
        Row: {
          created_at: string | null
          id: string
          notifications: Json | null
          payment_methods: Json | null
          profile: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notifications?: Json | null
          payment_methods?: Json | null
          profile?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notifications?: Json | null
          payment_methods?: Json | null
          profile?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
      mpato_payments_transactions: {
        Row: {
          checkout_request_id: string
          created_at: string
          receipt_number: string
        }
        Insert: {
          checkout_request_id: string
          created_at?: string
          receipt_number: string
        }
        Update: {
          checkout_request_id?: string
          created_at?: string
          receipt_number?: string
        }
        Relationships: []
      }
      mpato_products: {
        Row: {
          category: string
          cost_cents: number
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
          cost_cents?: number
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
          cost_cents?: number
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
          mpesa_ref_entered: boolean
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
          mpesa_ref_entered?: boolean
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
          mpesa_ref_entered?: boolean
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
      mpato_staff: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          role: string
          store_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          role?: string
          store_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          role?: string
          store_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mpato_staff_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "mpato_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      mpato_stock_receipt_items: {
        Row: {
          id: string
          product_id: string | null
          product_name_snapshot: string
          qty: number
          receipt_id: string
          unit_cost_cents: number
        }
        Insert: {
          id?: string
          product_id?: string | null
          product_name_snapshot: string
          qty: number
          receipt_id: string
          unit_cost_cents?: number
        }
        Update: {
          id?: string
          product_id?: string | null
          product_name_snapshot?: string
          qty?: number
          receipt_id?: string
          unit_cost_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "mpato_stock_receipt_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "mpato_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mpato_stock_receipt_items_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "mpato_stock_receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      mpato_stock_receipts: {
        Row: {
          amount_paid_cents: number
          created_at: string
          delivery_date: string
          id: string
          notes: string | null
          payment_status: string
          receipt_no: string
          received_by: string | null
          reference: string | null
          store_id: string
          supplier_id: string | null
          total_cost_cents: number
        }
        Insert: {
          amount_paid_cents?: number
          created_at?: string
          delivery_date: string
          id?: string
          notes?: string | null
          payment_status?: string
          receipt_no: string
          received_by?: string | null
          reference?: string | null
          store_id: string
          supplier_id?: string | null
          total_cost_cents?: number
        }
        Update: {
          amount_paid_cents?: number
          created_at?: string
          delivery_date?: string
          id?: string
          notes?: string | null
          payment_status?: string
          receipt_no?: string
          received_by?: string | null
          reference?: string | null
          store_id?: string
          supplier_id?: string | null
          total_cost_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "mpato_stock_receipts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "mpato_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mpato_stock_receipts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "mpato_suppliers"
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
      mpato_supplier_payments: {
        Row: {
          amount_cents: number
          created_at: string
          id: string
          method: string
          receipt_id: string
          reference: string | null
          store_id: string
          supplier_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          id?: string
          method: string
          receipt_id: string
          reference?: string | null
          store_id: string
          supplier_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          id?: string
          method?: string
          receipt_id?: string
          reference?: string | null
          store_id?: string
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mpato_supplier_payments_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "mpato_stock_receipts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mpato_supplier_payments_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "mpato_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mpato_supplier_payments_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "mpato_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      mpato_suppliers: {
        Row: {
          contact: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          phone: string | null
          store_id: string
        }
        Insert: {
          contact?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          store_id: string
        }
        Update: {
          contact?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mpato_suppliers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "mpato_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      mpato_whatsapp_messages: {
        Row: {
          content: string
          created_at: string
          customer_id: string | null
          direction: string
          id: string
          phone_number: string
          store_id: string
        }
        Insert: {
          content: string
          created_at?: string
          customer_id?: string | null
          direction: string
          id?: string
          phone_number: string
          store_id: string
        }
        Update: {
          content?: string
          created_at?: string
          customer_id?: string | null
          direction?: string
          id?: string
          phone_number?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mpato_whatsapp_messages_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "mpato_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mpato_whatsapp_messages_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "mpato_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      novapay_mpesa_transactions: {
        Row: {
          account_reference: string | null
          amount: number | null
          app_id: string | null
          checkout_request_id: string
          client_callback_url: string | null
          created_at: string
          id: string
          phone_number: string | null
          raw_callback: Json | null
          receipt_number: string | null
          result_desc: string | null
          status: string
        }
        Insert: {
          account_reference?: string | null
          amount?: number | null
          app_id?: string | null
          checkout_request_id: string
          client_callback_url?: string | null
          created_at?: string
          id?: string
          phone_number?: string | null
          raw_callback?: Json | null
          receipt_number?: string | null
          result_desc?: string | null
          status: string
        }
        Update: {
          account_reference?: string | null
          amount?: number | null
          app_id?: string | null
          checkout_request_id?: string
          client_callback_url?: string | null
          created_at?: string
          id?: string
          phone_number?: string | null
          raw_callback?: Json | null
          receipt_number?: string | null
          result_desc?: string | null
          status?: string
        }
        Relationships: []
      }
      securx_org_members: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          org_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          org_id: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          org_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "securx_org_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "securx_orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      securx_orgs: {
        Row: {
          created_at: string
          created_by: string
          id: string
          join_code: string
          name: string
          org_type: string
          retention_days: number
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          join_code?: string
          name: string
          org_type: string
          retention_days?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          join_code?: string
          name?: string
          org_type?: string
          retention_days?: number
        }
        Relationships: []
      }
      securx_site_guards: {
        Row: {
          created_at: string
          id: string
          site_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          site_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          site_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "securx_site_guards_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "securx_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      securx_sites: {
        Row: {
          active: boolean
          address: string | null
          code: string
          county: string | null
          created_at: string
          created_by: string
          firm_org_id: string | null
          id: string
          link_code: string
          name: string
          owner_org_id: string | null
        }
        Insert: {
          active?: boolean
          address?: string | null
          code?: string
          county?: string | null
          created_at?: string
          created_by: string
          firm_org_id?: string | null
          id?: string
          link_code?: string
          name: string
          owner_org_id?: string | null
        }
        Update: {
          active?: boolean
          address?: string | null
          code?: string
          county?: string | null
          created_at?: string
          created_by?: string
          firm_org_id?: string | null
          id?: string
          link_code?: string
          name?: string
          owner_org_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "securx_sites_firm_org_id_fkey"
            columns: ["firm_org_id"]
            isOneToOne: false
            referencedRelation: "securx_orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "securx_sites_owner_org_id_fkey"
            columns: ["owner_org_id"]
            isOneToOne: false
            referencedRelation: "securx_orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      securx_sms_log: {
        Row: {
          at_http_status: number | null
          at_response: string | null
          created_at: string
          id: string
          outcome: string | null
          to_phone: string | null
        }
        Insert: {
          at_http_status?: number | null
          at_response?: string | null
          created_at?: string
          id?: string
          outcome?: string | null
          to_phone?: string | null
        }
        Update: {
          at_http_status?: number | null
          at_response?: string | null
          created_at?: string
          id?: string
          outcome?: string | null
          to_phone?: string | null
        }
        Relationships: []
      }
      securx_visitors: {
        Row: {
          created_at: string
          full_name: string
          id: string
          last_seen_at: string
          national_id: string
          org_id: string
          phone: string | null
          visit_count: number
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          last_seen_at?: string
          national_id: string
          org_id: string
          phone?: string | null
          visit_count?: number
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          last_seen_at?: string
          national_id?: string
          org_id?: string
          phone?: string | null
          visit_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "securx_visitors_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "securx_orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      securx_visits: {
        Row: {
          anonymised_at: string | null
          checked_in_at: string
          checked_out_at: string | null
          checked_out_by: string | null
          client_id: string | null
          created_at: string
          destination: string | null
          full_name: string
          guard_id: string | null
          id: string
          national_id: string | null
          phone: string | null
          purpose: string | null
          site_id: string
          source: string
          status: string
          vehicle_plate: string | null
          visitor_id: string | null
        }
        Insert: {
          anonymised_at?: string | null
          checked_in_at?: string
          checked_out_at?: string | null
          checked_out_by?: string | null
          client_id?: string | null
          created_at?: string
          destination?: string | null
          full_name: string
          guard_id?: string | null
          id?: string
          national_id?: string | null
          phone?: string | null
          purpose?: string | null
          site_id: string
          source?: string
          status?: string
          vehicle_plate?: string | null
          visitor_id?: string | null
        }
        Update: {
          anonymised_at?: string | null
          checked_in_at?: string
          checked_out_at?: string | null
          checked_out_by?: string | null
          client_id?: string | null
          created_at?: string
          destination?: string | null
          full_name?: string
          guard_id?: string | null
          id?: string
          national_id?: string | null
          phone?: string | null
          purpose?: string | null
          site_id?: string
          source?: string
          status?: string
          vehicle_plate?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "securx_visits_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "securx_sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "securx_visits_visitor_id_fkey"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "securx_visitors"
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
      mpato_accept_invite: { Args: never; Returns: string }
      mpato_is_store_member: { Args: { p_store: string }; Returns: boolean }
      mpato_provision_store: { Args: { p_shop_name: string }; Returns: string }
      mpato_receive_stock: {
        Args: {
          p_delivery_date: string
          p_items: Json
          p_notes: string
          p_reference: string
          p_store_id: string
          p_supplier_id: string
        }
        Returns: {
          out_line_count: number
          out_receipt_id: string
          out_receipt_no: string
          out_total_cents: number
        }[]
      }
      mpato_record_sale: {
        Args: {
          p_customer_id?: string
          p_items: Json
          p_method: string
          p_mpesa_ref?: string
          p_store_id: string
        }
        Returns: {
          out_mpesa_ref: string
          out_receipt_no: string
          out_sale_id: string
          out_total_cents: number
        }[]
      }
      mpato_remove_staff: { Args: { p_staff_id: string }; Returns: undefined }
      mpato_store_cashiers: {
        Args: { p_store_id: string }
        Returns: {
          name: string
          user_id: string
        }[]
      }
      mpato_sync_member_role: {
        Args: { p_staff_id: string }
        Returns: undefined
      }
      mpato_top_products: {
        Args: { p_limit?: number; p_store_id: string }
        Returns: {
          glyph: string
          name: string
          product_id: string
          revenue: number
          sold: number
          tile: string
        }[]
      }
      mpato_week_sales: {
        Args: { p_store_id: string }
        Returns: {
          cash: number
          day_label: string
          mpesa: number
        }[]
      }
      recompute_cleaner_rating: {
        Args: { p_cleaner_id: string }
        Returns: undefined
      }
      securx_anonymise_expired: { Args: never; Returns: number }
      securx_can_access_site: { Args: { p_site: string }; Returns: boolean }
      securx_is_org_admin: { Args: { p_org: string }; Returns: boolean }
      securx_join_org: { Args: { p_code: string }; Returns: string }
      securx_link_site: {
        Args: { p_link_code: string; p_org: string }
        Returns: string
      }
      securx_self_checkin: {
        Args: {
          p_client_id?: string
          p_destination?: string
          p_full_name: string
          p_national_id: string
          p_phone?: string
          p_purpose?: string
          p_site_code: string
          p_vehicle_plate?: string
        }
        Returns: string
      }
      securx_site_public_info: {
        Args: { p_site_code: string }
        Returns: {
          site_name: string
        }[]
      }
      securx_user_orgs: { Args: never; Returns: string[] }
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
