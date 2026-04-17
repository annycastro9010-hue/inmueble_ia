import { createClient } from '@supabase/supabase-js';

// Limpiamos la URL para evitar que una barra diagonal '/' al final cause el error "Failed to fetch"
const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseUrl = rawUrl.replace(/\/$/, ''); 

const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
  console.warn("⚠️ Advertencia: NEXT_PUBLIC_SUPABASE_URL no está configurada correctamente en Vercel.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: { 'x-application-name': 'inmueble-ia' },
  },
});
