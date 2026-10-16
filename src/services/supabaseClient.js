import { fetchWithTimeout } from './fetchWithTimeout.js';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
function isPublicKey(key) {
  if (!key || key.startsWith('sb_secret_')) return false;
  if (key.startsWith('sb_publishable_')) return true;
  try {
    const payload = key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payload)).role === 'anon';
  } catch { return false; }
}
export const isSupabaseConfigured = Boolean(supabaseUrl && isPublicKey(supabaseAnonKey));
export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey, {
  // Preferences is the sole durable store; auth state in the SDK is memory-only.
  auth: { persistSession: false, autoRefreshToken: true, detectSessionInUrl: true },
  global: { fetch: fetchWithTimeout }
}) : null;

export async function isGoogleEnabled() {
  if (!supabase) return false;
  const response = await fetchWithTimeout(supabaseUrl + "/auth/v1/settings", { headers: { apikey: supabaseAnonKey } });
  if (!response.ok) throw new Error("Não foi possível consultar o login Google. Tente novamente.");
  const settings = await response.json();
  return settings.external?.google === true;
}
