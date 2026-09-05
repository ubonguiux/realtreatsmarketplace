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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          cart_id: string
          created_at: string
          id: string
          product_id: string
          quantity: number
          unit_price: number
          vendor_id: string
        }
        Insert: {
          cart_id: string
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          unit_price: number
          vendor_id: string
        }
        Update: {
          cart_id?: string
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_addresses: {
        Row: {
          address: string
          city: string | null
          country: string | null
          created_at: string
          id: string
          is_default: boolean
          label: string | null
          latitude: number | null
          longitude: number | null
          phone: string | null
          recipient_name: string | null
          state: string | null
          user_id: string
        }
        Insert: {
          address: string
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string | null
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          recipient_name?: string | null
          state?: string | null
          user_id: string
        }
        Update: {
          address?: string
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string | null
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          recipient_name?: string | null
          state?: string | null
          user_id?: string
        }
        Relationships: []
      }
      deliveries: {
        Row: {
          accepted_at: string | null
          assigned_at: string | null
          created_at: string
          customer_id: string
          delivered_at: string | null
          delivery_address: string | null
          delivery_instructions: string | null
          delivery_latitude: number | null
          delivery_longitude: number | null
          despatcher_id: string | null
          despatcher_latitude: number | null
          despatcher_location_at: string | null
          despatcher_longitude: number | null
          distance_km: number | null
          driver_name: string | null
          driver_phone: string | null
          estimated_delivery_at: string | null
          failure_reason: string | null
          fee: number
          id: string
          order_id: string
          picked_up_at: string | null
          pickup_address: string | null
          pickup_latitude: number | null
          pickup_longitude: number | null
          provider: string
          status: Database["public"]["Enums"]["delivery_status"]
          tracking_reference: string | null
          updated_at: string
          vendor_id: string
          vendor_order_id: string
        }
        Insert: {
          accepted_at?: string | null
          assigned_at?: string | null
          created_at?: string
          customer_id: string
          delivered_at?: string | null
          delivery_address?: string | null
          delivery_instructions?: string | null
          delivery_latitude?: number | null
          delivery_longitude?: number | null
          despatcher_id?: string | null
          despatcher_latitude?: number | null
          despatcher_location_at?: string | null
          despatcher_longitude?: number | null
          distance_km?: number | null
          driver_name?: string | null
          driver_phone?: string | null
          estimated_delivery_at?: string | null
          failure_reason?: string | null
          fee?: number
          id?: string
          order_id: string
          picked_up_at?: string | null
          pickup_address?: string | null
          pickup_latitude?: number | null
          pickup_longitude?: number | null
          provider?: string
          status?: Database["public"]["Enums"]["delivery_status"]
          tracking_reference?: string | null
          updated_at?: string
          vendor_id: string
          vendor_order_id: string
        }
        Update: {
          accepted_at?: string | null
          assigned_at?: string | null
          created_at?: string
          customer_id?: string
          delivered_at?: string | null
          delivery_address?: string | null
          delivery_instructions?: string | null
          delivery_latitude?: number | null
          delivery_longitude?: number | null
          despatcher_id?: string | null
          despatcher_latitude?: number | null
          despatcher_location_at?: string | null
          despatcher_longitude?: number | null
          distance_km?: number | null
          driver_name?: string | null
          driver_phone?: string | null
          estimated_delivery_at?: string | null
          failure_reason?: string | null
          fee?: number
          id?: string
          order_id?: string
          picked_up_at?: string | null
          pickup_address?: string | null
          pickup_latitude?: number | null
          pickup_longitude?: number | null
          provider?: string
          status?: Database["public"]["Enums"]["delivery_status"]
          tracking_reference?: string | null
          updated_at?: string
          vendor_id?: string
          vendor_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_despatcher_id_fkey"
            columns: ["despatcher_id"]
            isOneToOne: false
            referencedRelation: "despatchers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_vendor_order_id_fkey"
            columns: ["vendor_order_id"]
            isOneToOne: false
            referencedRelation: "vendor_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_events: {
        Row: {
          created_at: string
          customer_id: string
          delivery_id: string
          id: string
          note: string | null
          status: Database["public"]["Enums"]["delivery_status"]
          vendor_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          delivery_id: string
          id?: string
          note?: string | null
          status: Database["public"]["Enums"]["delivery_status"]
          vendor_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          delivery_id?: string
          id?: string
          note?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_events_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_events_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      despatchers: {
        Row: {
          active_deliveries: number
          address: string | null
          availability: Database["public"]["Enums"]["despatcher_availability"]
          business_name: string | null
          city: string | null
          completed_deliveries: number
          country: string
          created_at: string
          current_latitude: number | null
          current_longitude: number | null
          email: string | null
          full_name: string
          id: string
          id_document_url: string | null
          latitude: number | null
          location_updated_at: string | null
          longitude: number | null
          phone: string | null
          rating: number | null
          rejection_reason: string | null
          service_radius_km: number
          state: string | null
          status: Database["public"]["Enums"]["despatcher_status"]
          updated_at: string
          user_id: string
          vehicle_plate: string | null
          vehicle_type: string
        }
        Insert: {
          active_deliveries?: number
          address?: string | null
          availability?: Database["public"]["Enums"]["despatcher_availability"]
          business_name?: string | null
          city?: string | null
          completed_deliveries?: number
          country?: string
          created_at?: string
          current_latitude?: number | null
          current_longitude?: number | null
          email?: string | null
          full_name: string
          id?: string
          id_document_url?: string | null
          latitude?: number | null
          location_updated_at?: string | null
          longitude?: number | null
          phone?: string | null
          rating?: number | null
          rejection_reason?: string | null
          service_radius_km?: number
          state?: string | null
          status?: Database["public"]["Enums"]["despatcher_status"]
          updated_at?: string
          user_id: string
          vehicle_plate?: string | null
          vehicle_type?: string
        }
        Update: {
          active_deliveries?: number
          address?: string | null
          availability?: Database["public"]["Enums"]["despatcher_availability"]
          business_name?: string | null
          city?: string | null
          completed_deliveries?: number
          country?: string
          created_at?: string
          current_latitude?: number | null
          current_longitude?: number | null
          email?: string | null
          full_name?: string
          id?: string
          id_document_url?: string | null
          latitude?: number | null
          location_updated_at?: string | null
          longitude?: number | null
          phone?: string | null
          rating?: number | null
          rejection_reason?: string | null
          service_radius_km?: number
          state?: string | null
          status?: Database["public"]["Enums"]["despatcher_status"]
          updated_at?: string
          user_id?: string
          vehicle_plate?: string | null
          vehicle_type?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          product_id: string | null
          user_id: string
          vendor_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          product_id?: string | null
          user_id: string
          vendor_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string | null
          user_id?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          change: number
          created_at: string
          id: string
          product_id: string
          reason: string | null
          resulting_quantity: number | null
          vendor_id: string
        }
        Insert: {
          change: number
          created_at?: string
          id?: string
          product_id: string
          reason?: string | null
          resulting_quantity?: number | null
          vendor_id: string
        }
        Update: {
          change?: number
          created_at?: string
          id?: string
          product_id?: string
          reason?: string | null
          resulting_quantity?: number | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_entries: {
        Row: {
          amount: number
          created_at: string
          currency: string
          customer_id: string | null
          delivery_id: string | null
          description: string | null
          despatcher_id: string | null
          entry_type: string
          gateway: string | null
          gateway_reference: string | null
          id: string
          metadata: Json
          order_id: string | null
          payment_id: string | null
          payout_id: string | null
          settlement_id: string | null
          vendor_id: string | null
          vendor_order_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          customer_id?: string | null
          delivery_id?: string | null
          description?: string | null
          despatcher_id?: string | null
          entry_type: string
          gateway?: string | null
          gateway_reference?: string | null
          id?: string
          metadata?: Json
          order_id?: string | null
          payment_id?: string | null
          payout_id?: string | null
          settlement_id?: string | null
          vendor_id?: string | null
          vendor_order_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          customer_id?: string | null
          delivery_id?: string | null
          description?: string | null
          despatcher_id?: string | null
          entry_type?: string
          gateway?: string | null
          gateway_reference?: string | null
          id?: string
          metadata?: Json
          order_id?: string | null
          payment_id?: string | null
          payout_id?: string | null
          settlement_id?: string | null
          vendor_id?: string | null
          vendor_order_id?: string | null
        }
        Relationships: []
      }
      marketplace_branding: {
        Row: {
          facebook_url: string | null
          favicon_url: string | null
          id: boolean
          instagram_url: string | null
          logo_url: string | null
          primary_color: string | null
          twitter_url: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          facebook_url?: string | null
          favicon_url?: string | null
          id?: boolean
          instagram_url?: string | null
          logo_url?: string | null
          primary_color?: string | null
          twitter_url?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          facebook_url?: string | null
          favicon_url?: string | null
          id?: boolean
          instagram_url?: string | null
          logo_url?: string | null
          primary_color?: string | null
          twitter_url?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      marketplace_settings: {
        Row: {
          announcement: string | null
          auto_approve_products: boolean
          auto_approve_vendors: boolean
          auto_assign_deliveries: boolean
          bank_account_name: string
          bank_account_number: string
          bank_name: string
          bank_transfer_enabled: boolean
          commission_percent: number
          contact_address: string | null
          corporate_website_url: string | null
          default_city: string | null
          default_country: string | null
          default_currency: string
          default_gateway: string
          default_radius_km: number
          default_state: string | null
          delivery_base_fee: number
          delivery_fee_model: string
          delivery_fee_per_km: number
          description: string | null
          despatcher_share_percent: number
          dispatch_mode: string
          gateway_fee_bearer: string
          gateway_fee_cap: number
          gateway_flat: number
          gateway_percent: number
          id: boolean
          marketplace_active: boolean
          max_radius_km: number
          name: string
          require_vendor_subscription: boolean
          settlement_window_minutes: number
          support_email: string | null
          support_phone: string | null
          tagline: string | null
          updated_at: string
          whatsapp_numbers: string | null
        }
        Insert: {
          announcement?: string | null
          auto_approve_products?: boolean
          auto_approve_vendors?: boolean
          auto_assign_deliveries?: boolean
          bank_account_name?: string
          bank_account_number?: string
          bank_name?: string
          bank_transfer_enabled?: boolean
          commission_percent?: number
          contact_address?: string | null
          corporate_website_url?: string | null
          default_city?: string | null
          default_country?: string | null
          default_currency?: string
          default_gateway?: string
          default_radius_km?: number
          default_state?: string | null
          delivery_base_fee?: number
          delivery_fee_model?: string
          delivery_fee_per_km?: number
          description?: string | null
          despatcher_share_percent?: number
          dispatch_mode?: string
          gateway_fee_bearer?: string
          gateway_fee_cap?: number
          gateway_flat?: number
          gateway_percent?: number
          id?: boolean
          marketplace_active?: boolean
          max_radius_km?: number
          name?: string
          require_vendor_subscription?: boolean
          settlement_window_minutes?: number
          support_email?: string | null
          support_phone?: string | null
          tagline?: string | null
          updated_at?: string
          whatsapp_numbers?: string | null
        }
        Update: {
          announcement?: string | null
          auto_approve_products?: boolean
          auto_approve_vendors?: boolean
          auto_assign_deliveries?: boolean
          bank_account_name?: string
          bank_account_number?: string
          bank_name?: string
          bank_transfer_enabled?: boolean
          commission_percent?: number
          contact_address?: string | null
          corporate_website_url?: string | null
          default_city?: string | null
          default_country?: string | null
          default_currency?: string
          default_gateway?: string
          default_radius_km?: number
          default_state?: string | null
          delivery_base_fee?: number
          delivery_fee_model?: string
          delivery_fee_per_km?: number
          description?: string | null
          despatcher_share_percent?: number
          dispatch_mode?: string
          gateway_fee_bearer?: string
          gateway_fee_cap?: number
          gateway_flat?: number
          gateway_percent?: number
          id?: boolean
          marketplace_active?: boolean
          max_radius_km?: number
          name?: string
          require_vendor_subscription?: boolean
          settlement_window_minutes?: number
          support_email?: string | null
          support_phone?: string | null
          tagline?: string | null
          updated_at?: string
          whatsapp_numbers?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          read_at?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          line_total: number
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          unit_price: number
          vendor_id: string
          vendor_order_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          line_total: number
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          unit_price: number
          vendor_id: string
          vendor_order_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          line_total?: number
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          unit_price?: number
          vendor_id?: string
          vendor_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_vendor_order_id_fkey"
            columns: ["vendor_order_id"]
            isOneToOne: false
            referencedRelation: "vendor_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          contact_phone: string | null
          created_at: string
          currency: string
          customer_id: string
          delivery_address: string | null
          delivery_city: string | null
          delivery_latitude: number | null
          delivery_longitude: number | null
          delivery_state: string | null
          delivery_total: number
          id: string
          notes: string | null
          reference: string
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          updated_at: string
        }
        Insert: {
          contact_phone?: string | null
          created_at?: string
          currency?: string
          customer_id: string
          delivery_address?: string | null
          delivery_city?: string | null
          delivery_latitude?: number | null
          delivery_longitude?: number | null
          delivery_state?: string | null
          delivery_total?: number
          id?: string
          notes?: string | null
          reference?: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Update: {
          contact_phone?: string | null
          created_at?: string
          currency?: string
          customer_id?: string
          delivery_address?: string | null
          delivery_city?: string | null
          delivery_latitude?: number | null
          delivery_longitude?: number | null
          delivery_state?: string | null
          delivery_total?: number
          id?: string
          notes?: string | null
          reference?: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      payment_events: {
        Row: {
          created_at: string
          event_key: string
          gateway: string
          id: string
          payload: Json
          payment_id: string | null
          processed_at: string | null
        }
        Insert: {
          created_at?: string
          event_key: string
          gateway: string
          id?: string
          payload?: Json
          payment_id?: string | null
          processed_at?: string | null
        }
        Update: {
          created_at?: string
          event_key?: string
          gateway?: string
          id?: string
          payload?: Json
          payment_id?: string | null
          processed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_events_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          checkout_url: string | null
          created_at: string
          currency: string
          customer_id: string | null
          declared_at: string | null
          failure_reason: string | null
          gateway: string
          gateway_fee: number
          gateway_reference: string | null
          id: string
          metadata: Json
          order_id: string | null
          payer_bank: string | null
          payer_name: string | null
          purpose: string
          reference: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["payment_status"]
          transfer_note: string | null
          updated_at: string
          vendor_subscription_id: string | null
          verified_at: string | null
        }
        Insert: {
          amount?: number
          checkout_url?: string | null
          created_at?: string
          currency?: string
          customer_id?: string | null
          declared_at?: string | null
          failure_reason?: string | null
          gateway?: string
          gateway_fee?: number
          gateway_reference?: string | null
          id?: string
          metadata?: Json
          order_id?: string | null
          payer_bank?: string | null
          payer_name?: string | null
          purpose?: string
          reference: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          transfer_note?: string | null
          updated_at?: string
          vendor_subscription_id?: string | null
          verified_at?: string | null
        }
        Update: {
          amount?: number
          checkout_url?: string | null
          created_at?: string
          currency?: string
          customer_id?: string | null
          declared_at?: string | null
          failure_reason?: string | null
          gateway?: string
          gateway_fee?: number
          gateway_reference?: string | null
          id?: string
          metadata?: Json
          order_id?: string | null
          payer_bank?: string | null
          payer_name?: string | null
          purpose?: string
          reference?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          transfer_note?: string | null
          updated_at?: string
          vendor_subscription_id?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_vendor_subscription_id_fkey"
            columns: ["vendor_subscription_id"]
            isOneToOne: false
            referencedRelation: "vendor_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          amount: number
          attempts: number
          created_at: string
          currency: string
          despatcher_id: string | null
          failure_reason: string | null
          id: string
          party_type: Database["public"]["Enums"]["payout_party"]
          processed_at: string | null
          provider: string | null
          provider_reference: string | null
          settlement_id: string
          status: Database["public"]["Enums"]["payout_status"]
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          amount?: number
          attempts?: number
          created_at?: string
          currency?: string
          despatcher_id?: string | null
          failure_reason?: string | null
          id?: string
          party_type: Database["public"]["Enums"]["payout_party"]
          processed_at?: string | null
          provider?: string | null
          provider_reference?: string | null
          settlement_id: string
          status?: Database["public"]["Enums"]["payout_status"]
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          amount?: number
          attempts?: number
          created_at?: string
          currency?: string
          despatcher_id?: string | null
          failure_reason?: string | null
          id?: string
          party_type?: Database["public"]["Enums"]["payout_party"]
          processed_at?: string | null
          provider?: string | null
          provider_reference?: string | null
          settlement_id?: string
          status?: Database["public"]["Enums"]["payout_status"]
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payouts_despatcher_id_fkey"
            columns: ["despatcher_id"]
            isOneToOne: false
            referencedRelation: "despatchers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_settlement_id_fkey"
            columns: ["settlement_id"]
            isOneToOne: false
            referencedRelation: "settlements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      product_approval_requests: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          product_id: string
          reviewed_at: string | null
          reviewer_id: string | null
          status: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          product_id: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          product_id?: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_approval_requests_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_approval_requests_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          created_at: string
          id: string
          product_id: string
          sort_order: number
          url: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          sort_order?: number
          url: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          sort_order?: number
          url?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          city: string | null
          created_at: string
          currency: string
          description: string | null
          discount_price: number | null
          id: string
          image_url: string | null
          is_available: boolean
          is_demo: boolean
          is_featured: boolean
          latitude: number | null
          longitude: number | null
          min_order_quantity: number
          name: string
          price: number
          rejection_reason: string | null
          short_description: string | null
          sku: string | null
          slug: string | null
          state: string | null
          status: Database["public"]["Enums"]["product_status"]
          stock_quantity: number
          subcategory_id: string | null
          updated_at: string
          vendor_id: string
        }
        Insert: {
          category_id?: string | null
          city?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          discount_price?: number | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          is_demo?: boolean
          is_featured?: boolean
          latitude?: number | null
          longitude?: number | null
          min_order_quantity?: number
          name: string
          price?: number
          rejection_reason?: string | null
          short_description?: string | null
          sku?: string | null
          slug?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["product_status"]
          stock_quantity?: number
          subcategory_id?: string | null
          updated_at?: string
          vendor_id: string
        }
        Update: {
          category_id?: string | null
          city?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          discount_price?: number | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          is_demo?: boolean
          is_featured?: boolean
          latitude?: number | null
          longitude?: number | null
          min_order_quantity?: number
          name?: string
          price?: number
          rejection_reason?: string | null
          short_description?: string | null
          sku?: string | null
          slug?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["product_status"]
          stock_quantity?: number
          subcategory_id?: string | null
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_demo: boolean
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_demo?: boolean
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_demo?: boolean
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      settlements: {
        Row: {
          adjustment_amount: number
          approved_at: string | null
          approved_by: string | null
          created_at: string
          currency: string
          customer_id: string
          delivered_at: string | null
          delivery_amount: number
          delivery_id: string | null
          despatcher_allocation: number
          despatcher_id: string | null
          gateway_fee: number
          gross_amount: number
          hold_reason: string | null
          id: string
          locked: boolean
          order_id: string
          payment_id: string | null
          platform_allocation: number
          platform_commission: number
          platform_delivery_margin: number
          product_amount: number
          ready_at: string | null
          refund_amount: number
          status: Database["public"]["Enums"]["settlement_status"]
          updated_at: string
          vendor_allocation: number
          vendor_id: string
          vendor_order_id: string
        }
        Insert: {
          adjustment_amount?: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          currency?: string
          customer_id: string
          delivered_at?: string | null
          delivery_amount?: number
          delivery_id?: string | null
          despatcher_allocation?: number
          despatcher_id?: string | null
          gateway_fee?: number
          gross_amount?: number
          hold_reason?: string | null
          id?: string
          locked?: boolean
          order_id: string
          payment_id?: string | null
          platform_allocation?: number
          platform_commission?: number
          platform_delivery_margin?: number
          product_amount?: number
          ready_at?: string | null
          refund_amount?: number
          status?: Database["public"]["Enums"]["settlement_status"]
          updated_at?: string
          vendor_allocation?: number
          vendor_id: string
          vendor_order_id: string
        }
        Update: {
          adjustment_amount?: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          currency?: string
          customer_id?: string
          delivered_at?: string | null
          delivery_amount?: number
          delivery_id?: string | null
          despatcher_allocation?: number
          despatcher_id?: string | null
          gateway_fee?: number
          gross_amount?: number
          hold_reason?: string | null
          id?: string
          locked?: boolean
          order_id?: string
          payment_id?: string | null
          platform_allocation?: number
          platform_commission?: number
          platform_delivery_margin?: number
          product_amount?: number
          ready_at?: string | null
          refund_amount?: number
          status?: Database["public"]["Enums"]["settlement_status"]
          updated_at?: string
          vendor_allocation?: number
          vendor_id?: string
          vendor_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "settlements_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlements_despatcher_id_fkey"
            columns: ["despatcher_id"]
            isOneToOne: false
            referencedRelation: "despatchers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlements_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlements_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlements_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlements_vendor_order_id_fkey"
            columns: ["vendor_order_id"]
            isOneToOne: true
            referencedRelation: "vendor_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_packages: {
        Row: {
          created_at: string
          currency: string
          duration_days: number
          features: Json
          id: string
          is_active: boolean
          name: string
          price: number
          product_limit: number
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          currency?: string
          duration_days?: number
          features?: Json
          id?: string
          is_active?: boolean
          name: string
          price?: number
          product_limit?: number
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          currency?: string
          duration_days?: number
          features?: Json
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          product_limit?: number
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendor_locations: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          id: string
          is_primary: boolean
          label: string
          latitude: number | null
          longitude: number | null
          state: string | null
          vendor_id: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          label?: string
          latitude?: number | null
          longitude?: number | null
          state?: string | null
          vendor_id: string
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          label?: string
          latitude?: number | null
          longitude?: number | null
          state?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_locations_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_orders: {
        Row: {
          created_at: string
          customer_id: string
          delivery_fee: number
          id: string
          order_id: string
          status: Database["public"]["Enums"]["vendor_order_status"]
          subtotal: number
          total: number
          updated_at: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          delivery_fee?: number
          id?: string
          order_id: string
          status?: Database["public"]["Enums"]["vendor_order_status"]
          subtotal?: number
          total?: number
          updated_at?: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          delivery_fee?: number
          id?: string
          order_id?: string
          status?: Database["public"]["Enums"]["vendor_order_status"]
          subtotal?: number
          total?: number
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_settings: {
        Row: {
          accepts_delivery: boolean
          auto_accept_orders: boolean
          currency: string
          delivery_fee: number
          delivery_radius_km: number
          min_order_amount: number
          updated_at: string
          vendor_id: string
        }
        Insert: {
          accepts_delivery?: boolean
          auto_accept_orders?: boolean
          currency?: string
          delivery_fee?: number
          delivery_radius_km?: number
          min_order_amount?: number
          updated_at?: string
          vendor_id: string
        }
        Update: {
          accepts_delivery?: boolean
          auto_accept_orders?: boolean
          currency?: string
          delivery_fee?: number
          delivery_radius_km?: number
          min_order_amount?: number
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_settings_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: true
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_subscriptions: {
        Row: {
          amount: number
          created_at: string
          expires_at: string | null
          id: string
          package_id: string
          payment_reference: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          product_limit: number
          starts_at: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          vendor_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          package_id: string
          payment_reference?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          product_limit?: number
          starts_at?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          vendor_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          package_id?: string
          payment_reference?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          product_limit?: number
          starts_at?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_subscriptions_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "subscription_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_subscriptions_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_users: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          user_id: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_users_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          address: string | null
          business_category: string | null
          city: string | null
          country: string | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          is_demo: boolean
          is_featured: boolean
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          name: string
          owner_id: string
          owner_name: string | null
          phone: string | null
          rating: number | null
          registration_number: string | null
          rejection_reason: string | null
          slug: string
          state: string | null
          status: Database["public"]["Enums"]["vendor_status"]
          storefront_image_url: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          business_category?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          is_demo?: boolean
          is_featured?: boolean
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          owner_id: string
          owner_name?: string | null
          phone?: string | null
          rating?: number | null
          registration_number?: string | null
          rejection_reason?: string | null
          slug: string
          state?: string | null
          status?: Database["public"]["Enums"]["vendor_status"]
          storefront_image_url?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          business_category?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          is_demo?: boolean
          is_featured?: boolean
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          owner_id?: string
          owner_name?: string | null
          phone?: string | null
          rating?: number | null
          registration_number?: string | null
          rejection_reason?: string | null
          slug?: string
          state?: string | null
          status?: Database["public"]["Enums"]["vendor_status"]
          storefront_image_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_delivery: { Args: { _delivery_id: string }; Returns: undefined }
      admin_review_payment: {
        Args: { _approve: boolean; _payment_id: string; _reason: string }
        Returns: undefined
      }
      admin_update_despatcher_status: {
        Args: {
          p_despatcher_id: string
          p_status: Database["public"]["Enums"]["despatcher_status"]
        }
        Returns: undefined
      }
      approve_settlement: {
        Args: { _settlement_id: string }
        Returns: undefined
      }
      assign_delivery: {
        Args: { _delivery_id: string; _despatcher_id: string }
        Returns: undefined
      }
      bootstrap_current_user: {
        Args: { _full_name?: string; _phone?: string }
        Returns: undefined
      }
      calc_gateway_fee: { Args: { _amount: number }; Returns: number }
      cancel_delivery: {
        Args: { _delivery_id: string; _reason?: string }
        Returns: undefined
      }
      checkout: { Args: { _address: Json }; Returns: string }
      claim_delivery: { Args: { _delivery_id: string }; Returns: undefined }
      confirm_payment: {
        Args: {
          _gateway_fee?: number
          _gateway_reference: string
          _paid_amount: number
          _payload?: Json
          _reference: string
        }
        Returns: string
      }
      create_settlement_for_delivery: {
        Args: { _delivery_id: string }
        Returns: string
      }
      declare_bank_transfer: {
        Args: {
          _note: string
          _payer_bank: string
          _payer_name: string
          _reference: string
        }
        Returns: undefined
      }
      delivery_next_states: {
        Args: { _status: Database["public"]["Enums"]["delivery_status"] }
        Returns: Database["public"]["Enums"]["delivery_status"][]
      }
      distance_km: {
        Args: { lat1: number; lat2: number; lng1: number; lng2: number }
        Returns: number
      }
      fail_payment: {
        Args: { _reason: string; _reference: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hold_settlement: {
        Args: { _reason: string; _settlement_id: string }
        Returns: undefined
      }
      initiate_order_payment: {
        Args: { _gateway?: string; _order_id: string }
        Returns: {
          amount: number
          checkout_url: string | null
          created_at: string
          currency: string
          customer_id: string | null
          declared_at: string | null
          failure_reason: string | null
          gateway: string
          gateway_fee: number
          gateway_reference: string | null
          id: string
          metadata: Json
          order_id: string | null
          payer_bank: string | null
          payer_name: string | null
          purpose: string
          reference: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["payment_status"]
          transfer_note: string | null
          updated_at: string
          vendor_subscription_id: string | null
          verified_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "payments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      is_admin: { Args: never; Returns: boolean }
      is_vendor_member: { Args: { _vendor_id: string }; Returns: boolean }
      log_audit: {
        Args: {
          _action: string
          _entity_id: string
          _entity_type: string
          _metadata?: Json
        }
        Returns: undefined
      }
      mature_settlements: { Args: never; Returns: number }
      my_despatcher_id: { Args: never; Returns: string }
      nearby_products: {
        Args: {
          _category?: string
          _lat: number
          _limit?: number
          _lng: number
          _offset?: number
          _q?: string
          _radius?: number
          _sort?: string
        }
        Returns: {
          category_id: string
          city: string
          created_at: string
          currency: string
          discount_price: number
          distance_km: number
          id: string
          image_url: string
          is_featured: boolean
          latitude: number
          longitude: number
          name: string
          price: number
          state: string
          stock_quantity: number
          vendor_city: string
          vendor_id: string
          vendor_name: string
          vendor_slug: string
          vendor_state: string
        }[]
      }
      nearby_vendors: {
        Args: {
          _lat: number
          _limit?: number
          _lng: number
          _q?: string
          _radius?: number
        }
        Returns: {
          business_category: string
          city: string
          description: string
          distance_km: number
          id: string
          is_featured: boolean
          latitude: number
          logo_url: string
          longitude: number
          name: string
          rating: number
          slug: string
          state: string
          storefront_image_url: string
        }[]
      }
      notify_admins: {
        Args: {
          _body: string
          _entity_id: string
          _entity_type: string
          _title: string
          _type: string
        }
        Returns: undefined
      }
      notify_user: {
        Args: {
          _body: string
          _entity_id?: string
          _entity_type?: string
          _title: string
          _type?: string
          _user_id: string
        }
        Returns: undefined
      }
      owns_cart: { Args: { _cart_id: string }; Returns: boolean }
      pick_despatcher: { Args: { _lat: number; _lng: number }; Returns: string }
      register_despatcher: { Args: { _payload: Json }; Returns: string }
      register_vendor: { Args: { _payload: Json }; Returns: string }
      reject_delivery: {
        Args: { _delivery_id: string; _reason?: string }
        Returns: undefined
      }
      reject_settlement: {
        Args: { _reason: string; _settlement_id: string }
        Returns: undefined
      }
      release_settlement: {
        Args: { _settlement_id: string }
        Returns: undefined
      }
      request_delivery: { Args: { _vendor_order_id: string }; Returns: string }
      review_despatcher: {
        Args: {
          _despatcher_id: string
          _reason?: string
          _status: Database["public"]["Enums"]["despatcher_status"]
        }
        Returns: undefined
      }
      review_product: {
        Args: {
          _product_id: string
          _reason?: string
          _status: Database["public"]["Enums"]["product_status"]
        }
        Returns: undefined
      }
      review_vendor: {
        Args: {
          _reason?: string
          _status: Database["public"]["Enums"]["vendor_status"]
          _vendor_id: string
        }
        Returns: undefined
      }
      set_despatcher_availability: {
        Args: {
          _availability: Database["public"]["Enums"]["despatcher_availability"]
        }
        Returns: undefined
      }
      submit_product: { Args: { _product_id: string }; Returns: undefined }
      subscribe_vendor: {
        Args: { _package_id: string }
        Returns: {
          amount: number
          checkout_url: string | null
          created_at: string
          currency: string
          customer_id: string | null
          declared_at: string | null
          failure_reason: string | null
          gateway: string
          gateway_fee: number
          gateway_reference: string | null
          id: string
          metadata: Json
          order_id: string | null
          payer_bank: string | null
          payer_name: string | null
          purpose: string
          reference: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["payment_status"]
          transfer_note: string | null
          updated_at: string
          vendor_subscription_id: string | null
          verified_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "payments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_delivery_status: {
        Args: {
          _delivery_id: string
          _note?: string
          _status: Database["public"]["Enums"]["delivery_status"]
        }
        Returns: undefined
      }
      update_despatcher_location: {
        Args: { _lat: number; _lng: number }
        Returns: undefined
      }
      update_payout_status: {
        Args: {
          _payout_id: string
          _reason?: string
          _reference?: string
          _status: Database["public"]["Enums"]["payout_status"]
        }
        Returns: undefined
      }
      vendor_product_limit: { Args: { _vendor_id: string }; Returns: number }
      vendor_serviceability: {
        Args: { _lat: number; _lng: number; _vendor_ids: string[] }
        Returns: {
          accepts_delivery: boolean
          distance_km: number
          has_location: boolean
          radius_km: number
          serviceable: boolean
          vendor_id: string
          vendor_name: string
        }[]
      }
    }
    Enums: {
      app_role: "super_admin" | "vendor" | "customer" | "despatcher"
      delivery_status:
        | "pending"
        | "requested"
        | "assigned"
        | "en_route"
        | "picked_up"
        | "in_transit"
        | "delivered"
        | "failed"
        | "cancelled"
        | "awaiting_assignment"
        | "accepted"
        | "heading_to_pickup"
        | "arrived_at_pickup"
        | "near_destination"
        | "arrived_at_destination"
      despatcher_availability:
        | "offline"
        | "online"
        | "assigned"
        | "on_delivery"
        | "busy"
      despatcher_status: "pending" | "approved" | "rejected" | "suspended"
      order_status: "pending" | "processing" | "completed" | "cancelled"
      payment_status:
        | "initiated"
        | "pending"
        | "successful"
        | "failed"
        | "abandoned"
        | "partially_refunded"
        | "fully_refunded"
        | "reversed"
      payout_party: "vendor" | "despatcher" | "platform"
      payout_status:
        | "pending"
        | "processing"
        | "successful"
        | "failed"
        | "retry_required"
        | "cancelled"
      product_status:
        | "draft"
        | "pending_approval"
        | "approved"
        | "rejected"
        | "suspended"
        | "out_of_stock"
      settlement_status:
        | "pending"
        | "window"
        | "ready_for_approval"
        | "approved"
        | "processing"
        | "paid"
        | "held"
        | "rejected"
        | "failed"
      subscription_status:
        | "pending"
        | "active"
        | "expired"
        | "cancelled"
        | "suspended"
      vendor_order_status:
        | "new"
        | "accepted"
        | "processing"
        | "ready_for_dispatch"
        | "dispatched"
        | "completed"
        | "cancelled"
      vendor_status: "pending" | "approved" | "rejected" | "suspended"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["super_admin", "vendor", "customer", "despatcher"],
      delivery_status: [
        "pending",
        "requested",
        "assigned",
        "en_route",
        "picked_up",
        "in_transit",
        "delivered",
        "failed",
        "cancelled",
        "awaiting_assignment",
        "accepted",
        "heading_to_pickup",
        "arrived_at_pickup",
        "near_destination",
        "arrived_at_destination",
      ],
      despatcher_availability: [
        "offline",
        "online",
        "assigned",
        "on_delivery",
        "busy",
      ],
      despatcher_status: ["pending", "approved", "rejected", "suspended"],
      order_status: ["pending", "processing", "completed", "cancelled"],
      payment_status: [
        "initiated",
        "pending",
        "successful",
        "failed",
        "abandoned",
        "partially_refunded",
        "fully_refunded",
        "reversed",
      ],
      payout_party: ["vendor", "despatcher", "platform"],
      payout_status: [
        "pending",
        "processing",
        "successful",
        "failed",
        "retry_required",
        "cancelled",
      ],
      product_status: [
        "draft",
        "pending_approval",
        "approved",
        "rejected",
        "suspended",
        "out_of_stock",
      ],
      settlement_status: [
        "pending",
        "window",
        "ready_for_approval",
        "approved",
        "processing",
        "paid",
        "held",
        "rejected",
        "failed",
      ],
      subscription_status: [
        "pending",
        "active",
        "expired",
        "cancelled",
        "suspended",
      ],
      vendor_order_status: [
        "new",
        "accepted",
        "processing",
        "ready_for_dispatch",
        "dispatched",
        "completed",
        "cancelled",
      ],
      vendor_status: ["pending", "approved", "rejected", "suspended"],
    },
  },
} as const
