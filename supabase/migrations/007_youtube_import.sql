-- YouTube source identity and playlist context for imported content.
alter table public.content_items
  add column if not exists external_source text,
  add column if not exists external_id text,
  add column if not exists external_url text;

create unique index if not exists content_items_user_external_identity_idx
  on public.content_items(user_id, external_source, external_id)
  where user_id is not null and external_source is not null and external_id is not null;

create table if not exists public.content_item_playlists (
  content_id uuid not null references public.content_items(id) on delete cascade,
  playlist_id text not null,
  playlist_title text not null,
  playlist_position integer,
  created_at timestamptz default now(),
  primary key (content_id, playlist_id)
);

create index if not exists content_item_playlists_playlist_id_idx
  on public.content_item_playlists(playlist_id);

alter table public.content_item_playlists enable row level security;

drop policy if exists content_item_playlists_select_own on public.content_item_playlists;
create policy content_item_playlists_select_own on public.content_item_playlists
  for select using (exists (
    select 1 from public.content_items c
    where c.id = content_id and c.user_id = auth.uid()
  ));

drop policy if exists content_item_playlists_insert_own on public.content_item_playlists;
create policy content_item_playlists_insert_own on public.content_item_playlists
  for insert with check (exists (
    select 1 from public.content_items c
    where c.id = content_id and c.user_id = auth.uid()
  ));

drop policy if exists content_item_playlists_delete_own on public.content_item_playlists;
create policy content_item_playlists_delete_own on public.content_item_playlists
  for delete using (exists (
    select 1 from public.content_items c
    where c.id = content_id and c.user_id = auth.uid()
  ));
