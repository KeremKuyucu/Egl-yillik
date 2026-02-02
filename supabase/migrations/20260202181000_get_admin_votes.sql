-- View zaten varsa oluşturma
CREATE OR REPLACE VIEW public.profile_vote_summary_v2 AS
SELECT
    sv.voted_for_id,
    sc.id as category_id,
    sc.title,
    sc.emoji,
    sc.color,
    COUNT(*)::integer as vote_count
FROM survey_votes sv
JOIN survey_categories sc ON sc.id = sv.category_id
GROUP BY
    sv.voted_for_id,
    sc.id,
    sc.title,
    sc.emoji,
    sc.color;

-- Super Admin için oy verilerini getiren RPC fonksiyonu
CREATE OR REPLACE FUNCTION "public"."get_admin_votes"()
RETURNS JSON
LANGUAGE "plpgsql"
SECURITY DEFINER
SET "search_path" TO 'public'
AS $$
BEGIN
    -- Yetki Kontrolü (Min Level 100 - Super Admin)
    IF get_my_level() < 100 THEN
        RAISE EXCEPTION 'Yetkisiz erişim';
    END IF;

    RETURN (
        SELECT json_build_object(
            'summary', (
                SELECT COALESCE(json_agg(
                    json_build_object(
                        'category_id', sc.id,
                        'title', sc.title,
                        'emoji', sc.emoji,
                        'color', sc.color,
                        'total_votes', COALESCE(vote_counts.total, 0)
                    ) ORDER BY COALESCE(vote_counts.total, 0) DESC
                ), '[]'::json)
                FROM survey_categories sc
                LEFT JOIN (
                    SELECT category_id, COUNT(*)::integer as total
                    FROM survey_votes
                    GROUP BY category_id
                ) vote_counts ON vote_counts.category_id = sc.id
                WHERE sc.is_active = true
            ),
            'top_voted', (
                SELECT COALESCE(json_agg(
                    json_build_object(
                        'profile', json_build_object(
                            'id', p.id,
                            'first_name', p.first_name,
                            'last_name', p.last_name,
                            'school_number', p.school_number,
                            'class', p.class,
                            'user_year', p.user_year
                        ),
                        'category', json_build_object(
                            'id', sc.id,
                            'title', sc.title,
                            'emoji', sc.emoji,
                            'color', sc.color
                        ),
                        'vote_count', pvs.vote_count
                    ) ORDER BY pvs.vote_count DESC
                ), '[]'::json)
                FROM profile_vote_summary_v2 pvs
                JOIN profiles p ON p.id = pvs.voted_for_id
                JOIN survey_categories sc ON sc.id = pvs.category_id
                WHERE sc.is_active = true
            ),
            'stats', json_build_object(
                'total_votes', (SELECT COUNT(*)::integer FROM survey_votes),
                'total_voters', (SELECT COUNT(DISTINCT voter_id)::integer FROM survey_votes),
                'total_categories', (SELECT COUNT(*)::integer FROM survey_categories WHERE is_active = true)
            )
        )
    );
END;
$$;
