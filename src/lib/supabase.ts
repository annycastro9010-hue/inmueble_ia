import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Property {
  id: string;
  title: string;
  description?: string;
  price?: number;
  location: string;
  floors_count: number;
}

export interface Media {
  id: string;
  property_id: string;
  url: string;
  floor: string;
  room_type: string;
  status: 'original' | 'cleaned' | 'staged';
}

export interface Lead {
  id: string;
  property_id: string;
  client_name: string;
  phone: string;
  interest_level: number;
  survey_data: any;
}
