-- Poker session tracking schema
create table if not exists public.poker_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  game_type text not null check (game_type in ('cash','tournament')),
  location text not null default '',
  buy_in_amount numeric(12,2) not null check (buy_in_amount >= 0),
  rebuys integer not null default 0 check (rebuys >= 0),
  cash_out numeric(12,2) not null default 0 check (cash_out >= 0),
  duration_minutes integer check (duration_minutes is null or duration_minutes >= 0),
  notes text,
  created_at timestamptz not null default now(),
  -- derived, generated columns: the raw data stays the single source of truth
  total_in numeric(12,2) generated always as (buy_in_amount * (1 + rebuys)) stored,
  profit numeric(12,2) generated always as (cash_out - buy_in_amount * (1 + rebuys)) stored
);

create index if not exists poker_sessions_user_date_idx
  on public.poker_sessions (user_id, date desc, created_at desc);

alter table public.poker_sessions enable row level security;

drop policy if exists "poker_sessions_select_own" on public.poker_sessions;
create policy "poker_sessions_select_own" on public.poker_sessions
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "poker_sessions_insert_own" on public.poker_sessions;
create policy "poker_sessions_insert_own" on public.poker_sessions
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "poker_sessions_update_own" on public.poker_sessions;
create policy "poker_sessions_update_own" on public.poker_sessions
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "poker_sessions_delete_own" on public.poker_sessions;
create policy "poker_sessions_delete_own" on public.poker_sessions
  for delete to authenticated using ((select auth.uid()) = user_id);


create table if not exists public.budget_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  monthly_budget numeric(12,2) not null default 0 check (monthly_budget >= 0),
  mode text not null default 'fixed' check (mode in ('fixed','replenish')),
  rollover boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.budget_settings enable row level security;

drop policy if exists "budget_settings_select_own" on public.budget_settings;
create policy "budget_settings_select_own" on public.budget_settings
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "budget_settings_insert_own" on public.budget_settings;
create policy "budget_settings_insert_own" on public.budget_settings
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "budget_settings_update_own" on public.budget_settings;
create policy "budget_settings_update_own" on public.budget_settings
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "budget_settings_delete_own" on public.budget_settings;
create policy "budget_settings_delete_own" on public.budget_settings
  for delete to authenticated using ((select auth.uid()) = user_id);

create or replace function public.touch_budget_settings_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists budget_settings_touch_updated_at on public.budget_settings;
create trigger budget_settings_touch_updated_at
  before update on public.budget_settings
  for each row execute function public.touch_budget_settings_updated_at();

-- Amounts are always stored in ILS so the budget, charts and profit maths stay
-- in one currency and historical figures never shift when the rate moves.
-- These columns keep the original entry honest.
alter table public.poker_sessions
  add column if not exists entry_currency text not null default 'ILS'
    check (entry_currency in ('ILS', 'USD')),
  add column if not exists fx_rate numeric(12,4)
    check (fx_rate is null or fx_rate > 0);

alter table public.poker_sessions
  drop constraint if exists poker_sessions_fx_rate_required;
alter table public.poker_sessions
  add constraint poker_sessions_fx_rate_required
  check (entry_currency = 'ILS' or fx_rate is not null);
