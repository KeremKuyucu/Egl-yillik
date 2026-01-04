-- Add role column to profiles table
alter table public.profiles add column if not exists role text default 'user' check (role in ('user', 'admin'));

-- Create index for role
create index if not exists profiles_role_idx on public.profiles (role);

-- Simplified RLS policy without recursion - users can see their own profile and all other profiles
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_select_own_or_admin" on public.profiles;

-- Users can read their own profile
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

-- Users can read other profiles (needed for recipient selection)
create policy "profiles_select_all"
  on public.profiles for select
  using (true);

-- Only users can update their own profile
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);
