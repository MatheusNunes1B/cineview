import { Preferences } from '@capacitor/preferences';
import { supabase } from './supabaseClient.js';
import { createAuthController } from './authPersistence.js';
export const auth = createAuthController(supabase, Preferences);
