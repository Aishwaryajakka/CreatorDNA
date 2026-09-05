create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  profile_changed_at timestamptz
);

create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username));
alter table public.profiles
  add constraint profiles_username_format_check
  check (username = lower(username) and username ~ '^[a-z0-9_.]{3,30}$');
alter table public.profiles
  add constraint profiles_display_name_length_check
  check (length(trim(display_name)) between 2 and 50);
alter table public.profiles enable row level security;
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles for select using (auth.uid() = id);
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles for insert with check (auth.uid() = id);

create or replace function public.create_profile_for_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.raw_user_meta_data ? 'username' and new.raw_user_meta_data ? 'display_name' then
    insert into public.profiles (id, username, display_name)
    values (new.id, lower(trim(new.raw_user_meta_data->>'username')), trim(new.raw_user_meta_data->>'display_name'))
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile after insert on auth.users
for each row execute function public.create_profile_for_user();
