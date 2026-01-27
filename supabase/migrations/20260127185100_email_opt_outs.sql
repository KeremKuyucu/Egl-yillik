-- Hatırlatma maillerinden çıkış yapan kullanıcılar tablosu
CREATE TABLE IF NOT EXISTS public.email_opt_outs (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.email_opt_outs ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar kendi tercihlerini yönetebilir
CREATE POLICY "Users can manage their own opt-out"
ON public.email_opt_outs
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Adminler tüm tercihleri görebilir
CREATE POLICY "Admins can view all opt-outs"
ON public.email_opt_outs
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_levels
        WHERE id = auth.uid() AND level >= 1000
    )
);

-- get_bulk_user_stats fonksiyonunu güncelle (is_opted_out ve level alanlarını ekle)
CREATE OR REPLACE FUNCTION public.get_bulk_user_stats(user_ids uuid[] DEFAULT NULL::uuid[])
 RETURNS TABLE(
    user_id uuid,
    first_name text,
    last_name text,
    class text,
    level integer,
    email text,
    total_classmates integer,
    messages_sent_to_classmates integer,
    remaining_classmates integer,
    text_completion_percentage numeric,
    total_survey_categories integer,
    completed_surveys integer,
    remaining_surveys integer,
    survey_completion_percentage numeric,
    is_opted_out boolean
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
    RETURN QUERY
    WITH filtered_profiles AS (
        SELECT 
            p.id, 
            p.first_name, 
            p.last_name, 
            p.class, 
            u.email::text,
            COALESCE(ul.level, 0)::integer as level,
            CASE WHEN eo.user_id IS NOT NULL THEN true ELSE false END as is_opted_out
        FROM profiles p
        JOIN auth.users u ON p.id = u.id -- auth.users tablosundan çekildi
        LEFT JOIN user_levels ul ON ul.id = p.id
        LEFT JOIN email_opt_outs eo ON eo.user_id = p.id
        WHERE (user_ids IS NULL OR p.id = ANY(user_ids))
    ),
    class_counts AS (
        SELECT 
            p.class, 
            COUNT(*)::integer - 1 AS class_size 
        FROM profiles p
        GROUP BY p.class
    ),
    text_stats AS (
        SELECT
            t.author_id AS user_id,
            COUNT(DISTINCT t.recipient_id)::integer AS messages_sent
        FROM texts t
        JOIN profiles author ON t.author_id = author.id
        JOIN profiles recipient ON t.recipient_id = recipient.id
        WHERE t.is_active = true 
          AND author.class = recipient.class
          AND author.id <> recipient.id
        GROUP BY t.author_id
    ),
    survey_stats AS (
        SELECT
            sv.voter_id AS user_id,
            COUNT(DISTINCT sv.category_id)::integer AS completed
        FROM survey_votes sv
        GROUP BY sv.voter_id
    ),
    total_surveys AS (
        SELECT COUNT(*)::integer AS total
        FROM survey_categories
        WHERE is_active = true
    )
    SELECT
        p.id,
        p.first_name,
        p.last_name,
        p.class,
        p.level,
        p.email,

        COALESCE(cc.class_size, 0)::integer AS total_classmates,
        COALESCE(ts.messages_sent, 0)::integer AS messages_sent_to_classmates,

        GREATEST(COALESCE(cc.class_size, 0) - COALESCE(ts.messages_sent, 0), 0)::integer AS remaining_classmates,

        CASE
            WHEN COALESCE(cc.class_size, 0) = 0 THEN 0
            ELSE ROUND((COALESCE(ts.messages_sent, 0)::numeric / cc.class_size::numeric) * 100, 2)
        END AS text_completion_percentage,

        tsur.total::integer AS total_survey_categories,
        COALESCE(ss.completed, 0)::integer AS completed_surveys,

        GREATEST(tsur.total - COALESCE(ss.completed, 0), 0)::integer AS remaining_surveys,

        CASE
            WHEN tsur.total = 0 THEN 0
            ELSE ROUND((COALESCE(ss.completed, 0)::numeric / tsur.total::numeric) * 100, 2)
        END AS survey_completion_percentage,
        
        p.is_opted_out

    FROM filtered_profiles p
    LEFT JOIN class_counts cc ON cc.class = p.class
    LEFT JOIN text_stats ts ON ts.user_id = p.id
    LEFT JOIN survey_stats ss ON ss.user_id = p.id
    CROSS JOIN total_surveys tsur
    ORDER BY p.class, p.first_name, p.last_name;
END;
$function$;
