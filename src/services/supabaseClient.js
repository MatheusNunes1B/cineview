import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
if (supabaseAnonKey?.startsWith('sb_secret_')) {
  throw new Error('Use a chave pública anon ou publishable do Supabase.');
}
// Permite abrir o catálogo como visitante enquanto .env.local não foi preenchido.
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: true, storage: window.sessionStorage, autoRefreshToken: true, detectSessionInUrl: true }
    })
  : null;
