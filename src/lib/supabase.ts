import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Definimos el cliente de forma segura para evitar errores durante el proceso de build
// si las variables de entorno no están presentes momentáneamente.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Nota para el Desarrollador:
 * Asegúrate de que las variables en Vercel se llamen exactamente:
 * NEXT_PUBLIC_SUPABASE_URL
 * NEXT_PUBLIC_SUPABASE_ANON_KEY
 * 
 * Evita que el traductor del navegador cambie "NEXT" por "SIGUIENTE".
 */
