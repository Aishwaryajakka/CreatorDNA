alter table public.profiles
  add column if not exists onboarding_completed boolean not null default false;

update public.profiles p
set onboarding_completed = true
where exists (
  select 1 from public.content_items c
  where c.user_id = p.id and c.title = 'Creator Foundation'
);
