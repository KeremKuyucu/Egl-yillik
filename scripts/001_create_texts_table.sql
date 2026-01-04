-- Create texts table with RLS enabled
create table if not exists public.texts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  recipient_name text not null,
  content text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.texts enable row level security;

-- RLS Policy: Users can only SELECT their own texts
create policy "texts_select_own"
  on public.texts for select
  using (auth.uid() = author_id);

-- RLS Policy: Users can only INSERT with their own author_id
create policy "texts_insert_own"
  on public.texts for insert
  with check (auth.uid() = author_id);

-- RLS Policy: Users can only UPDATE their own texts
create policy "texts_update_own"
  on public.texts for update
  using (auth.uid() = author_id);

-- RLS Policy: Users can only DELETE their own texts
create policy "texts_delete_own"
  on public.texts for delete
  using (auth.uid() = author_id);

-- Create unique constraint: one user can write only one text per recipient
create unique index texts_author_recipient_unique 
  on public.texts (author_id, recipient_name);

-- Create index for faster queries
create index texts_author_id_idx on public.texts (author_id);

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Trigger to automatically update updated_at
create trigger texts_updated_at
  before update on public.texts
  for each row
  execute function public.handle_updated_at();
