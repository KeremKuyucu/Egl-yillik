create view public.school_data_view as
with
  text_agg as (
    select
      t.recipient_id,
      count(*) filter (
        where
          t.is_active is true
          and t.author_id <> t.recipient_id
      )::integer as total_texts_received,
      COALESCE(
        sum(regexp_count (t.content, '\S+'::text)) filter (
          where
            t.is_active is true
            and t.author_id <> t.recipient_id
        ),
        0::bigint
      )::integer as total_words_received
    from
      texts t
    group by
      t.recipient_id
  ),
  text_written_agg as (
    select
      t.author_id,
      count(*) filter (
        where
          t.is_active is true
          and t.author_id <> t.recipient_id
      )::integer as total_texts_written,
      COALESCE(
        sum(regexp_count (t.content, '\S+'::text)) filter (
          where
            t.is_active is true
            and t.author_id <> t.recipient_id
        ),
        0::bigint
      )::integer as total_words_written
    from
      texts t
    group by
      t.author_id
  )
select
  p.id,
  p.first_name,
  p.last_name,
  p.school_number,
  p.class,
  p.user_year,
  COALESCE(ra.total_texts_received, 0) as total_texts_received,
  COALESCE(wa.total_texts_written, 0) as total_texts_written,
  COALESCE(ra.total_words_received, 0) as total_words_received,
  COALESCE(wa.total_words_written, 0) as total_words_written,
  COALESCE(
    (
      select
        sum(pvs.vote_count)::integer as sum
      from
        profile_vote_summary_v2 pvs
      where
        pvs.voted_for_id = p.id
    ),
    0
  ) as total_votes
from
  profiles p
  left join text_agg ra on ra.recipient_id = p.id
  left join text_written_agg wa on wa.author_id = p.id;
