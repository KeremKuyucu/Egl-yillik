-- Add recipient_id to track who the text is written to
alter table public.texts 
  add column recipient_id uuid references public.profiles(id) on delete cascade;

-- Update recipient_id to be required
alter table public.texts 
  alter column recipient_id set not null;

-- Keep recipient_name for backward compatibility but make it computed
-- We'll populate it from profiles table in the application

-- Drop old unique constraint
drop index if exists texts_author_recipient_unique;

-- Create new unique constraint with recipient_id
create unique index texts_author_recipient_id_unique 
  on public.texts (author_id, recipient_id);

-- Create index for recipient queries
create index texts_recipient_id_idx on public.texts (recipient_id);

-- RLS stays the same - users can only see their own texts
