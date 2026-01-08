export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      conversations: {
        Row: {
          created_at: string | null
          id: string
          participant_one_id: string
          participant_two_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          participant_one_id: string
          participant_two_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          participant_one_id?: string
          participant_two_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_participant_one_id_fkey"
            columns: ["participant_one_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_participant_two_id_fkey"
            columns: ["participant_two_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          conversation_id: string | null
          created_at: string | null
          id: string
          request_id: string | null
          sender_id: string
        }
        Insert: {
          body: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          request_id?: string | null
          sender_id: string
        }
        Update: {
          body?: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          request_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          request_id: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          request_id: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          request_id?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          certifications: string[] | null
          city: string | null
          created_at: string | null
          full_name: string | null
          id: string
          lat: number | null
          lng: number | null
          phone: string | null
          player_levels_served: string[] | null
          profile_complete: boolean | null
          profile_completion_percentage: number | null
          rackets_strung_count: number | null
          role: Database["public"]["Enums"]["user_role"] | null
          stringing_location: string | null
          updated_at: string | null
          years_experience: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          certifications?: string[] | null
          city?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          lat?: number | null
          lng?: number | null
          phone?: string | null
          player_levels_served?: string[] | null
          profile_complete?: boolean | null
          profile_completion_percentage?: number | null
          rackets_strung_count?: number | null
          role?: Database["public"]["Enums"]["user_role"] | null
          stringing_location?: string | null
          updated_at?: string | null
          years_experience?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          certifications?: string[] | null
          city?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          phone?: string | null
          player_levels_served?: string[] | null
          profile_complete?: boolean | null
          profile_completion_percentage?: number | null
          rackets_strung_count?: number | null
          role?: Database["public"]["Enums"]["user_role"] | null
          stringing_location?: string | null
          updated_at?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
      racket_gallery: {
        Row: {
          caption: string | null
          created_at: string | null
          display_order: number | null
          id: string
          image_url: string
          racquet_brand: string | null
          racquet_model: string | null
          string_used: string | null
          stringer_id: string
          tension_lbs: number | null
          updated_at: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url: string
          racquet_brand?: string | null
          racquet_model?: string | null
          string_used?: string | null
          stringer_id: string
          tension_lbs?: number | null
          updated_at?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string
          racquet_brand?: string | null
          racquet_model?: string | null
          string_used?: string | null
          stringer_id?: string
          tension_lbs?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "racket_gallery_stringer_id_fkey"
            columns: ["stringer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      request_state_changes: {
        Row: {
          changed_at: string | null
          changed_by: string
          from_status: string
          id: string
          metadata: Json | null
          reason: string | null
          request_id: string
          to_status: string
        }
        Insert: {
          changed_at?: string | null
          changed_by: string
          from_status: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          request_id: string
          to_status: string
        }
        Update: {
          changed_at?: string | null
          changed_by?: string
          from_status?: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          request_id?: string
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_state_changes_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_state_changes_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      requests: {
        Row: {
          accepted_at: string | null
          actual_completion: string | null
          actual_string_installed: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          completed_at: string | null
          completion_notes: string | null
          completion_photo_url: string | null
          confirmed_string_brand: string | null
          confirmed_string_model: string | null
          confirmed_tension_crosses_lbs: number | null
          confirmed_tension_mains_lbs: number | null
          created_at: string | null
          decline_reason: string | null
          declined_at: string | null
          delay_reason: string | null
          dropoff_method: Json
          estimated_completion: string | null
          estimated_price_cents: number
          final_price_cents: number | null
          id: string
          is_paused: boolean | null
          is_rush: boolean | null
          pause_reason: string | null
          paused_at: string | null
          payment_authorized_at: string | null
          payment_captured_at: string | null
          payment_intent_id: string | null
          platform_fee_cents: number | null
          player_id: string
          preferred_completion_date: string | null
          preferred_time_slot: Json | null
          racket_count: number | null
          racket_photo_url: string
          ready_at: string | null
          resumed_at: string | null
          rework_count: number | null
          scheduled_at: string | null
          service_type: string
          special_instructions: string | null
          status: string
          string_issue_notes: string | null
          string_pattern: string
          string_selection: Json
          stringer_earnings_cents: number | null
          stringer_id: string
          tension_crosses_lbs: number
          tension_mains_lbs: number
          tip_cents: number | null
          updated_at: string | null
          viewed_at: string | null
          work_started_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          actual_completion?: string | null
          actual_string_installed?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          completed_at?: string | null
          completion_notes?: string | null
          completion_photo_url?: string | null
          confirmed_string_brand?: string | null
          confirmed_string_model?: string | null
          confirmed_tension_crosses_lbs?: number | null
          confirmed_tension_mains_lbs?: number | null
          created_at?: string | null
          decline_reason?: string | null
          declined_at?: string | null
          delay_reason?: string | null
          dropoff_method: Json
          estimated_completion?: string | null
          estimated_price_cents: number
          final_price_cents?: number | null
          id?: string
          is_paused?: boolean | null
          is_rush?: boolean | null
          pause_reason?: string | null
          paused_at?: string | null
          payment_authorized_at?: string | null
          payment_captured_at?: string | null
          payment_intent_id?: string | null
          platform_fee_cents?: number | null
          player_id: string
          preferred_completion_date?: string | null
          preferred_time_slot?: Json | null
          racket_count?: number | null
          racket_photo_url: string
          ready_at?: string | null
          resumed_at?: string | null
          rework_count?: number | null
          scheduled_at?: string | null
          service_type: string
          special_instructions?: string | null
          status?: string
          string_issue_notes?: string | null
          string_pattern: string
          string_selection: Json
          stringer_earnings_cents?: number | null
          stringer_id: string
          tension_crosses_lbs: number
          tension_mains_lbs: number
          tip_cents?: number | null
          updated_at?: string | null
          viewed_at?: string | null
          work_started_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          actual_completion?: string | null
          actual_string_installed?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          completed_at?: string | null
          completion_notes?: string | null
          completion_photo_url?: string | null
          confirmed_string_brand?: string | null
          confirmed_string_model?: string | null
          confirmed_tension_crosses_lbs?: number | null
          confirmed_tension_mains_lbs?: number | null
          created_at?: string | null
          decline_reason?: string | null
          declined_at?: string | null
          delay_reason?: string | null
          dropoff_method?: Json
          estimated_completion?: string | null
          estimated_price_cents?: number
          final_price_cents?: number | null
          id?: string
          is_paused?: boolean | null
          is_rush?: boolean | null
          pause_reason?: string | null
          paused_at?: string | null
          payment_authorized_at?: string | null
          payment_captured_at?: string | null
          payment_intent_id?: string | null
          platform_fee_cents?: number | null
          player_id?: string
          preferred_completion_date?: string | null
          preferred_time_slot?: Json | null
          racket_count?: number | null
          racket_photo_url?: string
          ready_at?: string | null
          resumed_at?: string | null
          rework_count?: number | null
          scheduled_at?: string | null
          service_type?: string
          special_instructions?: string | null
          status?: string
          string_issue_notes?: string | null
          string_pattern?: string
          string_selection?: Json
          stringer_earnings_cents?: number | null
          stringer_id?: string
          tension_crosses_lbs?: number
          tension_mains_lbs?: number
          tip_cents?: number | null
          updated_at?: string | null
          viewed_at?: string | null
          work_started_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "requests_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          request_id: string
          review_type: string
          reviewee_id: string
          reviewer_id: string
          updated_at: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          request_id: string
          review_type: string
          reviewee_id: string
          reviewer_id: string
          updated_at?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          request_id?: string
          review_type?: string
          reviewee_id?: string
          reviewer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      stringer_settings: {
        Row: {
          accepting_requests: boolean | null
          accepts_player_strings: boolean | null
          accepts_rush: boolean
          admin_notes: string | null
          availability: Json | null
          base_price_cents: number
          created_at: string | null
          discount_bulk_jobs: number | null
          dropoff_methods: Json | null
          flexible_availability: boolean | null
          id: string
          is_verified: boolean | null
          machine_brand: string | null
          machine_model: string | null
          machine_type: string | null
          max_daily_jobs: number | null
          max_tension: number | null
          onboarding_completed_at: string | null
          onboarding_step: number | null
          pricing_notes: string | null
          rush_fee_cents: number
          rush_turnaround_hours: number | null
          services: Json | null
          string_inventory: Json | null
          stripe_account_id: string | null
          stripe_charges_enabled: boolean | null
          stripe_onboarding_completed: boolean | null
          stripe_payouts_enabled: boolean | null
          supported_racket_types: string[] | null
          suspended: boolean | null
          suspension_reason: string | null
          total_earnings_cents: number
          turnaround_hours: number
          updated_at: string | null
          verification_documents: Json | null
          verification_status: string | null
        }
        Insert: {
          accepting_requests?: boolean | null
          accepts_player_strings?: boolean | null
          accepts_rush?: boolean
          admin_notes?: string | null
          availability?: Json | null
          base_price_cents?: number
          created_at?: string | null
          discount_bulk_jobs?: number | null
          dropoff_methods?: Json | null
          flexible_availability?: boolean | null
          id: string
          is_verified?: boolean | null
          machine_brand?: string | null
          machine_model?: string | null
          machine_type?: string | null
          max_daily_jobs?: number | null
          max_tension?: number | null
          onboarding_completed_at?: string | null
          onboarding_step?: number | null
          pricing_notes?: string | null
          rush_fee_cents?: number
          rush_turnaround_hours?: number | null
          services?: Json | null
          string_inventory?: Json | null
          stripe_account_id?: string | null
          stripe_charges_enabled?: boolean | null
          stripe_onboarding_completed?: boolean | null
          stripe_payouts_enabled?: boolean | null
          supported_racket_types?: string[] | null
          suspended?: boolean | null
          suspension_reason?: string | null
          total_earnings_cents?: number
          turnaround_hours?: number
          updated_at?: string | null
          verification_documents?: Json | null
          verification_status?: string | null
        }
        Update: {
          accepting_requests?: boolean | null
          accepts_player_strings?: boolean | null
          accepts_rush?: boolean
          admin_notes?: string | null
          availability?: Json | null
          base_price_cents?: number
          created_at?: string | null
          discount_bulk_jobs?: number | null
          dropoff_methods?: Json | null
          flexible_availability?: boolean | null
          id?: string
          is_verified?: boolean | null
          machine_brand?: string | null
          machine_model?: string | null
          machine_type?: string | null
          max_daily_jobs?: number | null
          max_tension?: number | null
          onboarding_completed_at?: string | null
          onboarding_step?: number | null
          pricing_notes?: string | null
          rush_fee_cents?: number
          rush_turnaround_hours?: number | null
          services?: Json | null
          string_inventory?: Json | null
          stripe_account_id?: string | null
          stripe_charges_enabled?: boolean | null
          stripe_onboarding_completed?: boolean | null
          stripe_payouts_enabled?: boolean | null
          supported_racket_types?: string[] | null
          suspended?: boolean | null
          suspension_reason?: string | null
          total_earnings_cents?: number
          turnaround_hours?: number
          updated_at?: string | null
          verification_documents?: Json | null
          verification_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stringer_settings_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stringing_tasks: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          is_required: boolean | null
          notes: string | null
          pause_notes: string | null
          paused_at: string | null
          photo_url: string | null
          redo_count: number | null
          redo_reason: string | null
          request_id: string
          started_at: string | null
          status: string
          task_order: number
          task_type: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_required?: boolean | null
          notes?: string | null
          pause_notes?: string | null
          paused_at?: string | null
          photo_url?: string | null
          redo_count?: number | null
          redo_reason?: string | null
          request_id: string
          started_at?: string | null
          status?: string
          task_order?: number
          task_type: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_required?: boolean | null
          notes?: string | null
          pause_notes?: string | null
          paused_at?: string | null
          photo_url?: string | null
          redo_count?: number | null
          redo_reason?: string | null
          request_id?: string
          started_at?: string | null
          status?: string
          task_order?: number
          task_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "stringing_tasks_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      user_ratings: {
        Row: {
          avg_rating: number | null
          review_count: number | null
          review_type: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      all_required_tasks_completed: {
        Args: { p_request_id: string }
        Returns: boolean
      }
      calculate_distance: {
        Args: { lat1: number; lat2: number; lng1: number; lng2: number }
        Returns: number
      }
      calculate_profile_completeness: {
        Args: { profile_id: string }
        Returns: number
      }
      calculate_request_progress: {
        Args: { p_request_id: string }
        Returns: number
      }
      can_start_task: {
        Args: { p_task_id: string }
        Returns: boolean
      }
      create_notification: {
        Args: {
          p_message: string
          p_metadata?: Json
          p_request_id: string
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
      get_next_task: {
        Args: { p_request_id: string }
        Returns: string
      }
      get_or_create_conversation: {
        Args: { user_one_id: string; user_two_id: string }
        Returns: string
      }
      increment_stringer_earnings: {
        Args: { p_amount_cents: number; p_stringer_id: string }
        Returns: undefined
      }
      initialize_stringing_tasks: {
        Args: { p_request_id: string }
        Returns: undefined
      }
      validate_request_state_transition: {
        Args: { p_new_status: string; p_request_id: string }
        Returns: boolean
      }
    }
    Enums: {
      dropoff_method: "meetup" | "pickup" | "ship" | "dropbox"
      payment_status: "unpaid" | "paid" | "refunded"
      request_status:
        | "requested"
        | "accepted"
        | "in_progress"
        | "ready"
        | "completed"
        | "canceled"
      user_role: "player" | "stringer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Relationships: []
      }
      buckets_analytics: {
        Row: {
          created_at: string
          format: string
          id: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          format?: string
          id: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          format?: string
          id?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      iceberg_namespaces: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iceberg_namespaces_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets_analytics"
            referencedColumns: ["id"]
          },
        ]
      }
      iceberg_tables: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          location: string
          name: string
          namespace_id: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id?: string
          location: string
          name: string
          namespace_id: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          location?: string
          name?: string
          namespace_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iceberg_tables_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iceberg_tables_namespace_id_fkey"
            columns: ["namespace_id"]
            isOneToOne: false
            referencedRelation: "iceberg_namespaces"
            referencedColumns: ["id"]
          },
        ]
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          level: number | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          level?: number | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          level?: number | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      prefixes: {
        Row: {
          bucket_id: string
          created_at: string | null
          level: number
          name: string
          updated_at: string | null
        }
        Insert: {
          bucket_id: string
          created_at?: string | null
          level?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          bucket_id?: string
          created_at?: string | null
          level?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prefixes_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_prefixes: {
        Args: { _bucket_id: string; _name: string }
        Returns: undefined
      }
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string }
        Returns: undefined
      }
      delete_prefix: {
        Args: { _bucket_id: string; _name: string }
        Returns: boolean
      }
      extension: {
        Args: { name: string }
        Returns: string
      }
      filename: {
        Args: { name: string }
        Returns: string
      }
      foldername: {
        Args: { name: string }
        Returns: string[]
      }
      get_level: {
        Args: { name: string }
        Returns: number
      }
      get_prefix: {
        Args: { name: string }
        Returns: string
      }
      get_prefixes: {
        Args: { name: string }
        Returns: string[]
      }
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>
        Returns: {
          bucket_id: string
          size: number
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
          prefix_param: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_token?: string
          prefix_param: string
          start_after?: string
        }
        Returns: {
          id: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      operation: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      search: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_legacy_v1: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v1_optimised: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v2: {
        Args: {
          bucket_name: string
          levels?: number
          limits?: number
          prefix: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      buckettype: "STANDARD" | "ANALYTICS"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      dropoff_method: ["meetup", "pickup", "ship", "dropbox"],
      payment_status: ["unpaid", "paid", "refunded"],
      request_status: [
        "requested",
        "accepted",
        "in_progress",
        "ready",
        "completed",
        "canceled",
      ],
      user_role: ["player", "stringer"],
    },
  },
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS"],
    },
  },
} as const

