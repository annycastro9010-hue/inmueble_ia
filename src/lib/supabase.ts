import { createClient } from '@supabase/supabase-js';

// Limpiamos la URL para evitar que una barra diagonal '/' al final cause el error "Failed to fetch"
const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
export const supabaseUrl = rawUrl.replace(/\/$/, ''); 

const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Exportamos un flag para saber si estamos en modo prueba sin romper las reglas de Supabase
export const isSupabaseConfigured = !supabaseUrl.includes('placeholder');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
