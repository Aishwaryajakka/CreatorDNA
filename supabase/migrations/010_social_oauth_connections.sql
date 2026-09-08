-- Server-managed OAuth connections. RLS is enabled with no client policies so
-- token ciphertext can only be accessed through trusted server code.
create table if not exists public.social_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  provider_user_id text,
  provider_username text,
  provider_display_name text,
  provider_avatar_url text,
  scopes jsonb not null default '[]'::jsonb,
  access_token_encrypted text not null,
  refresh_token_encrypted text,
  access_token_expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint social_connections_provider_check
    check (provider in ('linkedin', 'x')),
  constraint social_connections_user_provider_unique
    unique (user_id, provider)
);

create index if not exists social_connections_user_id_idx
  on public.social_connections(user_id);

alter table public.social_connections enable row level security;

create table if not exists public.oauth_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  state_hash text not null unique,
  pkce_verifier_encrypted text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint oauth_states_provider_check check (provider in ('linkedin', 'x'))
);

create index if not exists oauth_states_expires_at_idx
  on public.oauth_states(expires_at);

alter table public.oauth_states enable row level security;
