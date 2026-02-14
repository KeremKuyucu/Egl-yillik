-- 1. Tabloyu oluştur: Oy Erişim Logları
CREATE TABLE IF NOT EXISTS public.vote_access_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID NOT NULL REFERENCES public.profiles(id),
    category_id TEXT NOT NULL REFERENCES public.survey_categories(id),
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Politikaları
ALTER TABLE public.vote_access_logs ENABLE ROW LEVEL SECURITY;

-- 2. Logları görüntüleme fonksiyonu
CREATE OR REPLACE FUNCTION public.get_admin_vote_access_logs(p_limit integer DEFAULT 100)
 RETURNS TABLE(
    id uuid,
    admin_id uuid,
    category_id text,
    accessed_at timestamp with time zone,
    admin json,
    category_info json
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Yetki Kontrolü: system.votes.access_log izni gerekli
    PERFORM public.require_permission('system.votes.access_log');

    RETURN QUERY
    SELECT 
        l.id,
        l.admin_id,
        l.category_id,
        l.accessed_at,
        json_build_object(
            'first_name', p.first_name,
            'last_name', p.last_name,
            'class', p.class,
            'school_number', p.school_number
        ) as admin,
        json_build_object(
            'title', c.title,
            'emoji', c.emoji
        ) as category_info
    FROM vote_access_logs l
    JOIN profiles p ON p.id = l.admin_id
    JOIN survey_categories c ON c.id = l.category_id
    ORDER BY l.accessed_at DESC
    LIMIT p_limit;
END;
$function$;

-- 3. Oy getirme fonksiyonunu güncelle (Loglama ekle)
-- NOT: Bu fonksiyon zaten vardı, sadece loglama satırı eklendi.
CREATE OR REPLACE FUNCTION public.get_admin_category_votes(p_category_id text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_category survey_categories%ROWTYPE;
BEGIN
    -- Yetki Kontrolü (Min Level 100 - Super Admin)
    perform public.require_permission('admin.votes.read');

    -- LOGLAMA: Erişimi kaydet
    INSERT INTO public.vote_access_logs (admin_id, category_id)
    VALUES (auth.uid(), p_category_id);

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
$function$;
