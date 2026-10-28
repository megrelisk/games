-- =============================================================================
--  Games Night — Supabase schema
--  Run in the SQL editor of your Supabase project (or `supabase db push`).
--  Open-contribution mode: no auth. RLS is enabled with permissive policies
--  for the anon role so anyone with the link can read and write.
-- =============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
--  Tables
-- ---------------------------------------------------------------------------

create table if not exists public.games (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  title            text not null,
  tagline          text,
  category         text not null check (category in ('board','card','sheet','party','dice','word')),
  tags             text[] not null default '{}',
  min_players      int  not null default 2 check (min_players >= 1),
  max_players      int  not null default 4 check (max_players >= min_players),
  duration_minutes int  not null default 30 check (duration_minutes > 0),
  min_age          int,
  complexity       int check (complexity between 1 and 5),
  cover_url        text,
  rules_md         text not null default '',
  setup_md         text,
  notes_md         text,
  components       jsonb not null default '[]'::jsonb,   -- [{id,label,qty,optional}]
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists public.media_files (
  id               uuid primary key default gen_random_uuid(),
  game_id          uuid not null references public.games(id) on delete cascade,
  kind             text not null check (kind in ('image','video','audio')),
  url              text not null,
  poster_url       text,
  title            text,
  caption          text,
  mime_type        text,
  size_bytes       bigint,
  duration_seconds numeric,
  width            int,
  height           int,
  created_at       timestamptz not null default now()
);

create table if not exists public.attached_documents (
  id               uuid primary key default gen_random_uuid(),
  game_id          uuid not null references public.games(id) on delete cascade,
  kind             text not null check (kind in ('pdf','docx','xlsx','pptx','other')),
  name             text not null,
  url              text not null,
  size_bytes       bigint,
  mime_type        text,
  description      text,
  created_at       timestamptz not null default now()
);

create table if not exists public.events (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  title            text not null,
  event_date       date not null,
  notes_md         text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists public.event_program_items (
  id               uuid primary key default gen_random_uuid(),
  event_id         uuid not null references public.events(id) on delete cascade,
  game_id          uuid not null references public.games(id) on delete cascade,
  position         int  not null default 0,
  note             text,
  created_at       timestamptz not null default now()
);

create table if not exists public.todo_items (
  id               uuid primary key default gen_random_uuid(),
  event_id         uuid not null references public.events(id) on delete cascade,
  category         text not null default '',
  label            text not null,
  done             boolean not null default false,
  position         int not null default 0,
  created_at       timestamptz not null default now()
);

create index if not exists media_files_game_idx on public.media_files(game_id, created_at desc);
create index if not exists attached_documents_game_idx on public.attached_documents(game_id, created_at desc);
create index if not exists games_category_idx on public.games(category);
create index if not exists games_updated_idx on public.games(updated_at desc);
create index if not exists event_program_items_event_idx on public.event_program_items(event_id, position);
create index if not exists todo_items_event_idx on public.todo_items(event_id, position);

-- keep updated_at fresh
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists games_touch on public.games;
create trigger games_touch before update on public.games
  for each row execute function public.touch_updated_at();

-- bump the parent game when media/docs are added
create or replace function public.touch_parent_game()
returns trigger language plpgsql as $$
begin
  update public.games set updated_at = now() where id = coalesce(new.game_id, old.game_id);
  return coalesce(new, old);
end $$;

drop trigger if exists media_touch_game on public.media_files;
create trigger media_touch_game after insert or delete on public.media_files
  for each row execute function public.touch_parent_game();

drop trigger if exists docs_touch_game on public.attached_documents;
create trigger docs_touch_game after insert or delete on public.attached_documents
  for each row execute function public.touch_parent_game();

drop trigger if exists events_touch on public.events;
create trigger events_touch before update on public.events
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
--  Row Level Security — open contribution
-- ---------------------------------------------------------------------------

alter table public.games                enable row level security;
alter table public.media_files          enable row level security;
alter table public.attached_documents   enable row level security;
alter table public.events               enable row level security;
alter table public.event_program_items  enable row level security;
alter table public.todo_items           enable row level security;

do $$
declare t text;
begin
  foreach t in array array['games','media_files','attached_documents','events','event_program_items','todo_items'] loop
    execute format('drop policy if exists "%s_public_read"   on public.%I', t, t);
    execute format('drop policy if exists "%s_public_insert" on public.%I', t, t);
    execute format('drop policy if exists "%s_public_update" on public.%I', t, t);
    execute format('drop policy if exists "%s_public_delete" on public.%I', t, t);
    execute format('create policy "%s_public_read"   on public.%I for select to anon, authenticated using (true)', t, t);
    execute format('create policy "%s_public_insert" on public.%I for insert to anon, authenticated with check (true)', t, t);
    execute format('create policy "%s_public_update" on public.%I for update to anon, authenticated using (true) with check (true)', t, t);
    execute format('create policy "%s_public_delete" on public.%I for delete to anon, authenticated using (true)', t, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
--  Storage buckets (public read) — one per media family
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('game-images', 'game-images', true, 15728640,   array['image/jpeg','image/png','image/webp','image/gif']),
  ('game-videos', 'game-videos', true, 524288000,  array['video/mp4','video/webm','video/quicktime']),
  ('game-audio',  'game-audio',  true, 52428800,   array['audio/mpeg','audio/mp3','audio/wav','audio/x-wav','audio/mp4','audio/x-m4a','audio/m4a','audio/aac','audio/webm','audio/ogg']),
  ('game-docs',   'game-docs',   true, 104857600,  array[
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/msword','application/vnd.ms-excel','application/vnd.ms-powerpoint'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- storage.objects policies: anyone may read / upload into these buckets
drop policy if exists "games_night_storage_read"   on storage.objects;
drop policy if exists "games_night_storage_insert" on storage.objects;
drop policy if exists "games_night_storage_update" on storage.objects;
drop policy if exists "games_night_storage_delete" on storage.objects;

create policy "games_night_storage_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id in ('game-images','game-videos','game-audio','game-docs'));

create policy "games_night_storage_insert" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id in ('game-images','game-videos','game-audio','game-docs'));

create policy "games_night_storage_update" on storage.objects
  for update to anon, authenticated
  using (bucket_id in ('game-images','game-videos','game-audio','game-docs'));

create policy "games_night_storage_delete" on storage.objects
  for delete to anon, authenticated
  using (bucket_id in ('game-images','game-videos','game-audio','game-docs'));
