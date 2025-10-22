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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          cancellation_reason: string | null
          cancelled_by: string | null
          created_at: string | null
          end_time: string
          id: string
          modality: string
          patient_id: string
          psychologist_id: string
          session_notes: string | null
          start_time: string
          status: string
          updated_at: string | null
          video_link: string | null
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_by?: string | null
          created_at?: string | null
          end_time: string
          id?: string
          modality: string
          patient_id: string
          psychologist_id: string
          session_notes?: string | null
          start_time: string
          status?: string
          updated_at?: string | null
          video_link?: string | null
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_by?: string | null
          created_at?: string | null
          end_time?: string
          id?: string
          modality?: string
          patient_id?: string
          psychologist_id?: string
          session_notes?: string | null
          start_time?: string
          status?: string
          updated_at?: string | null
          video_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_psychologist_id_fkey"
            columns: ["psychologist_id"]
            isOneToOne: false
            referencedRelation: "psychologist_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_subscriptions: {
        Row: {
          auto_renew: boolean
          cancelled_at: string | null
          client_id: string
          created_at: string
          current_period_end: string
          current_period_start: string
          discount_percentage: number
          id: string
          next_billing_date: string | null
          package_type: string
          psychologist_id: string
          rollover_sessions: number
          session_price: number
          sessions_remaining: number
          sessions_total: number
          sessions_used: number
          status: string
          updated_at: string
        }
        Insert: {
          auto_renew?: boolean
          cancelled_at?: string | null
          client_id: string
          created_at?: string
          current_period_end: string
          current_period_start?: string
          discount_percentage: number
          id?: string
          next_billing_date?: string | null
          package_type: string
          psychologist_id: string
          rollover_sessions?: number
          session_price: number
          sessions_remaining: number
          sessions_total: number
          sessions_used?: number
          status?: string
          updated_at?: string
        }
        Update: {
          auto_renew?: boolean
          cancelled_at?: string | null
          client_id?: string
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          discount_percentage?: number
          id?: string
          next_billing_date?: string | null
          package_type?: string
          psychologist_id?: string
          rollover_sessions?: number
          session_price?: number
          sessions_remaining?: number
          sessions_total?: number
          sessions_used?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_subscriptions_psychologist_id_fkey"
            columns: ["psychologist_id"]
            isOneToOne: false
            referencedRelation: "psychologist_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_preferences: {
        Row: {
          accepts_homework: string
          accompaniment_style: string
          budget_max: number | null
          budget_min: number | null
          context_preference: string[] | null
          created_at: string | null
          gender_preference: string | null
          id: string
          is_active: boolean | null
          main_concern: string
          main_concern_other: string | null
          modality: string
          preferred_language: string
          preferred_time_slots: string[]
          session_expectations: string
          updated_at: string | null
          urgency: string
          user_id: string
          wants_inclusive: boolean | null
          work_comfort: string
        }
        Insert: {
          accepts_homework: string
          accompaniment_style: string
          budget_max?: number | null
          budget_min?: number | null
          context_preference?: string[] | null
          created_at?: string | null
          gender_preference?: string | null
          id?: string
          is_active?: boolean | null
          main_concern: string
          main_concern_other?: string | null
          modality: string
          preferred_language: string
          preferred_time_slots?: string[]
          session_expectations: string
          updated_at?: string | null
          urgency?: string
          user_id: string
          wants_inclusive?: boolean | null
          work_comfort: string
        }
        Update: {
          accepts_homework?: string
          accompaniment_style?: string
          budget_max?: number | null
          budget_min?: number | null
          context_preference?: string[] | null
          created_at?: string | null
          gender_preference?: string | null
          id?: string
          is_active?: boolean | null
          main_concern?: string
          main_concern_other?: string | null
          modality?: string
          preferred_language?: string
          preferred_time_slots?: string[]
          session_expectations?: string
          updated_at?: string | null
          urgency?: string
          user_id?: string
          wants_inclusive?: boolean | null
          work_comfort?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      psychologist_availability: {
        Row: {
          created_at: string | null
          day_of_week: number | null
          end_time: string
          exception_date: string | null
          id: string
          is_exception: boolean | null
          psychologist_id: string
          start_time: string
        }
        Insert: {
          created_at?: string | null
          day_of_week?: number | null
          end_time: string
          exception_date?: string | null
          id?: string
          is_exception?: boolean | null
          psychologist_id: string
          start_time: string
        }
        Update: {
          created_at?: string | null
          day_of_week?: number | null
          end_time?: string
          exception_date?: string | null
          id?: string
          is_exception?: boolean | null
          psychologist_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "psychologist_availability_psychologist_id_fkey"
            columns: ["psychologist_id"]
            isOneToOne: false
            referencedRelation: "psychologist_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      psychologist_documents: {
        Row: {
          document_type: Database["public"]["Enums"]["document_type"]
          file_name: string | null
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          psychologist_id: string
          rejection_reason: string | null
          reviewed_at: string | null
          status: Database["public"]["Enums"]["verification_status"] | null
          uploaded_at: string | null
        }
        Insert: {
          document_type: Database["public"]["Enums"]["document_type"]
          file_name?: string | null
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          psychologist_id: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["verification_status"] | null
          uploaded_at?: string | null
        }
        Update: {
          document_type?: Database["public"]["Enums"]["document_type"]
          file_name?: string | null
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          psychologist_id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["verification_status"] | null
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "psychologist_documents_psychologist_id_fkey"
            columns: ["psychologist_id"]
            isOneToOne: false
            referencedRelation: "psychologist_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      psychologist_pricing: {
        Row: {
          cancellation_policy: string | null
          created_at: string | null
          currency: string | null
          first_session_price: number | null
          fiscal_data: Json | null
          id: string
          late_tolerance_minutes: number | null
          minimum_notice_hours: number | null
          package_4_price: number | null
          package_8_price: number | null
          psychologist_id: string
          refund_policy: string | null
          reschedule_window_hours: number | null
          session_duration_minutes: number | null
          session_price: number
          updated_at: string | null
        }
        Insert: {
          cancellation_policy?: string | null
          created_at?: string | null
          currency?: string | null
          first_session_price?: number | null
          fiscal_data?: Json | null
          id?: string
          late_tolerance_minutes?: number | null
          minimum_notice_hours?: number | null
          package_4_price?: number | null
          package_8_price?: number | null
          psychologist_id: string
          refund_policy?: string | null
          reschedule_window_hours?: number | null
          session_duration_minutes?: number | null
          session_price: number
          updated_at?: string | null
        }
        Update: {
          cancellation_policy?: string | null
          created_at?: string | null
          currency?: string | null
          first_session_price?: number | null
          fiscal_data?: Json | null
          id?: string
          late_tolerance_minutes?: number | null
          minimum_notice_hours?: number | null
          package_4_price?: number | null
          package_8_price?: number | null
          psychologist_id?: string
          refund_policy?: string | null
          reschedule_window_hours?: number | null
          session_duration_minutes?: number | null
          session_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "psychologist_pricing_psychologist_id_fkey"
            columns: ["psychologist_id"]
            isOneToOne: true
            referencedRelation: "psychologist_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      psychologist_profiles: {
        Row: {
          bio_extended: string | null
          bio_short: string | null
          city: string | null
          country: string | null
          created_at: string | null
          email: string | null
          emergency_disclaimer_accepted: boolean | null
          first_name: string | null
          id: string
          is_published: boolean | null
          languages: string[] | null
          last_name: string | null
          modalities: string[] | null
          onboarding_step: number | null
          phone: string | null
          populations: string[] | null
          profile_photo_url: string | null
          specialties: string[] | null
          terms_accepted: boolean | null
          therapeutic_approaches: string[] | null
          updated_at: string | null
          user_id: string
          verification_notes: string | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          years_experience: number | null
        }
        Insert: {
          bio_extended?: string | null
          bio_short?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          emergency_disclaimer_accepted?: boolean | null
          first_name?: string | null
          id?: string
          is_published?: boolean | null
          languages?: string[] | null
          last_name?: string | null
          modalities?: string[] | null
          onboarding_step?: number | null
          phone?: string | null
          populations?: string[] | null
          profile_photo_url?: string | null
          specialties?: string[] | null
          terms_accepted?: boolean | null
          therapeutic_approaches?: string[] | null
          updated_at?: string | null
          user_id: string
          verification_notes?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          years_experience?: number | null
        }
        Update: {
          bio_extended?: string | null
          bio_short?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          emergency_disclaimer_accepted?: boolean | null
          first_name?: string | null
          id?: string
          is_published?: boolean | null
          languages?: string[] | null
          last_name?: string | null
          modalities?: string[] | null
          onboarding_step?: number | null
          phone?: string | null
          populations?: string[] | null
          profile_photo_url?: string | null
          specialties?: string[] | null
          terms_accepted?: boolean | null
          therapeutic_approaches?: string[] | null
          updated_at?: string | null
          user_id?: string
          verification_notes?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          years_experience?: number | null
        }
        Relationships: []
      }
      psychologist_verifications: {
        Row: {
          admin_id: string
          created_at: string | null
          id: string
          new_status: Database["public"]["Enums"]["verification_status"]
          notes: string | null
          previous_status: Database["public"]["Enums"]["verification_status"]
          psychologist_id: string
        }
        Insert: {
          admin_id: string
          created_at?: string | null
          id?: string
          new_status: Database["public"]["Enums"]["verification_status"]
          notes?: string | null
          previous_status: Database["public"]["Enums"]["verification_status"]
          psychologist_id: string
        }
        Update: {
          admin_id?: string
          created_at?: string | null
          id?: string
          new_status?: Database["public"]["Enums"]["verification_status"]
          notes?: string | null
          previous_status?: Database["public"]["Enums"]["verification_status"]
          psychologist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "psychologist_verifications_psychologist_id_fkey"
            columns: ["psychologist_id"]
            isOneToOne: false
            referencedRelation: "psychologist_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_history: {
        Row: {
          amount_charged: number | null
          created_at: string
          event_type: string
          id: string
          notes: string | null
          rollover_amount: number | null
          sessions_added: number | null
          subscription_id: string
        }
        Insert: {
          amount_charged?: number | null
          created_at?: string
          event_type: string
          id?: string
          notes?: string | null
          rollover_amount?: number | null
          sessions_added?: number | null
          subscription_id: string
        }
        Update: {
          amount_charged?: number | null
          created_at?: string
          event_type?: string
          id?: string
          notes?: string | null
          rollover_amount?: number | null
          sessions_added?: number | null
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_history_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "client_subscriptions"
            referencedColumns: ["id"]
          },
        ]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_psychologist: {
        Args: { _admin_notes?: string; _psychologist_id: string }
        Returns: undefined
      }
      calculate_rollover: {
        Args: { _sessions_used: number; _total_sessions: number }
        Returns: number
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      reject_psychologist: {
        Args: { _psychologist_id: string; _rejection_reason: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "psicologo" | "cliente" | "admin"
      document_type: "license" | "id" | "certificate" | "address_proof"
      verification_status: "pending" | "approved" | "rejected"
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
      app_role: ["psicologo", "cliente", "admin"],
      document_type: ["license", "id", "certificate", "address_proof"],
      verification_status: ["pending", "approved", "rejected"],
    },
  },
} as const
