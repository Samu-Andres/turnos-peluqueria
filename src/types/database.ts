/**
 * Tipos de la base de datos, a mano, siguiendo el esquema de
 * supabase/schema.sql.
 *
 * Cuando el proyecto de Supabase ya exista, conviene reemplazar este
 * archivo por el generado automáticamente con:
 *
 *   npx supabase gen types typescript --project-id <tu-project-id> > src/types/database.ts
 *
 * así los tipos quedan sincronizados con el esquema real.
 */

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";
export type ProfileRole = "owner" | "client";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: ProfileRole;
          full_name: string;
          phone: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          role?: ProfileRole;
          full_name: string;
          phone?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          role?: ProfileRole;
          full_name?: string;
          phone?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      businesses: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          slug: string;
          address: string | null;
          phone: string | null;
          description: string | null;
          logo_url: string | null;
          serves_at_home: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          slug: string;
          address?: string | null;
          phone?: string | null;
          description?: string | null;
          logo_url?: string | null;
          serves_at_home?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          slug?: string;
          address?: string | null;
          phone?: string | null;
          description?: string | null;
          logo_url?: string | null;
          serves_at_home?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      staff: {
        Row: {
          id: string;
          business_id: string;
          full_name: string;
          photo_url: string | null;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          full_name: string;
          photo_url?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          full_name?: string;
          photo_url?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          description: string | null;
          duration_minutes: number;
          price: number;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          name: string;
          description?: string | null;
          duration_minutes: number;
          price: number;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          name?: string;
          description?: string | null;
          duration_minutes?: number;
          price?: number;
          active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      working_hours: {
        Row: {
          id: string;
          staff_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          staff_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          staff_id?: string;
          day_of_week?: number;
          start_time?: string;
          end_time?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      bookings: {
        Row: {
          id: string;
          business_id: string;
          staff_id: string;
          service_id: string;
          client_id: string;
          start_at: string;
          end_at: string;
          status: BookingStatus;
          notes: string | null;
          client_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          staff_id: string;
          service_id: string;
          client_id: string;
          start_at: string;
          end_at: string;
          status?: BookingStatus;
          notes?: string | null;
          client_address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          staff_id?: string;
          service_id?: string;
          client_id?: string;
          start_at?: string;
          end_at?: string;
          status?: BookingStatus;
          notes?: string | null;
          client_address?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_busy_intervals: {
        Args: {
          p_staff_id: string;
          p_from: string;
          p_to: string;
        };
        Returns: {
          id: string;
          start_at: string;
          end_at: string;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Business = Database["public"]["Tables"]["businesses"]["Row"];
export type Staff = Database["public"]["Tables"]["staff"]["Row"];
export type Service = Database["public"]["Tables"]["services"]["Row"];
export type WorkingHours = Database["public"]["Tables"]["working_hours"]["Row"];
export type Booking = Database["public"]["Tables"]["bookings"]["Row"];
