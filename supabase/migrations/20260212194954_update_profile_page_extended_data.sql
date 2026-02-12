CREATE OR REPLACE FUNCTION public.get_profile_page_extended_data(
  target_school_number text,
  target_year smallint DEFAULT NULL::smallint
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_profile record;
  v_profile_id uuid;
  v_user_year smallint;

  v_unlock_date timestamp;
  v_is_unlocked boolean;
  v_days_left integer;

  v_grad_raw text;
  v_grad_year_raw text;

  v_memories jsonb := '[]'::jsonb;
  v_memories_preview jsonb := '[]'::jsonb;
  v_self_memories jsonb := '[]'::jsonb;
  v_categories jsonb := '[]'::jsonb;

  v_anon_received jsonb := '[]'::jsonb;
  v_anon_received_preview jsonb := '[]'::jsonb;
BEGIN
  -- 1) Profil + sayımlar
  SELECT
    p.id,
    p.first_name,
    p.last_name,
    p.school_number,
    p.class,
    p.user_year,

    -- received: başkalarının yazdığı (self hariç)
    (SELECT count(*) FROM public.texts t
      WHERE t.is_active = true
        AND t.recipient_id = p.id
        AND t.author_id <> t.recipient_id) AS total_texts_received,

    -- written: kullanıcının başkalarına yazdığı (self hariç)
    (SELECT count(*) FROM public.texts t
      WHERE t.is_active = true
        AND t.author_id = p.id
        AND t.author_id <> t.recipient_id) AS total_texts_written,

    (SELECT count(*) FROM public.votes v
      WHERE v.is_active = true
        AND v.voted_for_id = p.id) AS total_votes

  INTO v_profile
  FROM public.profiles p
  WHERE p.school_number = target_school_number
    AND (target_year IS NULL OR p.user_year = target_year)
    AND p.is_active = true
  ORDER BY p.user_year DESC NULLS LAST
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  v_profile_id := v_profile.id;
  v_user_year := v_profile.user_year;

  -- 2) Unlock hesabı
  SELECT value INTO v_grad_year_raw
  FROM public.site_settings
  WHERE key = 'graduation_date_' || v_user_year::text
  LIMIT 1;

  SELECT value INTO v_grad_raw
  FROM public.site_settings
  WHERE key = 'graduation_date'
  LIMIT 1;

  v_grad_year_raw := NULLIF(btrim(v_grad_year_raw), '');
  v_grad_raw := NULLIF(btrim(v_grad_raw), '');

  v_unlock_date := NULL;

  IF v_grad_year_raw IS NOT NULL
     AND v_grad_year_raw ~ '^\d{4}-\d{2}-\d{2}(\s+\d{2}:\d{2}(:\d{2})?)?$'
  THEN
    v_unlock_date := v_grad_year_raw::timestamp;
  ELSIF v_grad_raw IS NOT NULL
     AND v_grad_raw ~ '^\d{4}-\d{2}-\d{2}(\s+\d{2}:\d{2}(:\d{2})?)?$'
  THEN
    v_unlock_date := v_grad_raw::timestamp;
  END IF;

  v_unlock_date := COALESCE(v_unlock_date, '2099-01-01 00:00:00'::timestamp);
  v_is_unlocked := CURRENT_TIMESTAMP >= v_unlock_date;

  IF v_is_unlocked THEN
    v_days_left := 0;
  ELSE
    v_days_left := GREATEST(0, CEIL(EXTRACT(EPOCH FROM (v_unlock_date - CURRENT_TIMESTAMP)) / 86400)::int);
  END IF;

  -- 3) Preview (her zaman): content yok
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', t.id,
      'created_at', t.created_at,
      'updated_at', t.updated_at,
      'author_id', t.author_id,
      'author', jsonb_build_object(
        'first_name', a.first_name,
        'last_name', a.last_name,
        'school_number', a.school_number,
        'class', a.class,
        'user_year', a.user_year
      )
    )
    ORDER BY t.created_at DESC
  ), '[]'::jsonb)
  INTO v_memories_preview
  FROM public.texts t
  JOIN public.profiles a ON a.id = t.author_id
  WHERE t.is_active = true
    AND t.recipient_id = v_profile_id
    AND t.author_id <> t.recipient_id;

  -- 4) Unlocked datalar
  IF v_is_unlocked THEN
    -- Full memories (content dahil)
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'id', t.id,
        'content', t.content,
        'created_at', t.created_at,
        'updated_at', t.updated_at,
        'author_id', t.author_id,
        'author', jsonb_build_object(
          'first_name', a.first_name,
          'last_name', a.last_name,
          'school_number', a.school_number,
          'class', a.class,
          'user_year', a.user_year
        )
      )
      ORDER BY t.created_at DESC
    ), '[]'::jsonb)
    INTO v_memories
    FROM public.texts t
    JOIN public.profiles a ON a.id = t.author_id
    WHERE t.is_active = true
      AND t.recipient_id = v_profile_id
      AND t.author_id <> t.recipient_id;

    -- Self memories (kendi kendine yazdıkları)
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'id', t.id,
        'content', t.content,
        'created_at', t.created_at,
        'updated_at', t.updated_at,
        'author_id', t.author_id,
        'recipient_id', t.recipient_id,
        'author', jsonb_build_object(
          'first_name', a.first_name,
          'last_name', a.last_name,
          'school_number', a.school_number,
          'class', a.class,
          'user_year', a.user_year
        )
      )
      ORDER BY t.created_at DESC
    ), '[]'::jsonb)
    INTO v_self_memories
    FROM public.texts t
    JOIN public.profiles a ON a.id = t.author_id
    WHERE t.is_active = true
      AND t.recipient_id = v_profile_id
      AND t.author_id = t.recipient_id;

    -- Categories (senin view yerine direkt)
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'category', jsonb_build_object(
          'id', sc.id,
          'title', sc.title,
          'emoji', sc.emoji,
          'color', sc.color
        ),
        'count', COALESCE(pvs.vote_count, 0)
      )
      ORDER BY COALESCE(pvs.vote_count, 0) DESC, sc.sort_order ASC
    ), '[]'::jsonb)
    INTO v_categories
    FROM public.survey_categories sc
    LEFT JOIN public.profile_vote_summary_v2 pvs
      ON sc.id = pvs.category_id
     AND pvs.voted_for_id = v_profile_id
    WHERE sc.is_active = true;

    -- NEW: Anonymous received (content dahil)
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'id', at.id,
        'display_name', at.display_name,
        'content', at.content,
        'created_at', at.created_at,
        'updated_at', at.updated_at
      )
      ORDER BY at.created_at DESC
    ), '[]'::jsonb)
    INTO v_anon_received
    FROM public.anonymous_texts at
    WHERE at.is_active = true
      AND at.recipient_id = v_profile_id;

  END IF;

  -- 5) Anonymous preview (istersen): content yok
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', at.id,
      'display_name', at.display_name,
      'created_at', at.created_at,
      'updated_at', at.updated_at
    )
    ORDER BY at.created_at DESC
  ), '[]'::jsonb)
  INTO v_anon_received_preview
  FROM public.anonymous_texts at
  WHERE at.is_active = true
    AND at.recipient_id = v_profile_id;

  RETURN json_build_object(
    'profile', json_build_object(
      'id', v_profile.id,
      'first_name', v_profile.first_name,
      'last_name', v_profile.last_name,
      'school_number', v_profile.school_number,
      'class', v_profile.class,
      'user_year', v_profile.user_year
    ),
    'receivedCount', v_profile.total_texts_received,
    'writtenCount', v_profile.total_texts_written,
    'totalVotes', v_profile.total_votes,
    'is_unlocked', v_is_unlocked,
    'days_until_unlock', v_days_left,

    'memories', COALESCE(v_memories, '[]'::jsonb)::json,
    'memories_preview', COALESCE(v_memories_preview, '[]'::jsonb)::json,
    'self_memories', COALESCE(v_self_memories, '[]'::jsonb)::json,
    'categories', COALESCE(v_categories, '[]'::jsonb)::json,

    'anonymous_received', COALESCE(v_anon_received, '[]'::jsonb)::json,
    'anonymous_received_preview', COALESCE(v_anon_received_preview, '[]'::jsonb)::json
  );
END;
$$;
