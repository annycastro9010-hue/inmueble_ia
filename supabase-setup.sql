-- SQL para configurar la base de datos de Inmueble IA en Supabase
-- Copia y pega esto en el 'SQL Editor' de tu proyecto de Supabase.

-- 1. Tabla de Inmuebles
create table if not exists public.properties (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  price numeric,
  location text,
  floors_count integer default 1,
  created_at timestamptz default now()
);

-- 2. Tabla de Multimedia (Originales y Editadas)
create table if not exists public.media (
  id uuid default gen_random_uuid() primary key,
  property_id uuid references public.properties(id) on delete cascade,
  url text not null,
  floor text,
  room_type text,
  status text check (status in ('original', 'cleaned', 'staged')),
  created_at timestamptz default now()
);

-- 3. Tabla de Leads (Interesados)
create table if not exists public.leads (
  id uuid default gen_random_uuid() primary key,
  property_id uuid references public.properties(id),
  client_name text,
  phone text,
  interest_level integer,
  survey_data jsonb,
  created_at timestamptz default now()
);

-- Habilitar RLS (Seguridad)
alter table public.properties enable row level security;
alter table public.media enable row level security;
alter table public.leads enable row level security;

-- Políticas simples para desarrollo (Lectura/Escritura abierta)
create policy "Permitir todo a usuarios anonimos" on public.properties for all using (true);
create policy "Permitir todo a usuarios anonimos" on public.media for all using (true);
create policy "Permitir todo a usuarios anonimos" on public.leads for all using (true);

-- Indices para busqueda rapida
create index if not exists idx_media_property_id on public.media(property_id);
create index if not exists idx_leads_property_id on public.leads(property_id);
