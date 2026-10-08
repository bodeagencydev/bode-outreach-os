-- Additive migration for cloud-synced, per-user workspace state.
-- Run this in the Supabase SQL Editor for project aegmjoviqqsgblkbclvw.
create table if not exists public.workspace_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.workspace_state enable row level security;

drop policy if exists "Users can read their own workspace state" on public.workspace_state;
create policy "Users can read their own workspace state"
  on public.workspace_state for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own workspace state" on public.workspace_state;
create policy "Users can insert their own workspace state"
  on public.workspace_state for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own workspace state" on public.workspace_state;
create policy "Users can update their own workspace state"
  on public.workspace_state for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update on public.workspace_state to authenticated;
