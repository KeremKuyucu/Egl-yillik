CREATE OR REPLACE FUNCTION get_all_school_stats()
RETURNS TABLE (
    user_id UUID,
    first_name TEXT,
    last_name TEXT,
    class TEXT,
    school_number TEXT,
    total_texts_written INTEGER, -- Okul genelinde yazdığı toplam yazı sayısı
    total_texts_received INTEGER, -- Okul genelinde kendisine yazılan toplam yazı sayısı
    school_completion_percentage NUMERIC -- Artık kullanılmıyor ama uyumluluk için tutulabilir veya kaldırılabilir
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_total_students INTEGER;
BEGIN
    SELECT COUNT(*)::INTEGER INTO v_total_students FROM profiles;

    RETURN QUERY
    WITH written_stats AS (
        SELECT 
            t.author_id,
            COUNT(t.id)::INTEGER as total_texts
        FROM texts t
        GROUP BY t.author_id
    ),
    received_stats AS (
        SELECT 
            t.recipient_id,
            COUNT(t.id)::INTEGER as total_received
        FROM texts t
        GROUP BY t.recipient_id
    )
    SELECT 
        p.id,
        p.first_name,
        p.last_name,
        p.class,
        p.school_number,
        COALESCE(ws.total_texts, 0) as total_texts_written,
        COALESCE(rs.total_received, 0) as total_texts_received,
        0::NUMERIC -- Placeholder for removed percentage logic if needed by types, or just clean up
    FROM profiles p
    LEFT JOIN written_stats ws ON p.id = ws.author_id
    LEFT JOIN received_stats rs ON p.id = rs.recipient_id
    ORDER BY p.class, p.first_name;
END;
$$;
