-- Use auth.jwt() to check role directly from JWT token instead of querying profiles table
drop policy if exists "texts_select_own" on public.texts;
drop policy if exists "texts_select_own_or_admin" on public.texts;

-- Users can read their own texts, admins can read all
create policy "texts_select_policy"
  on public.texts for select
  using (
    auth.uid() = author_id 
    or 
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Only authors can update their own texts
create policy "texts_update_own"
  on public.texts for update
  using (auth.uid() = author_id);

-- Only authors can delete their own texts  
create policy "texts_delete_own"
  on public.texts for delete
  using (auth.uid() = author_id);
