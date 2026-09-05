-- Associate content with Supabase Auth users. Existing rows remain nullable so
-- this migration is safe to apply before assigning legacy demo data.
alter table public.content_items
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

create index if not exists content_items_user_id_idx
  on public.content_items(user_id);

alter table public.content_items enable row level security;
alter table public.dna_nodes enable row level security;
alter table public.dna_edges enable row level security;

drop policy if exists content_items_select_own on public.content_items;
create policy content_items_select_own on public.content_items for select
  using (auth.uid() = user_id);
drop policy if exists content_items_insert_own on public.content_items;
create policy content_items_insert_own on public.content_items for insert
  with check (auth.uid() = user_id);
drop policy if exists content_items_update_own on public.content_items;
create policy content_items_update_own on public.content_items for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists content_items_delete_own on public.content_items;
create policy content_items_delete_own on public.content_items for delete
  using (auth.uid() = user_id);

drop policy if exists dna_nodes_select_own on public.dna_nodes;
create policy dna_nodes_select_own on public.dna_nodes for select using (
  exists (select 1 from public.content_items c where c.id = content_id and c.user_id = auth.uid())
);
drop policy if exists dna_nodes_insert_own on public.dna_nodes;
create policy dna_nodes_insert_own on public.dna_nodes for insert with check (
  exists (select 1 from public.content_items c where c.id = content_id and c.user_id = auth.uid())
);
drop policy if exists dna_nodes_update_own on public.dna_nodes;
create policy dna_nodes_update_own on public.dna_nodes for update using (
  exists (select 1 from public.content_items c where c.id = content_id and c.user_id = auth.uid())
) with check (
  exists (select 1 from public.content_items c where c.id = content_id and c.user_id = auth.uid())
);
drop policy if exists dna_nodes_delete_own on public.dna_nodes;
create policy dna_nodes_delete_own on public.dna_nodes for delete using (
  exists (select 1 from public.content_items c where c.id = content_id and c.user_id = auth.uid())
);

drop policy if exists dna_edges_select_own on public.dna_edges;
create policy dna_edges_select_own on public.dna_edges for select using (
  exists (select 1 from public.dna_nodes n join public.content_items c on c.id = n.content_id where n.id = source_node_id and c.user_id = auth.uid())
  and exists (select 1 from public.dna_nodes n join public.content_items c on c.id = n.content_id where n.id = target_node_id and c.user_id = auth.uid())
);
drop policy if exists dna_edges_insert_own on public.dna_edges;
create policy dna_edges_insert_own on public.dna_edges for insert with check (
  exists (select 1 from public.dna_nodes n join public.content_items c on c.id = n.content_id where n.id = source_node_id and c.user_id = auth.uid())
  and exists (select 1 from public.dna_nodes n join public.content_items c on c.id = n.content_id where n.id = target_node_id and c.user_id = auth.uid())
);
drop policy if exists dna_edges_update_own on public.dna_edges;
create policy dna_edges_update_own on public.dna_edges for update using (
  exists (select 1 from public.dna_nodes n join public.content_items c on c.id = n.content_id where n.id = source_node_id and c.user_id = auth.uid())
  and exists (select 1 from public.dna_nodes n join public.content_items c on c.id = n.content_id where n.id = target_node_id and c.user_id = auth.uid())
) with check (
  relationship is not null
  and exists (select 1 from public.dna_nodes n join public.content_items c on c.id = n.content_id where n.id = source_node_id and c.user_id = auth.uid())
  and exists (select 1 from public.dna_nodes n join public.content_items c on c.id = n.content_id where n.id = target_node_id and c.user_id = auth.uid())
);
drop policy if exists dna_edges_delete_own on public.dna_edges;
create policy dna_edges_delete_own on public.dna_edges for delete using (
  exists (select 1 from public.dna_nodes n join public.content_items c on c.id = n.content_id where n.id = source_node_id and c.user_id = auth.uid())
  and exists (select 1 from public.dna_nodes n join public.content_items c on c.id = n.content_id where n.id = target_node_id and c.user_id = auth.uid())
);

drop function if exists public.match_dna_nodes(vector(1024), double precision, integer);
create or replace function public.match_dna_nodes(
  match_user_id uuid,
  query_embedding vector(1024),
  match_threshold double precision default 0.25,
  match_count integer default 10
)
returns table (id uuid, content_id uuid, type text, label text, summary text,
  evidence_quote text, source_title text, source_date timestamptz,
  confidence double precision, similarity double precision)
language sql stable security invoker as $$
  select n.id, n.content_id, n.type, n.label, n.summary, n.evidence_quote,
    n.source_title, n.source_date, n.confidence,
    1 - (n.embedding <=> query_embedding) as similarity
  from public.dna_nodes n
  join public.content_items c on c.id = n.content_id
  where n.embedding is not null
    and c.user_id = match_user_id
    and 1 - (n.embedding <=> query_embedding) >= match_threshold
  order by similarity desc
  limit match_count;
$$;
