import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wapgawwhpnoemfbgzspy.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type BusinessStatus = "active" | "suspended" | "archived";
export type MembershipRole = "owner" | "admin" | "manager" | "employee";
export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no_show";

export interface Business {
  id: string;
  created_by: string;
  name: string;
  slug: string;
  description?: string | null;
  email?: string | null;
  phone?: string | null;
  website_url?: string | null;
  timezone: string;
  currency: string;
  status: BusinessStatus;
  is_published: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
}

export interface BusinessMembership {
  id: string;
  business_id: string;
  user_id: string;
  role: MembershipRole;
  business?: Business;
}
