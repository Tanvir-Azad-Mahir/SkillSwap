-- SkillSwap+ signup database setup
-- Run this in Supabase SQL Editor after confirming public.profiles exists.
-- Expected profiles columns:
-- id uuid primary key references auth.users(id)
-- username text unique not null
-- full_name text
-- is_active boolean not null default true
-- created_at timestamptz not null default now()
-- updated_at timestamptz

-- Treat usernames case-insensitively (Mahir and mahir cannot both exist).
create unique index if not exists profiles_username_lower_unique
on public.profiles (lower(username));

-- Lightweight username availability check for the public signup page.
create or replace function public.is_username_available(p_username text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (
    select 1
    from public.profiles
    where lower(username) = lower(trim(p_username))
  );
$$;

revoke all on function public.is_username_available(text) from public;
grant execute on function public.is_username_available(text) to anon, authenticated;

-- Automatically create the public profile when Supabase Auth creates a user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_username text;
  v_full_name text;
begin
  v_username := lower(trim(new.raw_user_meta_data ->> 'username'));
  v_full_name := nullif(trim(new.raw_user_meta_data ->> 'full_name'), '');

  if v_username is null or v_username = '' then
    raise exception 'Username is required';
  end if;

  if v_username !~ '^[a-z0-9._]{3,20}$' then
    raise exception 'Invalid username format';
  end if;

  insert into public.profiles (
    id,
    username,
    full_name,
    is_active,
    created_at,
    updated_at
  )
  values (
    new.id,
    v_username,
    v_full_name,
    true,
    now(),
    now()
  );

  return new;
end;
$$;

-- If you already have a trigger with this name and custom logic, merge that
-- logic into handle_new_user() before running these two statements.
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();

-- RLS: users can update only their own profile.
alter table public.profiles enable row level security;

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);
