import { createClient } from '@supabase/supabase-js';

// Usa solo import.meta.env para Vite. Si usas Create React App, usa process.env
const supabaseUrl = import.meta.env.VITE_REACT_APP_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_REACT_APP_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);