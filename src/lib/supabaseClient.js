import { createClient } from '@supabase/supabase-js';

// The Supabase URL and anon/public key are meant to be embedded in
// client-side bundles — they are not secrets. Access to data is enforced
// by Postgres row-level security policies (see supabase/schema.sql),
// not by keeping this key hidden.
const SUPABASE_URL = 'https://YOUR-PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR-ANON-PUBLIC-KEY';

export const isSupabaseConfigured = !SUPABASE_URL.includes('YOUR-PROJECT');

export const supabase = isSupabaseConfigured ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
