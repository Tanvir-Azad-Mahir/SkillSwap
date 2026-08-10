-- Dashboard read permissions

grant select on table public.skills to authenticated;
grant select on table public.user_skills to authenticated;
grant select on table public.user_interests to authenticated;
grant select on table public.sessions to authenticated;

alter table public.skills enable row level security;
alter table public.user_skills enable row level security;
alter table public.user_interests enable row level security;
alter table public.sessions enable row level security;

drop policy if exists "Authenticated users can view active skills"
on public.skills;

create policy "Authenticated users can view active skills"
on public.skills
for select
to authenticated
using (is_active = true);

drop policy if exists "Users can view own skills"
on public.user_skills;

create policy "Users can view own skills"
on public.user_skills
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can view own interests"
on public.user_interests;

create policy "Users can view own interests"
on public.user_interests
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can view own sessions"
on public.sessions;

create policy "Users can view own sessions"
on public.sessions
for select
to authenticated
using (
  (select auth.uid()) = learner_id
  or
  (select auth.uid()) = mentor_id
);
