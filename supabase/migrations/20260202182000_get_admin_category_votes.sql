-- Belirli bir kategori için detaylı oy verilerini getiren RPC fonksiyonu
CREATE OR REPLACE FUNCTION "public"."get_admin_category_votes"(p_category_id TEXT)
RETURNS JSON
LANGUAGE "plpgsql"
SECURITY DEFINER
SET "search_path" TO 'public'
AS $$
DECLARE
    v_category survey_categories%ROWTYPE;
BEGIN
    -- Yetki Kontrolü (Min Level 100 - Super Admin)
    IF get_my_level() < 100 THEN
        RAISE EXCEPTION 'Yetkisiz erişim';
    END IF;

    -- Kategori bilgisini al
    SELECT * INTO v_category FROM survey_categories WHERE id = p_category_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Kategori bulunamadı';
    END IF;

    RETURN json_build_object(
        'category', json_build_object(
            'id', v_category.id,
            'title', v_category.title,
            'emoji', v_category.emoji,
            'color', v_category.color,
            'is_active', v_category.is_active
        ),
        'stats', json_build_object(
            'total_votes', (
                SELECT COUNT(*)::integer FROM survey_votes WHERE category_id = p_category_id
            ),
            'unique_voters', (
                SELECT COUNT(DISTINCT voter_id)::integer FROM survey_votes WHERE category_id = p_category_id
            ),
            'unique_voted_for', (
                SELECT COUNT(DISTINCT voted_for_id)::integer FROM survey_votes WHERE category_id = p_category_id
            )
        ),
        'rankings', (
            SELECT COALESCE(json_agg(
                json_build_object(
                    'rank', row_number,
                    'profile', json_build_object(
                        'id', p.id,
                        'first_name', p.first_name,
                        'last_name', p.last_name,
                        'school_number', p.school_number,
                        'class', p.class,
                        'user_year', p.user_year
                    ),
                    'vote_count', vote_count,
                    'percentage', ROUND((vote_count::numeric / NULLIF(total_votes, 0)) * 100, 1)
                ) ORDER BY row_number
            ), '[]'::json)
            FROM (
                SELECT 
                    ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) as row_number,
                    sv.voted_for_id,
                    COUNT(*)::integer as vote_count,
                    (SELECT COUNT(*) FROM survey_votes WHERE category_id = p_category_id)::integer as total_votes
                FROM survey_votes sv
                WHERE sv.category_id = p_category_id
                GROUP BY sv.voted_for_id
                ORDER BY vote_count DESC
            ) ranked
            JOIN profiles p ON p.id = ranked.voted_for_id
        ),
        'class_breakdown', (
            SELECT COALESCE(json_agg(
                json_build_object(
                    'class', class,
                    'vote_count', vote_count
                ) ORDER BY vote_count DESC
            ), '[]'::json)
            FROM (
                SELECT 
                    p.class,
                    COUNT(*)::integer as vote_count
                FROM survey_votes sv
                JOIN profiles p ON p.id = sv.voted_for_id
                WHERE sv.category_id = p_category_id
                GROUP BY p.class
            ) class_stats
        ),
        'all_votes', (
            SELECT COALESCE(json_agg(
                json_build_object(
                    'voter', json_build_object(
                        'id', voter.id,
                        'first_name', voter.first_name,
                        'last_name', voter.last_name,
                        'class', voter.class,
                        'school_number', voter.school_number
                    ),
                    'voted_for', json_build_object(
                        'id', voted_for.id,
                        'first_name', voted_for.first_name,
                        'last_name', voted_for.last_name,
                        'class', voted_for.class,
                        'school_number', voted_for.school_number
                    ),
                    'created_at', sv.created_at
                ) ORDER BY sv.created_at DESC
            ), '[]'::json)
            FROM survey_votes sv
            JOIN profiles voter ON voter.id = sv.voter_id
            JOIN profiles voted_for ON voted_for.id = sv.voted_for_id
            WHERE sv.category_id = p_category_id
        )
    );
END;
$$;
