-- SkillSwap+ SS Credit System
-- Run once in Supabase SQL Editor.

create table if not exists public.credit_wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique
    references public.profiles(id)
    on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  total_earned integer not null default 0 check (total_earned >= 0),
  total_spent integer not null default 0 check (total_spent >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null
    references public.profiles(id)
    on delete cascade,
  amount integer not null,
  transaction_type text not null,
  reference_type text,
  reference_id uuid,
  description text,
  created_at timestamptz not null default now()
);

create index if not exists credit_transactions_user_created_idx
on public.credit_transactions (user_id, created_at desc);

alter table public.credit_wallets enable row level security;
alter table public.credit_transactions enable row level security;

grant select on table public.credit_wallets to authenticated;
grant select on table public.credit_transactions to authenticated;

drop policy if exists "Users can view own credit wallet"
on public.credit_wallets;

create policy "Users can view own credit wallet"
on public.credit_wallets
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can view own credit transactions"
on public.credit_transactions;

create policy "Users can view own credit transactions"
on public.credit_transactions
for select
to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.grant_skillswap_welcome_bonus()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.profile_completed is true
     and (
       tg_op = 'INSERT'
       or coalesce(old.profile_completed, false) is false
     )
  then
    if not exists (
      select 1
      from public.credit_transactions
      where user_id = new.id
        and transaction_type = 'welcome_bonus'
    ) then
      insert into public.credit_wallets (
        user_id, balance, total_earned, total_spent, updated_at
      )
      values (
        new.id, 100, 100, 0, now()
      )
      on conflict (user_id)
      do update set
        balance = public.credit_wallets.balance + 100,
        total_earned = public.credit_wallets.total_earned + 100,
        updated_at = now();

      insert into public.credit_transactions (
        user_id, amount, transaction_type, description
      )
      values (
        new.id, 100, 'welcome_bonus', 'Welcome to SkillSwap+'
      );
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_welcome_bonus_trigger
on public.profiles;

create trigger profiles_welcome_bonus_trigger
after insert or update of profile_completed
on public.profiles
for each row
execute function public.grant_skillswap_welcome_bonus();

-- Backfill users whose profile was completed before this trigger existed.
with eligible as (
  select p.id
  from public.profiles p
  where p.profile_completed is true
    and not exists (
      select 1
      from public.credit_transactions ct
      where ct.user_id = p.id
        and ct.transaction_type = 'welcome_bonus'
    )
)
insert into public.credit_wallets (
  user_id, balance, total_earned, total_spent, updated_at
)
select id, 100, 100, 0, now()
from eligible
on conflict (user_id)
do update set
  balance = public.credit_wallets.balance + 100,
  total_earned = public.credit_wallets.total_earned + 100,
  updated_at = now();

insert into public.credit_transactions (
  user_id, amount, transaction_type, description
)
select
  p.id,
  100,
  'welcome_bonus',
  'Welcome to SkillSwap+'
from public.profiles p
where p.profile_completed is true
  and not exists (
    select 1
    from public.credit_transactions ct
    where ct.user_id = p.id
      and ct.transaction_type = 'welcome_bonus'
  );

notify pgrst, 'reload schema';
