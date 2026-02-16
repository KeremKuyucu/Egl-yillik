-- 1) Özet tablo oluştur
create table if not exists public.user_text_stats (
  user_id uuid primary key,
  total_texts_received bigint not null default 0,
  total_words_received bigint not null default 0,
  total_texts_written bigint not null default 0,
  total_words_written bigint not null default 0,
  updated_at timestamptz not null default now()
);

-- 2) Yardımcı upsert fonksiyonu (artı/eksi değerlerle çalışır)
create or replace function public.upsert_user_stats(
  p_user_id uuid,
  p_d_texts_written bigint,
  p_d_words_written bigint,
  p_d_texts_received bigint,
  p_d_words_received bigint
) returns void language sql security definer as $$
  insert into public.user_text_stats(
    user_id, total_texts_written, total_words_written, total_texts_received, total_words_received, updated_at
  )
  values (
    p_user_id,
    p_d_texts_written,
    p_d_words_written,
    p_d_texts_received,
    p_d_words_received,
    now()
  )
  on conflict (user_id) do update
  set
    total_texts_written = public.user_text_stats.total_texts_written + excluded.total_texts_written,
    total_words_written = public.user_text_stats.total_words_written + excluded.total_words_written,
    total_texts_received = public.user_text_stats.total_texts_received + excluded.total_texts_received,
    total_words_received = public.user_text_stats.total_words_received + excluded.total_words_received,
    updated_at = now();
$$;

-- 3) texts için trigger fonksiyonu (INSERT/UPDATE/DELETE)
create or replace function public.trg_user_texts_stats()
returns trigger
language plpgsql
security definer
as $$
declare
  v_old_active boolean;
  v_new_active boolean;
  v_old_words bigint := 0;
  v_new_words bigint := 0;
  v_old_author uuid;
  v_new_author uuid;
  v_old_recipient uuid;
  v_new_recipient uuid;
begin
  if tg_op = 'INSERT' then
    v_new_active := coalesce(NEW.is_active, false);
    if v_new_active then
      v_new_words := coalesce(
        regexp_count(NEW.content, '[[:alpha:]]+(?:[''’.-][[:alpha:]]+)*'),
        0
      );
      v_new_author := NEW.author_id;
      v_new_recipient := NEW.recipient_id;
      -- author: written +1
      perform public.upsert_user_stats(v_new_author, 1, v_new_words, 0, 0);
      -- recipient: received +1 (ignore self-send)
      if v_new_recipient is not null and v_new_recipient <> v_new_author then
        perform public.upsert_user_stats(v_new_recipient, 0, 0, 1, v_new_words);
      end if;
    end if;

    return NEW;
  elsif tg_op = 'DELETE' then
    v_old_active := coalesce(OLD.is_active, false);
    if v_old_active then
      v_old_words := coalesce(
        regexp_count(OLD.content, '[[:alpha:]]+(?:[''’.-][[:alpha:]]+)*'),
        0
      );
      v_old_author := OLD.author_id;
      v_old_recipient := OLD.recipient_id;
      -- subtract
      perform public.upsert_user_stats(v_old_author, -1, -v_old_words, 0, 0);
      if v_old_recipient is not null and v_old_recipient <> v_old_author then
        perform public.upsert_user_stats(v_old_recipient, 0, 0, -1, -v_old_words);
      end if;
    end if;

    return OLD;
  elsif tg_op = 'UPDATE' then
    v_old_active := coalesce(OLD.is_active, false);
    v_new_active := coalesce(NEW.is_active, false);

    v_old_words := 0;
    v_new_words := 0;
    if v_old_active then
      v_old_words := coalesce(
        regexp_count(OLD.content, '[[:alpha:]]+(?:[''’.-][[:alpha:]]+)*'),
        0
      );
      v_old_author := OLD.author_id;
      v_old_recipient := OLD.recipient_id;
    end if;
    if v_new_active then
      v_new_words := coalesce(
        regexp_count(NEW.content, '[[:alpha:]]+(?:[''’.-][[:alpha:]]+)*'),
        0
      );
      v_new_author := NEW.author_id;
      v_new_recipient := NEW.recipient_id;
    end if;

    -- remove old contributions (if any)
    if v_old_active then
      perform public.upsert_user_stats(v_old_author, -1, -v_old_words, 0, 0);
      if v_old_recipient is not null and v_old_recipient <> v_old_author then
        perform public.upsert_user_stats(v_old_recipient, 0, 0, -1, -v_old_words);
      end if;
    end if;

    -- add new contributions (if any)
    if v_new_active then
      perform public.upsert_user_stats(v_new_author, 1, v_new_words, 0, 0);
      if v_new_recipient is not null and v_new_recipient <> v_new_author then
        perform public.upsert_user_stats(v_new_recipient, 0, 0, 1, v_new_words);
      end if;
    end if;

    return NEW;
  end if;

  return NULL; -- shouldn't reach
