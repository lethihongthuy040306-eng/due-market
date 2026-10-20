-- DUE Market schema for Supabase
-- Run this file in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Sinh viên DUE',
  created_at timestamptz not null default now()
);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 100),
  description text not null default '' check (char_length(description) <= 2000),
  price_vnd integer not null check (price_vnd >= 1000 and price_vnd <= 1000000000),
  category text not null check (category in ('Giáo trình','Điện tử','Đồ dùng học tập','Thời trang','Đồ gia dụng','Khác')),
  condition text not null default 'Đã qua sử dụng' check (condition in ('Mới','Đã qua sử dụng')),
  image_url text,
  contact_hint text,
  status text not null default 'active' check (status in ('active','sold','hidden')),
  created_at timestamptz not null default now()
);

create index if not exists listings_created_at_idx on public.listings(created_at desc);
create index if not exists listings_category_idx on public.listings(category);
create index if not exists listings_price_idx on public.listings(price_vnd);
create index if not exists listings_user_id_idx on public.listings(user_id);

alter table public.profiles enable row level security;
alter table public.listings enable row level security;

-- Users can read only their own profile.
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile" on public.profiles
for select to authenticated using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles
for insert to authenticated with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Active listings are public. Authenticated owners can manage their own listings.
drop policy if exists "Anyone can read active listings" on public.listings;
create policy "Anyone can read active listings" on public.listings
for select to anon, authenticated using (status = 'active' or auth.uid() = user_id);

drop policy if exists "Authenticated users can create own listings" on public.listings;
create policy "Authenticated users can create own listings" on public.listings
for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Owners can update own listings" on public.listings;
create policy "Owners can update own listings" on public.listings
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Owners can delete own listings" on public.listings;
create policy "Owners can delete own listings" on public.listings
for delete to authenticated using (auth.uid() = user_id);

-- Automatically create a profile after signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), 'Sinh viên DUE')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Note: contact_hint is only shown to the owner in this starter app.
-- For a public contact feature, add a controlled contact/messaging flow rather than exposing private email addresses.
