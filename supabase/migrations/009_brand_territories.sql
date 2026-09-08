-- User-declared intellectual territories for future brand direction.
create table if not exists public.brand_territories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  normalized_name text not null,
  description text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint brand_territories_name_trimmed_check
    check (name = btrim(name) and length(name) > 0),
  constraint brand_territories_normalized_name_check
    check (
      normalized_name = lower(btrim(name))
      and length(normalized_name) > 0
    ),
  constraint brand_territories_user_name_unique
    unique (user_id, normalized_name)
);

create index if not exists brand_territories_user_id_idx
  on public.brand_territories(user_id);

alter table public.brand_territories enable row level security;

drop policy if exists brand_territories_select_own on public.brand_territories;
create policy brand_territories_select_own on public.brand_territories
  for select using (auth.uid() = user_id);

drop policy if exists brand_territories_insert_own on public.brand_territories;
create policy brand_territories_insert_own on public.brand_territories
  for insert with check (auth.uid() = user_id);

drop policy if exists brand_territories_update_own on public.brand_territories;
create policy brand_territories_update_own on public.brand_territories
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists brand_territories_delete_own on public.brand_territories;
create policy brand_territories_delete_own on public.brand_territories
  for delete using (auth.uid() = user_id);