end;
$$;

-- 4) anonymous_texts için benzer trigger fonksiyonu
create or replace function public.trg_user_anon_texts_stats()
returns trigger
language plpgsql
security definer
as $$
declare
  v_old_active boolean;
  v_new_active boolean;
  v_old_words bigint := 0;
  v_new_words bigint := 0;
  v_old_owner uuid;
  v_new_owner uuid;
  v_old_recipient uuid;
  v_new_recipient uuid;
begin
  if tg_op = 'INSERT' then
    v_new_active := coalesce(NEW.is_active, false);
    if v_new_active then
      v_new_words := coalesce(
        regexp_count(NEW.content, '[[:alpha:]]+(?:[''’.-][[:alpha:]]+)*'),
        0
      );
      v_new_owner := NEW.text_owner;
      v_new_recipient := NEW.recipient_id;
      -- owner wrote
      perform public.upsert_user_stats(v_new_owner, 1, v_new_words, 0, 0);
      -- recipient received (avoid self-send)
      if v_new_recipient is not null and v_new_recipient <> v_new_owner then
        perform public.upsert_user_stats(v_new_recipient, 0, 0, 1, v_new_words);
      end if;
    end if;
    return NEW;
  elsif tg_op = 'DELETE' then
    v_old_active := coalesce(OLD.is_active, false);
    if v_old_active then
      v_old_words := coalesce(
        regexp_count(OLD.content, '[[:alpha:]]+(?:[''’.-][[:alpha:]]+)*'),
        0
      );
      v_old_owner := OLD.text_owner;
      v_old_recipient := OLD.recipient_id;
      perform public.upsert_user_stats(v_old_owner, -1, -v_old_words, 0, 0);
      if v_old_recipient is not null and v_old_recipient <> v_old_owner then
        perform public.upsert_user_stats(v_old_recipient, 0, 0, -1, -v_old_words);
      end if;
    end if;
    return OLD;
  elsif tg_op = 'UPDATE' then
    v_old_active := coalesce(OLD.is_active, false);
    v_new_active := coalesce(NEW.is_active, false);

    if v_old_active then
      v_old_words := coalesce(
        regexp_count(OLD.content, '[[:alpha:]]+(?:[''’.-][[:alpha:]]+)*'),
        0
      );
      v_old_owner := OLD.text_owner;
      v_old_recipient := OLD.recipient_id;
    end if;

    if v_new_active then
      v_new_words := coalesce(
        regexp_count(NEW.content, '[[:alpha:]]+(?:[''’.-][[:alpha:]]+)*'),
        0
      );
      v_new_owner := NEW.text_owner;
      v_new_recipient := NEW.recipient_id;
    end if;

    if v_old_active then
      perform public.upsert_user_stats(v_old_owner, -1, -v_old_words, 0, 0);
      if v_old_recipient is not null and v_old_recipient <> v_old_owner then
        perform public.upsert_user_stats(v_old_recipient, 0, 0, -1, -v_old_words);
      end if;
    end if;

    if v_new_active then
      perform public.upsert_user_stats(v_new_owner, 1, v_new_words, 0, 0);
      if v_new_recipient is not null and v_new_recipient <> v_new_owner then
        perform public.upsert_user_stats(v_new_recipient, 0, 0, 1, v_new_words);
      end if;
    end if;

    return NEW;
  end if;

  return NULL;
