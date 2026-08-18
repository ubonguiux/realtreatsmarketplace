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
    PostgrestVersion: "14.15"
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
          default_city: string | null
          default_country: string | null
          default_currency: string
          default_radius_km: number
          default_state: string | null
          delivery_base_fee: number
          delivery_fee_model: string
          delivery_fee_per_km: number
          description: string | null
          dispatch_mode: string
          id: boolean
          marketplace_active: boolean
          max_radius_km: number
          name: string
          support_email: string | null
          support_phone: string | null
          tagline: string | null
          updated_at: string
        }
        Insert: {
          announcement?: string | null
          auto_approve_products?: boolean
          auto_approve_vendors?: boolean
          auto_assign_deliveries?: boolean
          default_city?: string | null
          default_country?: string | null
          default_currency?: string
          default_radius_km?: number
          default_state?: string | null
          delivery_base_fee?: number
          delivery_fee_model?: string
          delivery_fee_per_km?: number
          description?: string | null
          dispatch_mode?: string
          id?: boolean
          marketplace_active?: boolean
          max_radius_km?: number
          name?: string
          support_email?: string | null
          support_phone?: string | null
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          announcement?: string | null
          auto_approve_products?: boolean
          auto_approve_vendors?: boolean
          auto_assign_deliveries?: boolean
          default_city?: string | null
          default_country?: string | null
          default_currency?: string
          default_radius_km?: number
          default_state?: string | null
          delivery_base_fee?: number
          delivery_fee_model?: string
          delivery_fee_per_km?: number
          description?: string | null
          dispatch_mode?: string
          id?: boolean
          marketplace_active?: boolean
          max_radius_km?: number
          name?: string
          support_email?: string | null
          support_phone?: string | null
          tagline?: string | null
          updated_at?: string
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
      bootstrap_current_user: {
        Args: { _full_name?: string; _phone?: string }
        Returns: undefined
      }
      checkout: { Args: { _address: Json }; Returns: string }
      distance_km: {
        Args: { lat1: number; lat2: number; lng1: number; lng2: number }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
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
      register_vendor: { Args: { _payload: Json }; Returns: string }
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
      submit_product: { Args: { _product_id: string }; Returns: undefined }
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
      product_status:
        | "draft"
        | "pending_approval"
        | "approved"
        | "rejected"
        | "suspended"
        | "out_of_stock"
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
      product_status: [
        "draft",
        "pending_approval",
        "approved",
        "rejected",
        "suspended",
        "out_of_stock",
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
