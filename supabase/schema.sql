-- Reseller Command Center Supabase schema
-- Run this in the Supabase SQL editor after creating your project.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'Reseller',
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text default '',
  category text default '',
  brand text default '',
  size text default '',
  condition text default 'Good',
  cost numeric(10, 2) not null default 0,
  listing_price numeric(10, 2) not null default 0,
  sold_price numeric(10, 2),
  status text not null default 'draft' check (status in ('draft', 'listed', 'sold', 'delisted')),
  marketplace_status jsonb not null default '{}'::jsonb,
  photos text[] not null default '{}',
  created_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketplace_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  marketplace_id text not null,
  connected boolean not null default false,
  last_sync timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, marketplace_id)
);

create table if not exists public.activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  type text not null default 'info',
  date timestamptz not null default now()
);

create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  demo_mode_acknowledged boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists marketplace_connections_set_updated_at on public.marketplace_connections;
create trigger marketplace_connections_set_updated_at
before update on public.marketplace_connections
for each row execute function public.set_updated_at();

drop trigger if exists settings_set_updated_at on public.settings;
create trigger settings_set_updated_at
before update on public.settings
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1), 'Reseller'),
    new.email
  )
  on conflict (id) do nothing;

  insert into public.settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.marketplace_connections enable row level security;
alter table public.activity enable row level security;
alter table public.settings enable row level security;

create policy "Users can read own profile"
on public.profiles for select
using (auth.uid() = id);

create policy "Users can insert own profile"
on public.profiles for insert
with check (auth.uid() = id);

create policy "Users can update own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Users can manage own products"
on public.products for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own marketplace connections"
on public.marketplace_connections for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own activity"
on public.activity for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own settings"
on public.settings for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-photos',
  'product-photos',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

create policy "Users can read product photos"
on storage.objects for select
using (bucket_id = 'product-photos');

create policy "Users can upload own product photos"
on storage.objects for insert
with check (
  bucket_id = 'product-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can update own product photos"
on storage.objects for update
using (
  bucket_id = 'product-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'product-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can delete own product photos"
on storage.objects for delete
using (
  bucket_id = 'product-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);
