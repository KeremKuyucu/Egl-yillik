-- Create a function to safely check if user is admin
-- This function uses SECURITY DEFINER to bypass RLS
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
stable
as $$
begin
  return exists (
    select 1 from public.profiles 
    where id = auth.uid() and role = 'admin'
  );
end;
$$;

-- Grant execute permission
grant execute on function public.is_admin() to authenticated;
