import { supabase, isSupabaseConfigured } from '../../src/services/supabaseClient.js';

export const backendConfigured = isSupabaseConfigured;
export const getClient = async () => supabase;
