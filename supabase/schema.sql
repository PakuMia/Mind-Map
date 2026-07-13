-- Run this once in the Supabase SQL Editor (Dashboard > SQL Editor > New query).
-- Creates per-user storage for projects/boards/archives with row-level
-- security so each signed-in user only ever sees their own data.

create table public.projects (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.boards (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  name text not null,
  nodes jsonb not null default '[]',
  edges jsonb not null default '[]',
  background text,
  updated_at timestamptz not null default now()
);

create table public.archives (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  board jsonb not null,
  archived_at timestamptz not null default now()
);

alter table public.projects enable row level security;
alter table public.boards enable row level security;
alter table public.archives enable row level security;

create policy "own projects" on public.projects for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own boards" on public.boards for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own archives" on public.archives for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
