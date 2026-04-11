CREATE OR REPLACE FUNCTION public.get_profile_page_extended_data(target_school_number text, target_year smallint DEFAULT NULL::smallint)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_profile record;
    v_profile_id uuid;
    v_user_year smallint;

    v_unlock_date timestamp;
    v_is_unlocked boolean;
    v_days_left integer;

    v_grad_year text;

    v_memories jsonb := '[]'::jsonb;
    v_memories_preview jsonb := '[]'::jsonb;
    v_self_memories jsonb := '[]'::jsonb;
    v_categories jsonb := '[]'::jsonb;

    v_photos jsonb := '[]'::jsonb;
    v_photos_preview jsonb := '[]'::jsonb;

    v_anon_received jsonb := '[]'::jsonb;
    v_anon_received_preview jsonb := '[]'::jsonb;
BEGIN
    -- 1) Profil + sayımlar (view üzerinden)
    SELECT *
    INTO v_profile
    FROM public.school_data_view
    WHERE school_number = target_school_number
      AND (target_year IS NULL OR user_year = target_year)
    ORDER BY user_year DESC NULLS LAST
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    v_profile_id := v_profile.id;
    v_user_year := v_profile.user_year;

    -- 2) Unlock hesabı
    SELECT value INTO v_grad_year
    FROM public.site_settings
    WHERE key = 'graduation_date_' || v_user_year::text
    LIMIT 1;

    v_unlock_date := v_grad_year::timestamp;

    v_unlock_date := COALESCE(v_unlock_date, '2099-01-01 00:00:00'::timestamp);
    v_is_unlocked := CURRENT_TIMESTAMP >= v_unlock_date;
    v_days_left := CASE WHEN v_is_unlocked THEN 0 ELSE GREATEST(0, CEIL(EXTRACT(EPOCH FROM (v_unlock_date - CURRENT_TIMESTAMP)) / 86400)::int) END;

    -- 3) Preview (her zaman, content yok)
    -- Memories Preview
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
        ) ORDER BY t.created_at DESC
    ), '[]'::jsonb)
    INTO v_memories_preview
    FROM public.texts t
    JOIN public.profiles a ON a.id = t.author_id
    WHERE t.is_active = true
      AND t.recipient_id = v_profile_id
      AND t.author_id <> t.recipient_id;

    -- Photos Preview (kilitliyken sadece yapısal veri)
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', gp.id,
            'created_at', gp.created_at
        ) ORDER BY gp.created_at DESC
    ), '[]'::jsonb)
    INTO v_photos_preview
    FROM public.gallery_photos gp
    WHERE gp.user_id = v_profile_id;

    -- Anonymous Preview (content yok)
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', at.id,
            'display_name', at.display_name,
            'created_at', at.created_at,
            'updated_at', at.updated_at
        ) ORDER BY at.created_at DESC
    ), '[]'::jsonb)
    INTO v_anon_received_preview
    FROM public.anonymous_texts at
    WHERE at.is_active = true
      AND at.recipient_id = v_profile_id;

    -- 4) Unlock datalar
    IF v_is_unlocked THEN
        -- Full memories
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
            ) ORDER BY t.created_at DESC
        ), '[]'::jsonb)
        INTO v_memories
        FROM public.texts t
        JOIN public.profiles a ON a.id = t.author_id
        WHERE t.is_active = true
          AND t.recipient_id = v_profile_id
          AND t.author_id <> t.recipient_id;

        -- Full Photos
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'id', gp.id,
                'storage_path', gp.storage_path,
                'file_name', gp.file_name,
                'file_size', gp.file_size,
                'caption', gp.caption,
                'created_at', gp.created_at
            ) ORDER BY gp.created_at DESC
        ), '[]'::jsonb)
        INTO v_photos
        FROM public.gallery_photos gp
        WHERE gp.user_id = v_profile_id;

        -- Self memories
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
            ) ORDER BY t.created_at DESC
        ), '[]'::jsonb)
        INTO v_self_memories
        FROM public.texts t
        JOIN public.profiles a ON a.id = t.author_id
        WHERE t.is_active = true
          AND t.recipient_id = v_profile_id
          AND t.author_id = t.recipient_id;

        -- Categories
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'category', jsonb_build_object(
                    'id', sc.id,
                    'title', sc.title,
                    'emoji', sc.emoji,
                    'color', sc.color
                ),
                'count', COALESCE(pvs.vote_count, 0)
            ) ORDER BY COALESCE(pvs.vote_count,0) DESC, sc.sort_order ASC
        ), '[]'::jsonb)
        INTO v_categories
        FROM public.survey_categories sc
        LEFT JOIN public.profile_vote_summary_v2 pvs
            ON sc.id = pvs.category_id
           AND pvs.voted_for_id = v_profile_id
        WHERE sc.is_active = true;

        -- Anonymous received
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'id', at.id,
                'display_name', at.display_name,
                'content', at.content,
                'created_at', at.created_at,
                'updated_at', at.updated_at
            ) ORDER BY at.created_at DESC
        ), '[]'::jsonb)
        INTO v_anon_received
        FROM public.anonymous_texts at
        WHERE at.is_active = true
          AND at.recipient_id = v_profile_id;
    END IF;

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
        'photos', COALESCE(v_photos, '[]'::jsonb)::json,
        'photos_preview', COALESCE(v_photos_preview, '[]'::jsonb)::json,
        'self_memories', COALESCE(v_self_memories, '[]'::jsonb)::json,
        'categories', COALESCE(v_categories, '[]'::jsonb)::json,
        'anonymous_received', COALESCE(v_anon_received, '[]'::jsonb)::json,
        'anonymous_received_preview', COALESCE(v_anon_received_preview, '[]'::jsonb)::json
    );
END;
$function$;
