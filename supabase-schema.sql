-- Run this in your Supabase SQL Editor (app.supabase.com → SQL Editor)

-- User preferences table
create table if not exists user_prefs (
  user_id text primary key,
  utility text not null default 'eversource',
  monthly_usage numeric not null default 750,
  horizon_months integer not null default 12,
  alert_on_rate_change boolean not null default false,
  updated_at timestamptz default now()
);

-- Saved comparisons table
create table if not exists saved_comparisons (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  created_at timestamptz default now(),
  utility text not null,
  monthly_usage numeric not null,
  horizon_months integer not null,
  selected_supplier text not null,
  selected_rate numeric not null,
  std_rate numeric not null,
  monthly_savings numeric not null,
  projected_savings numeric not null,
  occ_pub_date text,
  note text
);

-- Index for fast user lookups
create index if not exists saved_comparisons_user_id_idx on saved_comparisons(user_id);

-- Row Level Security — users can only see their own data
alter table user_prefs enable row level security;
alter table saved_comparisons enable row level security;

create policy "Users can manage their own prefs"
  on user_prefs for all
  using (user_id = requesting_user_id())
  with check (user_id = requesting_user_id());

create policy "Users can manage their own comparisons"
  on saved_comparisons for all
  using (user_id = requesting_user_id())
  with check (user_id = requesting_user_id());

-- Helper function used by RLS (Clerk sends userId in JWT sub claim)
create or replace function requesting_user_id() returns text as $$
  select nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')::text;
$$ language sql stable;
