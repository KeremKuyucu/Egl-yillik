-- RPC: Admin kullanıcı listesi (profiles + levels join)
CREATE OR REPLACE FUNCTION public.get_admin_users_list(
    class_filter TEXT DEFAULT NULL,
    search_query TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    first_name TEXT,
    last_name TEXT,
    school_number TEXT,
    class TEXT,
    last_active TIMESTAMPTZ,
    level INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Admin kontrolü
    IF get_my_level() < 50 THEN
        RAISE EXCEPTION 'Bu işlem için admin yetkisi gerekli';
    END IF;

    RETURN QUERY
    SELECT 
        p.id,
        p.first_name,
        p.last_name,
        p.school_number::TEXT,
        p.class,
        p.last_active,
        COALESCE(ul.level, 0) as level
    FROM public.profiles p
    LEFT JOIN public.user_levels ul ON p.id = ul.id
    WHERE 
        -- Sınıf filtresi
        (class_filter IS NULL OR class_filter = '' OR p.class = class_filter)
        AND
        -- Arama filtresi
        (
            search_query IS NULL OR search_query = '' OR
            LOWER(p.first_name || ' ' || p.last_name) LIKE '%' || LOWER(search_query) || '%' OR
            p.school_number::TEXT LIKE '%' || search_query || '%'
        )
    ORDER BY COALESCE(ul.level, 0) DESC, p.last_name ASC;
END;
$$;
