
CREATE OR REPLACE FUNCTION public.get_profile_page_extended_data(
  target_school_number text,
  target_year smallint DEFAULT NULL::smallint
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_data RECORD; 
    v_unlock_date TIMESTAMP; 
    v_is_unlocked BOOLEAN; 
    v_days_left INTEGER; 
    result JSON;
BEGIN
    -- 1. Profili Bul
    SELECT v.*, p.user_year INTO v_data 
    FROM school_data_view v
    JOIN profiles p ON v.id = p.id
    WHERE v.school_number = target_school_number
      AND (target_year IS NULL OR p.user_year = target_year)
    ORDER BY p.user_year DESC NULLS LAST
    LIMIT 1;

    IF NOT FOUND THEN RETURN NULL; END IF;

    -- 2. Kilit Tarihi
    SELECT (value)::TIMESTAMP INTO v_unlock_date 
    FROM site_settings 
    WHERE key = 'graduation_date_' || v_data.user_year::text;

    IF v_unlock_date IS NULL THEN
        SELECT (value)::TIMESTAMP INTO v_unlock_date 
        FROM site_settings 
        WHERE key = 'graduation_date';
    END IF;

    v_unlock_date := COALESCE(v_unlock_date, '2099-01-01 00:00:00');
    v_is_unlocked := CURRENT_TIMESTAMP >= v_unlock_date;
    v_days_left := CEIL(EXTRACT(EPOCH FROM (v_unlock_date - CURRENT_TIMESTAMP)) / 86400)::INTEGER;

    -- 3. JSON
    SELECT json_build_object(
        'profile', json_build_object(
            'id', v_data.id, 
            'first_name', v_data.first_name, 
            'last_name', v_data.last_name, 
            'school_number', v_data.school_number, 
            'class', v_data.class,
            'user_year', v_data.user_year
        ), 
        'receivedCount', v_data.total_texts_received, 
        'writtenCount', v_data.total_texts_written, 
        'totalVotes', v_data.total_votes, 
        'is_unlocked', v_is_unlocked, 
        'days_until_unlock', GREATEST(0, v_days_left), 

        -- başkalarının yazdıkları
        'memories', (CASE WHEN v_is_unlocked THEN (
            SELECT COALESCE(json_agg(m), '[]'::json) 
            FROM (
                SELECT
                  t.*,
                  json_build_object(
                      'first_name', a.first_name, 
                      'last_name', a.last_name, 
                      'school_number', a.school_number, 
                      'class', a.class,
                      'user_year', a.user_year
                  ) AS author 
                FROM texts t 
                JOIN profiles a ON t.author_id = a.id 
                WHERE t.recipient_id = v_data.id
                  AND t.is_active = true
                  AND t.author_id <> t.recipient_id
                ORDER BY t.created_at DESC
            ) m
        ) ELSE '[]'::json END),

        -- kişinin kendine yazdıkları (ayrı alan)
        'self_memories', (CASE WHEN v_is_unlocked THEN (
            SELECT COALESCE(json_agg(m), '[]'::json) 
            FROM (
                SELECT
                  t.*,
                  json_build_object(
                      'first_name', a.first_name, 
                      'last_name', a.last_name, 
                      'school_number', a.school_number, 
                      'class', a.class,
                      'user_year', a.user_year
                  ) AS author
                FROM texts t
                JOIN profiles a ON t.author_id = a.id
                WHERE t.recipient_id = v_data.id
                  AND t.is_active = true
                  AND t.author_id = t.recipient_id
                ORDER BY t.created_at DESC
            ) m
        ) ELSE '[]'::json END),

        'categories', (CASE WHEN v_is_unlocked THEN (
            SELECT COALESCE(json_agg(c), '[]'::json) 
            FROM (
                SELECT
                  json_build_object('id', sc.id, 'title', sc.title, 'emoji', sc.emoji, 'color', sc.color) AS category, 
                  COALESCE(pvs.vote_count, 0) AS count 
                FROM survey_categories sc 
                LEFT JOIN profile_vote_summary pvs 
                  ON sc.id = pvs.category_id AND pvs.voted_for_id = v_data.id 
                WHERE sc.is_active = true 
                ORDER BY count DESC, sc.sort_order ASC
            ) c
        ) ELSE '[]'::json END)
    ) INTO result;

    RETURN result;
END;
$function$;
