-- Update texts RLS to use the safe is_admin() function
drop policy if exists "texts_select_policy" on public.texts;

create policy "texts_select_policy"
  on public.texts for select
  using (
    auth.uid() = author_id 
    or 
    public.is_admin()
  );
