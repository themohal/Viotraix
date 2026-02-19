-- ============================================================
-- Viotraix Database Schema Migration
-- Run this in the Supabase SQL Editor to create all tables,
-- triggers, RLS policies, storage bucket, and indexes.
-- ============================================================

-- ============================================================
-- 1. TABLES
-- ============================================================

-- profiles: user profiles linked to auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  plan text not null default 'none',
  subscription_status text,
  ls_customer_id text,
  ls_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- audits: audit records with image URLs, scores, violation data
create table if not exists public.audits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  image_url text,
  file_name text,
  industry_type text default 'general',
  status text not null default 'pending',
  overall_score integer,
  violations_count integer default 0,
  result_json jsonb,
  processing_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- usage_tracking: per-period audit usage counters
create table if not exists public.usage_tracking (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  period_start timestamptz not null,
  period_end timestamptz not null,
  audits_used integer not null default 0,
  audits_limit integer not null default 0,
  created_at timestamptz not null default now()
);

-- one_time_purchases: single audit purchase records
create table if not exists public.one_time_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  ls_order_id text,
  audits_purchased integer not null default 1,
  audits_remaining integer not null default 1,
  created_at timestamptz not null default now()
);

-- email_notifications: sent email log for deduplication
create table if not exists public.email_notifications (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  subject text,
  html_body text,
  type text not null,
  sent_at timestamptz not null default now()
);

-- ============================================================
-- 2. TRIGGER: Auto-create profile on user signup
-- ============================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, plan)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'none'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop existing trigger if it exists, then create
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 3. ENABLE RLS
-- ============================================================

alter table public.profiles enable row level security;
alter table public.audits enable row level security;
alter table public.usage_tracking enable row level security;
alter table public.one_time_purchases enable row level security;
alter table public.email_notifications enable row level security;

-- ============================================================
-- 4. RLS POLICIES
-- ============================================================

-- profiles: users can read and update their own row
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- profiles: service role can do everything (for webhooks/API)
create policy "Service role full access on profiles"
  on public.profiles for all
  using (auth.role() = 'service_role');

-- audits: users can read their own audits
create policy "Users can read own audits"
  on public.audits for select
  using (auth.uid() = user_id);

-- audits: users can insert their own audits
create policy "Users can insert own audits"
  on public.audits for insert
  with check (auth.uid() = user_id);

-- audits: service role can do everything
create policy "Service role full access on audits"
  on public.audits for all
  using (auth.role() = 'service_role');

-- usage_tracking: users can read their own usage
create policy "Users can read own usage"
  on public.usage_tracking for select
  using (auth.uid() = user_id);

-- usage_tracking: service role can do everything
create policy "Service role full access on usage_tracking"
  on public.usage_tracking for all
  using (auth.role() = 'service_role');

-- one_time_purchases: users can read their own purchases
create policy "Users can read own purchases"
  on public.one_time_purchases for select
  using (auth.uid() = user_id);

-- one_time_purchases: service role can do everything
create policy "Service role full access on one_time_purchases"
  on public.one_time_purchases for all
  using (auth.role() = 'service_role');

-- email_notifications: service role only
create policy "Service role full access on email_notifications"
  on public.email_notifications for all
  using (auth.role() = 'service_role');

-- ============================================================
-- 5. INDEXES
-- ============================================================

create index if not exists idx_audits_user_id on public.audits(user_id);
create index if not exists idx_audits_status on public.audits(status);
create index if not exists idx_audits_created_at on public.audits(created_at);
create index if not exists idx_usage_tracking_user_id on public.usage_tracking(user_id);
create index if not exists idx_usage_tracking_period_end on public.usage_tracking(period_end);
create index if not exists idx_one_time_purchases_user_id on public.one_time_purchases(user_id);
create index if not exists idx_email_notifications_email_type on public.email_notifications(email, type);
create index if not exists idx_email_notifications_sent_at on public.email_notifications(sent_at);
create index if not exists idx_profiles_plan on public.profiles(plan);
create index if not exists idx_profiles_subscription_status on public.profiles(subscription_status);

-- ============================================================
-- 6. STORAGE: audit-images bucket
-- ============================================================

insert into storage.buckets (id, name, public)
values ('audit-images', 'audit-images', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload to their own folder
create policy "Authenticated users can upload audit images"
  on storage.objects for insert
  with check (
    bucket_id = 'audit-images'
    and auth.role() = 'authenticated'
  );

-- Allow public read access to audit images
create policy "Public read access for audit images"
  on storage.objects for select
  using (bucket_id = 'audit-images');

-- Allow service role full access to audit images
create policy "Service role full access on audit images"
  on storage.objects for all
  using (
    bucket_id = 'audit-images'
    and auth.role() = 'service_role'
  );
