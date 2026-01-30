CREATE OR REPLACE FUNCTION "public"."get_admin_texts"()
RETURNS JSON
LANGUAGE "plpgsql"
SECURITY DEFINER
SET "search_path" TO 'public'
AS $$
BEGIN
    -- Yetki Kontrolü (Min Level 50)
    IF get_my_level() < 50 THEN
        RAISE EXCEPTION 'Yetkisiz erişim';
    END IF;

    RETURN (
        SELECT COALESCE(json_agg(
            json_build_object(
                'id', t.id,
                'content', t.content,
                'created_at', t.created_at,
                'author', json_build_object(
                    'id', a.id,
                    'first_name', a.first_name,
                    'last_name', a.last_name,
                    'school_number', a.school_number,
                    'class', a.class
                ),
                'recipient', json_build_object(
                    'id', r.id,
                    'first_name', r.first_name,
                    'last_name', r.last_name,
                    'school_number', r.school_number,
                    'class', r.class
                )
            ) ORDER BY t.created_at DESC
        ), '[]'::json)
        FROM texts t
        LEFT JOIN profiles a ON t.author_id = a.id
        LEFT JOIN profiles r ON t.recipient_id = r.id
    );
END;
$$;
