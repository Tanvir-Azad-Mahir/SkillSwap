-- Media row-level security policy
-- Run this in the Supabase SQL editor for the project that contains the media table.

alter table public.media enable row level security;

-- Allow authenticated users to insert media rows for themselves.
drop policy if exists "Authenticated users can insert own media" on public.media;
create policy "Authenticated users can insert own media"
  on public.media
  for insert
  to authenticated
  with check ((select auth.uid())::uuid = owner_id);

-- Allow authenticated users to select their own media rows.
drop policy if exists "Authenticated users can select own media" on public.media;
create policy "Authenticated users can select own media"
  on public.media
  for select
  to authenticated
  using ((select auth.uid())::uuid = owner_id);

-- Allow authenticated users to update their own media rows.
drop policy if exists "Authenticated users can update own media" on public.media;
create policy "Authenticated users can update own media"
  on public.media
  for update
  to authenticated
  using ((select auth.uid())::uuid = owner_id)
  with check ((select auth.uid())::uuid = owner_id);

-- Optionally allow authenticated users to delete their own media rows.
drop policy if exists "Authenticated users can delete own media" on public.media;
create policy "Authenticated users can delete own media"
  on public.media
  for delete
  to authenticated
  using ((select auth.uid())::uuid = owner_id);
