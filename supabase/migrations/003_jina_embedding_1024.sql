-- Migrate embeddings from OpenAI vector(1536) to Jina jina-embeddings-v3
-- vector(1024). Existing 1536-dimensional vectors are incompatible with the
-- new model and cannot be reused, truncated, or padded.

update public.dna_nodes
set embedding = null
where embedding is not null;

alter table public.dna_nodes
  alter column embedding type vector(1024)
  using null::vector(1024);

-- PostgreSQL identifies this function by vector, double precision, integer;
-- the vector typmod is enforced by the function definition below.
drop function if exists public.match_dna_nodes(vector, double precision, integer);

create or replace function public.match_dna_nodes(
  query_embedding vector(1024),
  match_threshold double precision default 0.25,
  match_count integer default 10
)
returns table (
  id uuid,
  content_id uuid,
  type text,
  label text,
  summary text,
  evidence_quote text,
  source_title text,
  source_date timestamptz,
  confidence double precision,
  similarity double precision
)
language sql
stable
as $$
  select
    dna_nodes.id,
    dna_nodes.content_id,
    dna_nodes.type,
    dna_nodes.label,
    dna_nodes.summary,
    dna_nodes.evidence_quote,
    dna_nodes.source_title,
    dna_nodes.source_date,
    dna_nodes.confidence,
    1 - (dna_nodes.embedding <=> query_embedding) as similarity
  from public.dna_nodes
  where dna_nodes.embedding is not null
    and 1 - (dna_nodes.embedding <=> query_embedding) >= match_threshold
  order by similarity desc
  limit match_count;
$$;
