import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "your-supabase-url" &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== "your-supabase-anon-key"
  )
}

export interface User {
  id: string
  email: string
  name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface MediaFile {
  id: string
  filename: string
  url: string
  type: string
  size: number
  user_id: string
  tags: string[]
  likes_count: number
  comments_count: number
  views_count: number
  created_at: string
  updated_at: string
  user?: User
}

export interface Comment {
  id: string
  media_id: string
  user_id: string
  content: string
  created_at: string
  user?: User
}

export interface Message {
  id: string
  sender_id: string
  receiver_id?: string
  room_name?: string
  content: string
  type: "text" | "voice"
  created_at: string
  sender?: User
  receiver?: User
}

export interface Like {
  id: string
  media_id: string
  user_id: string
  created_at: string
  user?: User
}

export type SupabaseUser = {
  id: string
  email?: string
  user_metadata?: {
    display_name?: string
    full_name?: string
    avatar_url?: string
  }
}