end;
$$;

-- 5) Trigger'ları ekle
drop trigger if exists trg_texts_stats on public.texts;
create trigger trg_texts_stats
after insert or update or delete on public.texts
for each row
execute function public.trg_user_texts_stats();

drop trigger if exists trg_anon_texts_stats on public.anonymous_texts;
create trigger trg_anon_texts_stats
after insert or update or delete on public.anonymous_texts
for each row
execute function public.trg_user_anon_texts_stats();

-- 6) Başlangıç için mevcut verilerle tabloyu doldur (one-shot)
truncate table public.user_text_stats;
with t as (
  select
    author_id as user_id,
    count(*)::bigint as texts_written,
    coalesce(sum(regexp_count(content, '[[:alpha:]]+(?:[''’.-][[:alpha:]]+)*')),0) as words_written
  from public.texts
  where is_active is true
  group by author_id

  union all

  select
    text_owner as user_id,
    count(*)::bigint as texts_written,
    coalesce(sum(regexp_count(content, '[[:alpha:]]+(?:[''’.-][[:alpha:]]+)*')),0) as words_written
  from public.anonymous_texts
  where is_active is true
  group by text_owner
),
w as (
  select user_id, sum(texts_written) as total_texts_written, sum(words_written) as total_words_written
  from t
  group by user_id
),
r as (
  select
    recipient_id as user_id,
    count(*)::bigint as texts_received,
    coalesce(sum(regexp_count(content, '[[:alpha:]]+(?:[''’.-][[:alpha:]]+)*')),0) as words_received
  from public.texts
  where is_active is true
    and author_id <> recipient_id
  group by recipient_id

  union all

  select
    recipient_id as user_id,
    count(*)::bigint as texts_received,
    coalesce(sum(regexp_count(content, '[[:alpha:]]+(?:[''’.-][[:alpha:]]+)*')),0) as words_received
  from public.anonymous_texts
  where is_active is true
    and text_owner <> recipient_id
  group by recipient_id
),
v as (
  select user_id, sum(texts_received) as total_texts_received, sum(words_received) as total_words_received
  from r
  group by user_id
)
insert into public.user_text_stats(user_id, total_texts_received, total_words_received, total_texts_written, total_words_written, updated_at)
select
  coalesce(w.user_id, v.user_id),
  coalesce(v.total_texts_received, 0),
  coalesce(v.total_words_received, 0),
  coalesce(w.total_texts_written, 0),
  coalesce(w.total_words_written, 0),
  now()
from w
full join v on w.user_id = v.user_id;

-- 7) school_data_view'ı user_text_stats kullanacak şekilde yeniden oluştur
create or replace view public.school_data_view as
select
  p.id,
  p.first_name,
  p.last_name,
  p.school_number,
  p.class,
  p.user_year,
  coalesce(s.total_texts_received, 0) as total_texts_received,
  coalesce(s.total_texts_written, 0) as total_texts_written,
  coalesce(s.total_words_received, 0) as total_words_received,
  coalesce(s.total_words_written, 0) as total_words_written,
  coalesce(
    (
      select sum(pvs.vote_count)::integer
      from profile_vote_summary_v2 pvs
      where pvs.voted_for_id = p.id
    ),
    0
  ) as total_votes
from public.profiles p
left join public.user_text_stats s on s.user_id = p.id;

-- 8) Yetki: public/anon/authenticated için select izni
grant select on public.user_text_stats to authenticated;
grant select on public.user_text_stats to anon;

grant select on public.school_data_view to authenticated;
grant select on public.school_data_view to anon;
