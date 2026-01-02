// lib/supabaseAdmin.ts
import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,          // already in your .env.local
  process.env.SUPABASE_SERVICE_ROLE_KEY!,         // server-only key (DO NOT expose in client)
  { auth: { persistSession: false } }
);