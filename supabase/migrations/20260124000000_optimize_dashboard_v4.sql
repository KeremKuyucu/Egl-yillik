CREATE OR REPLACE FUNCTION public.get_dashboard_data_v4()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    u_id uuid := auth.uid();
    u_class text;
    u_last_active timestamp with time zone;
    
    -- Variables for stats
    v_written_count int;
    v_received_count int;
    v_total_words int;
    v_last_text_date timestamp with time zone;
    
    -- Variables for progress
    v_class_size int;
    v_written_unique_count int;
    
    -- Variables for system settings
    v_deadline text;
    v_graduation_date text;
    v_maintenance_mode text;
    
    -- Variables for suggestion
    v_suggested_classmate json;
    
    res json;
BEGIN
    IF u_id IS NULL THEN RETURN NULL; END IF;

    -- Update activity
    SELECT class, last_active INTO u_class, u_last_active FROM profiles WHERE id = u_id;
    IF u_last_active IS NULL OR u_last_active < (now() - INTERVAL '5 minutes') THEN
        UPDATE profiles SET last_active = now() WHERE id = u_id;
    END IF;

    -- Get System Settings (Dates)
    SELECT value INTO v_deadline FROM site_settings WHERE key = 'deadline';
    SELECT value INTO v_graduation_date FROM site_settings WHERE key = 'graduation_date';
    -- Maintenance mode is handled by middleware/client settings call, but we can return it too if needed
    -- For now just dates as requested

    -- Calculate Stats
    -- Written texts stats
    SELECT 
        count(*),
        COALESCE(sum(array_length(regexp_split_to_array(content, '\s+'), 1)), 0),
        max(updated_at)
    INTO v_written_count, v_total_words, v_last_text_date
    FROM texts
    WHERE author_id = u_id AND is_active = true;

    -- Received count
    SELECT count(*) INTO v_received_count
    FROM texts
    WHERE recipient_id = u_id AND is_active = true;

    -- Class progress
    -- Total classmates (excluding self)
    SELECT count(*) INTO v_class_size
    FROM profiles
    WHERE class = u_class AND id != u_id;

    -- Written unique recipients in class
    SELECT count(DISTINCT recipient_id) INTO v_written_unique_count
    FROM texts t
    JOIN profiles p ON t.recipient_id = p.id
    WHERE t.author_id = u_id 
      AND t.is_active = true 
      AND p.class = u_class;

    -- Suggestion (Random unwritten classmate)
    SELECT json_build_object(
        'id', p.id,
        'first_name', p.first_name,
        'last_name', p.last_name,
        'school_number', p.school_number
    ) INTO v_suggested_classmate
    FROM profiles p
    WHERE p.class = u_class 
      AND p.id != u_id
      AND NOT EXISTS (
        SELECT 1 FROM texts t 
        WHERE t.author_id = u_id 
          AND t.recipient_id = p.id 
          AND t.is_active = true
      )
    ORDER BY random()
    LIMIT 1;

    -- Build Result
    SELECT json_build_object(
        'profile', (
            SELECT json_build_object(
                'first_name', pr.first_name, 
                'last_name', pr.last_name, 
                'class', pr.class, 
                'school_number', pr.school_number
            ) 
            FROM profiles pr 
            WHERE pr.id = u_id
        ),
        'stats', json_build_object(
            'written_count', v_written_count,
            'received_count', v_received_count,
            'total_words', v_total_words,
            'last_text_date', v_last_text_date
        ),
        'progress', json_build_object(
            'required_written', v_written_unique_count,
            'required_total', v_class_size,
            'percentage', CASE WHEN v_class_size > 0 THEN round((v_written_unique_count::float / v_class_size::float) * 100) ELSE 0 END,
            'is_complete', (v_written_unique_count >= v_class_size AND v_class_size > 0)
        ),
        'suggestion', v_suggested_classmate,
        'survey_stats', (
            SELECT json_build_object(
                'total', (SELECT count(*)::int FROM survey_categories WHERE is_active = true),
                'voted', (SELECT count(*)::int FROM survey_votes WHERE voter_id = u_id)
            )
        ),
        'system_info', json_build_object(
            'deadline', v_deadline,
            'graduation_date', v_graduation_date
        )
    ) INTO res;

    RETURN res;
END;
$function$
