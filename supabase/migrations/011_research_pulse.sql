create table if not exists public.research_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  headline text not null,
  summary text not null,
  published_at timestamptz,
  category text,
  source_data jsonb not null default '[]'::jsonb,
  query_context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists research_items_user_created_at_idx
  on public.research_items(user_id, created_at desc);

alter table public.research_items enable row level security;

create policy research_items_select_own on public.research_items
  for select using (auth.uid() = user_id);
create policy research_items_insert_own on public.research_items
  for insert with check (auth.uid() = user_id);
create policy research_items_delete_own on public.research_items
  for delete using (auth.uid() = user_id);

create table if not exists public.research_item_dna_links (
  research_item_id uuid not null references public.research_items(id) on delete cascade,
  dna_node_id uuid not null references public.dna_nodes(id) on delete cascade,
  relevance_summary text not null,
  created_at timestamptz not null default now(),
  primary key (research_item_id, dna_node_id)
);

alter table public.research_item_dna_links enable row level security;

create policy research_item_dna_links_select_own on public.research_item_dna_links
  for select using (
    exists (
      select 1 from public.research_items r
      where r.id = research_item_id and r.user_id = auth.uid()
    )
  );
create policy research_item_dna_links_insert_own on public.research_item_dna_links
  for insert with check (
    exists (
      select 1 from public.research_items r
      where r.id = research_item_id and r.user_id = auth.uid()
    )
    and exists (
      select 1
      from public.dna_nodes n
      join public.content_items c on c.id = n.content_id
      where n.id = dna_node_id and c.user_id = auth.uid()
    )
  );
create policy research_item_dna_links_delete_own on public.research_item_dna_links
  for delete using (
    exists (
      select 1 from public.research_items r
      where r.id = research_item_id and r.user_id = auth.uid()
    )
  );
