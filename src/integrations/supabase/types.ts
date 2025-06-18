export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ai_configurations: {
        Row: {
          common_questions: string | null
          created_at: string | null
          faq: string | null
          goals: string | null
          id: string
          is_active: boolean | null
          knowledge_base: string | null
          response_time: number | null
          restrictions: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          common_questions?: string | null
          created_at?: string | null
          faq?: string | null
          goals?: string | null
          id?: string
          is_active?: boolean | null
          knowledge_base?: string | null
          response_time?: number | null
          restrictions?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          common_questions?: string | null
          created_at?: string | null
          faq?: string | null
          goals?: string | null
          id?: string
          is_active?: boolean | null
          knowledge_base?: string | null
          response_time?: number | null
          restrictions?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      communication_channels: {
        Row: {
          channel_config: Json | null
          channel_type: string
          created_at: string | null
          id: string
          is_connected: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          channel_config?: Json | null
          channel_type: string
          created_at?: string | null
          id?: string
          is_connected?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          channel_config?: Json | null
          channel_type?: string
          created_at?: string | null
          id?: string
          is_connected?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          channel: string
          channel_thread_id: string | null
          client_id: string | null
          created_at: string | null
          id: string
          last_message_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          channel: string
          channel_thread_id?: string | null
          client_id?: string | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          channel?: string
          channel_thread_id?: string | null
          client_id?: string | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "crm_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_clients: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          last_interaction: string | null
          name: string
          phone: string | null
          status: string | null
          tags: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          last_interaction?: string | null
          name: string
          phone?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          last_interaction?: string | null
          name?: string
          phone?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          is_automated: boolean | null
          sender_name: string | null
          sender_type: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          is_automated?: boolean | null
          sender_name?: string | null
          sender_type: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          is_automated?: boolean | null
          sender_name?: string | null
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_name: string
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          phone: string | null
          plan_type: string
          subscription_end: string | null
          subscription_start: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_name: string
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          phone?: string | null
          plan_type?: string
          subscription_end?: string | null
          subscription_start?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_name?: string
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          phone?: string | null
          plan_type?: string
          subscription_end?: string | null
          subscription_start?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      statistics: {
        Row: {
          automated_messages: number | null
          channel: string
          created_at: string | null
          date: string | null
          human_messages: number | null
          id: string
          new_leads: number | null
          response_rate: number | null
          total_messages: number | null
          user_id: string
        }
        Insert: {
          automated_messages?: number | null
          channel: string
          created_at?: string | null
          date?: string | null
          human_messages?: number | null
          id?: string
          new_leads?: number | null
          response_rate?: number | null
          total_messages?: number | null
          user_id: string
        }
        Update: {
          automated_messages?: number | null
          channel?: string
          created_at?: string | null
          date?: string | null
          human_messages?: number | null
          id?: string
          new_leads?: number | null
          response_rate?: number | null
          total_messages?: number | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
