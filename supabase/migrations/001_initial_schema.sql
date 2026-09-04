-- Creator DNA initial schema.

create extension if not exists vector;
create extension if not exists pgcrypto;

create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  platform text,
  published_at timestamptz,
  raw_text text not null,
  created_at timestamptz default now()
);

create table if not exists public.dna_nodes (
  id uuid primary key default gen_random_uuid(),
  content_id uuid references public.content_items(id) on delete cascade,
  type text not null check (type in ('story', 'belief', 'theme', 'experience', 'lesson')),
  label text not null,
  summary text not null,
  evidence_quote text,
  confidence double precision default 1,
  source_title text,
  source_date timestamptz,
  embedding vector(1536),
  created_at timestamptz default now()
);

create table if not exists public.dna_edges (
  id uuid primary key default gen_random_uuid(),
  source_node_id uuid references public.dna_nodes(id) on delete cascade,
  target_node_id uuid references public.dna_nodes(id) on delete cascade,
  relationship text not null,
  created_at timestamptz default now()
);
