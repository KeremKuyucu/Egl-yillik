-- Add class field to profiles table
alter table public.profiles 
  add column class text not null default '12A' 
  check (class in ('12A', '12B', '12C', '12D', '12E', '12F'));

-- Create index for class queries
create index profiles_class_idx on public.profiles (class);

-- RLS Policy: Users can read all profiles (to see classmates)
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_all"
  on public.profiles for select
  using (auth.uid() is not null);

-- Keep insert and update policies for own profile only
-- (already created in 002_create_profiles_table.sql)
