-- 1. Add user_year column (if not exists)
ALTER TABLE "public"."profiles" ADD COLUMN IF NOT EXISTS "user_year" smallint;

-- 2. Ensure active_year setting exists (default to current year if missing)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.site_settings WHERE key = 'active_year') THEN
        INSERT INTO public.site_settings (key, value, description)
        VALUES ('active_year', to_char(now(), 'YYYY'), 'Aktif dönem yılı');
    END IF;
END $$;

-- 3. Drop old constraints
ALTER TABLE "public"."profiles" DROP CONSTRAINT IF EXISTS "profiles_school_number_key"; 
ALTER TABLE "public"."profiles" DROP CONSTRAINT IF EXISTS "profiles_school_number_unique";
ALTER TABLE "public"."profiles" DROP CONSTRAINT IF EXISTS "profiles_school_number_check"; 

-- Drop existing composite if exists (to update)
ALTER TABLE "public"."profiles" DROP CONSTRAINT IF EXISTS "profiles_school_number_year_unique";
ALTER TABLE "public"."profiles" ADD CONSTRAINT "profiles_school_number_year_unique" UNIQUE ("school_number", "user_year");


-- 4. User Provided: CREATE OR REPLACE FUNCTION public.validate_profile
CREATE OR REPLACE FUNCTION public.validate_profile()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    valid_classes text[];
    school_number_len int;
    school_number_pattern text;
    active_year int;
BEGIN
    -- AYARLAR
    SELECT string_to_array(value, ',')
    INTO valid_classes
    FROM site_settings
    WHERE key = 'valid_classes';

    SELECT value::int
    INTO school_number_len
    FROM site_settings
    WHERE key = 'school_number_length';

    SELECT value
    INTO school_number_pattern
    FROM site_settings
    WHERE key = 'school_number_regex';

    SELECT value::int
    INTO active_year
    FROM site_settings
    WHERE key = 'active_year';

    -- AYAR KONTROLLERİ (ZORUNLU)
    IF active_year IS NULL THEN
        RAISE EXCEPTION 'active_year ayarı bulunamadı';
    END IF;

    IF valid_classes IS NULL THEN
        RAISE EXCEPTION 'valid_classes ayarı bulunamadı';
    END IF;

    IF school_number_len IS NULL THEN
        RAISE EXCEPTION 'school_number_length ayarı bulunamadı';
    END IF;

    IF school_number_pattern IS NULL THEN
        RAISE EXCEPTION 'school_number_regex ayarı bulunamadı';
    END IF;

    ----------------------------------------------------------------
    -- USER_YEAR KURALLARI (ASIL MESELE)
    ----------------------------------------------------------------

    IF TG_OP = 'INSERT' THEN
        -- Frontend ne gönderirse göndersin YOK SAY
        NEW.user_year := active_year;

    ELSIF TG_OP = 'UPDATE' THEN
        -- Değiştirmeye çalışıyorsa ENGELLE
        IF NEW.user_year IS DISTINCT FROM OLD.user_year THEN
            RAISE EXCEPTION 'user_year değiştirilemez';
        END IF;
    END IF;

    ----------------------------------------------------------------
    -- CLASS
    ----------------------------------------------------------------
    IF NOT (NEW.class = ANY(valid_classes)) THEN
        RAISE EXCEPTION 'Geçersiz class: %', NEW.class;
    END IF;

    ----------------------------------------------------------------
    -- SCHOOL NUMBER
    ----------------------------------------------------------------
    IF length(NEW.school_number) != school_number_len THEN
        RAISE EXCEPTION 'Geçersiz school_number uzunluğu: %', NEW.school_number;
    END IF;

    IF NEW.school_number !~ school_number_pattern THEN
        RAISE EXCEPTION 'Geçersiz school_number formatı: %', NEW.school_number;
    END IF;

    RETURN NEW;
END;
$function$;

-- 5. Update log_all_changes to support user_year comparison
CREATE OR REPLACE FUNCTION "public"."log_all_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
DECLARE
    v_user_id UUID;
    v_old JSONB := NULL;
    v_new JSONB := NULL;
    v_record_id TEXT;
BEGIN
    v_user_id := auth.uid();

    -- 1. FİLTRE: PROFILES (Gereksiz logları engelle)
    IF TG_TABLE_NAME = 'profiles' AND TG_OP = 'UPDATE' THEN
        IF OLD.first_name = NEW.first_name AND 
           OLD.last_name = NEW.last_name AND 
           OLD.school_number = NEW.school_number AND 
           OLD.class = NEW.class AND
           (OLD.user_year IS NOT DISTINCT FROM NEW.user_year) THEN
            RETURN NEW; 
        END IF;
    END IF;

    -- 2. VERİLERİ HAZIRLA
    IF TG_OP = 'INSERT' THEN
        v_new := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        v_old := to_jsonb(OLD);
        v_new := to_jsonb(NEW);
    ELSIF TG_OP = 'DELETE' THEN
        v_old := to_jsonb(OLD);
    END IF;

    -- 3. AKILLI ID TESPİTİ (Hata buradaydı, artık daha kapsayıcı)
    -- Öncelik sırası: id -> key (site_settings için) -> user_id -> unknown
    v_record_id := COALESCE(
        v_new->>'id', 
        v_new->>'key', 
        v_new->>'user_id', 
        v_old->>'id', 
        v_old->>'key', 
        'unknown'
    );

    -- 4. LOG TABLOSUNA YAZ
    INSERT INTO public.activity_logs (
        table_name, operation, record_id, old_data, new_data, changed_by
    )
    VALUES (
        TG_TABLE_NAME, 
        TG_OP, 
        v_record_id, 
        v_old, 
        v_new, 
        v_user_id
    );

    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;

-- 6. Update get_profile_page_extended_data to handle uniqueness/year lookup
CREATE OR REPLACE FUNCTION "public"."get_profile_page_extended_data"(
    "target_school_number" "text",
    "target_year" smallint DEFAULT NULL
) 
RETURNS json
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" TO 'public'
AS $$
DECLARE
    v_data RECORD; 
    v_unlock_date TIMESTAMP; 
    v_is_unlocked BOOLEAN; 
    v_days_left INTEGER; 
    result JSON;
BEGIN
    -- 1. Profili Bul: Belirli yıl varsa onu, yoksa en güncel (büyük) yılı getir.
    SELECT v.*, p.user_year INTO v_data 
    FROM school_data_view v
    JOIN profiles p ON v.id = p.id
    WHERE v.school_number = target_school_number
    AND (target_year IS NULL OR p.user_year = target_year)
    ORDER BY p.user_year DESC NULLS LAST
    LIMIT 1;

    IF NOT FOUND THEN RETURN NULL; END IF;

    -- 2. Nesle Özel Kilit Tarihi: Önce 'graduation_date_2026' gibi anahtara bak, yoksa genele bak.
    SELECT (value)::TIMESTAMP INTO v_unlock_date 
    FROM site_settings 
    WHERE key = 'graduation_date_' || v_data.user_year::text;

    IF v_unlock_date IS NULL THEN
        SELECT (value)::TIMESTAMP INTO v_unlock_date 
        FROM site_settings 
        WHERE key = 'graduation_date';
    END IF;

    -- Tarih hesaplamaları
    v_unlock_date := COALESCE(v_unlock_date, '2099-01-01 00:00:00');
    v_is_unlocked := CURRENT_TIMESTAMP >= v_unlock_date;
    v_days_left := CEIL(EXTRACT(EPOCH FROM (v_unlock_date - CURRENT_TIMESTAMP)) / 86400)::INTEGER;

    -- 3. JSON İnşa Et
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
        'memories', (CASE WHEN v_is_unlocked THEN (
            SELECT COALESCE(json_agg(m), '[]'::json) 
            FROM (
                SELECT t.*, 
                       json_build_object(
                           'first_name', a.first_name, 
                           'last_name', a.last_name, 
                           'school_number', a.school_number, 
                           'class', a.class,
                           'user_year', a.user_year
                       ) as author 
                FROM texts t 
                JOIN profiles a ON t.author_id = a.id 
                WHERE t.recipient_id = v_data.id AND t.is_active = true 
                ORDER BY t.created_at DESC
            ) m
        ) ELSE '[]'::json END), 
        'categories', (CASE WHEN v_is_unlocked THEN (
            SELECT COALESCE(json_agg(c), '[]'::json) 
            FROM (
                SELECT json_build_object('id', sc.id, 'title', sc.title, 'emoji', sc.emoji, 'color', sc.color) as category, 
                COALESCE(pvs.vote_count, 0) as count 
                FROM survey_categories sc 
                LEFT JOIN profile_vote_summary pvs ON sc.id = pvs.category_id AND pvs.voted_for_id = v_data.id 
                WHERE sc.is_active = true 
                ORDER BY count DESC, sc.sort_order ASC
            ) c
        ) ELSE '[]'::json END)
    ) INTO result;
    
    RETURN result;
END;
$$;

-- 7. Update get_dashboard_data_v4 to scope to user_year
CREATE OR REPLACE FUNCTION "public"."get_dashboard_data_v4"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    u_id uuid := auth.uid();
    u_class text;
    u_year smallint;
    u_last_active timestamp with time zone;
    v_written_count int; v_received_count int; v_total_words int; v_last_text_date timestamp with time zone;
    v_class_size int; v_written_unique_count int;
    v_deadline text; v_graduation_date text;
    v_suggested_classmate json;
    res json;
BEGIN
    IF u_id IS NULL THEN RETURN NULL; END IF;
    SELECT class, user_year, last_active INTO u_class, u_year, u_last_active FROM profiles WHERE id = u_id;
    IF u_last_active IS NULL OR u_last_active < (now() - INTERVAL '5 minutes') THEN
        UPDATE profiles SET last_active = now() WHERE id = u_id;
    END IF;
    SELECT value INTO v_deadline FROM site_settings WHERE key = 'deadline';
    SELECT value INTO v_graduation_date FROM site_settings WHERE key = 'graduation_date';
    SELECT count(*), COALESCE(sum(array_length(regexp_split_to_array(content, '\s+'), 1)), 0), max(updated_at) INTO v_written_count, v_total_words, v_last_text_date FROM texts WHERE author_id = u_id AND is_active = true;
    SELECT count(*) INTO v_received_count FROM texts WHERE recipient_id = u_id AND is_active = true;
    
    -- Filter by Year
    SELECT count(*) INTO v_class_size FROM profiles WHERE class = u_class AND user_year IS NOT DISTINCT FROM u_year AND id != u_id;
    
    SELECT count(DISTINCT recipient_id) INTO v_written_unique_count FROM texts t JOIN profiles p ON t.recipient_id = p.id WHERE t.author_id = u_id AND t.is_active = true AND p.class = u_class AND p.user_year IS NOT DISTINCT FROM u_year;
    
    SELECT json_build_object('id', p.id, 'first_name', p.first_name, 'last_name', p.last_name, 'school_number', p.school_number, 'user_year', p.user_year) INTO v_suggested_classmate 
    FROM profiles p 
    WHERE p.class = u_class AND p.user_year IS NOT DISTINCT FROM u_year AND p.id != u_id 
    AND NOT EXISTS (SELECT 1 FROM texts t WHERE t.author_id = u_id AND t.recipient_id = p.id AND t.is_active = true) 
    ORDER BY random() LIMIT 1;
    
    SELECT json_build_object('profile', (SELECT json_build_object('first_name', pr.first_name, 'last_name', pr.last_name, 'class', pr.class, 'school_number', pr.school_number, 'user_year', pr.user_year) FROM profiles pr WHERE pr.id = u_id), 'stats', json_build_object('written_count', v_written_count, 'received_count', v_received_count, 'total_words', v_total_words, 'last_text_date', v_last_text_date), 'progress', json_build_object('required_written', v_written_unique_count, 'required_total', v_class_size, 'percentage', CASE WHEN v_class_size > 0 THEN round((v_written_unique_count::float / v_class_size::float) * 100) ELSE 0 END, 'is_complete', (v_written_unique_count >= v_class_size AND v_class_size > 0)), 'suggestion', v_suggested_classmate, 'survey_stats', (SELECT json_build_object('total', (SELECT count(*)::int FROM survey_categories WHERE is_active = true), 'voted', (SELECT count(*)::int FROM survey_votes WHERE voter_id = u_id))), 'system_info', json_build_object('deadline', v_deadline, 'graduation_date', v_graduation_date)) INTO res;
    RETURN res;
END;
$$;

-- 8. Update get_bulk_user_stats to scope to user_year
CREATE OR REPLACE FUNCTION "public"."get_bulk_user_stats"("user_ids" "uuid"[] DEFAULT NULL::"uuid"[]) RETURNS TABLE("user_id" "uuid", "first_name" "text", "last_name" "text", "class" "text", "level" integer, "email" "text", "total_classmates" integer, "messages_sent_to_classmates" integer, "remaining_classmates" integer, "text_completion_percentage" numeric, "total_survey_categories" integer, "completed_surveys" integer, "remaining_surveys" integer, "survey_completion_percentage" numeric, "is_opted_out" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
DECLARE
    requester_level integer;
BEGIN
    SELECT public.get_my_level() INTO requester_level;
    IF requester_level IS NULL OR requester_level < 100 THEN RAISE EXCEPTION 'Bu işlem için yetkiniz yetersiz. (Min Level: 100)'; END IF;
    RETURN QUERY
    WITH filtered_profiles AS (
        SELECT p.id, p.first_name, p.last_name, p.class, p.user_year, u.email::text, COALESCE(ul.level, 0)::integer as level, CASE WHEN eo.user_id IS NOT NULL THEN true ELSE false END as is_opted_out
        FROM profiles p JOIN auth.users u ON p.id = u.id LEFT JOIN user_levels ul ON ul.id = p.id LEFT JOIN email_opt_outs eo ON eo.user_id = p.id
        WHERE (user_ids IS NULL OR p.id = ANY(user_ids))
    ),
    class_counts AS (
        SELECT p.class, p.user_year, COUNT(*)::integer - 1 AS class_size 
        FROM profiles p 
        GROUP BY p.class, p.user_year
    ),
    text_stats AS (
        SELECT t.author_id AS user_id, COUNT(DISTINCT t.recipient_id)::integer AS messages_sent
        FROM texts t JOIN profiles author ON t.author_id = author.id JOIN profiles recipient ON t.recipient_id = recipient.id
        WHERE t.is_active = true AND author.class = recipient.class AND author.user_year IS NOT DISTINCT FROM recipient.user_year AND author.id <> recipient.id GROUP BY t.author_id
    ),
    survey_stats AS (SELECT sv.voter_id AS user_id, COUNT(DISTINCT sv.category_id)::integer AS completed FROM survey_votes sv GROUP BY sv.voter_id),
    total_surveys AS (SELECT COUNT(*)::integer AS total FROM survey_categories WHERE is_active = true)
    SELECT p.id, p.first_name, p.last_name, p.class, p.level, p.email, COALESCE(cc.class_size, 0)::integer, COALESCE(ts.messages_sent, 0)::integer, GREATEST(COALESCE(cc.class_size, 0) - COALESCE(ts.messages_sent, 0), 0)::integer, CASE WHEN COALESCE(cc.class_size, 0) = 0 THEN 0 ELSE ROUND((COALESCE(ts.messages_sent, 0)::numeric / cc.class_size::numeric) * 100, 2) END, tsur.total::integer, COALESCE(ss.completed, 0)::integer, GREATEST(tsur.total - COALESCE(ss.completed, 0), 0)::integer, CASE WHEN tsur.total = 0 THEN 0 ELSE ROUND((COALESCE(ss.completed, 0)::numeric / tsur.total::numeric) * 100, 2) END, p.is_opted_out
    FROM filtered_profiles p 
    LEFT JOIN class_counts cc ON cc.class = p.class AND cc.user_year IS NOT DISTINCT FROM p.user_year
    LEFT JOIN text_stats ts ON ts.user_id = p.id LEFT JOIN survey_stats ss ON ss.user_id = p.id CROSS JOIN total_surveys tsur
    ORDER BY p.class, p.first_name, p.last_name;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."admin_votes_json"() RETURNS json
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
declare
    user_level int;
begin
    user_level := public.get_my_level();
    if user_level < 50 then
        raise exception 'Yetkisiz eri�im! Bu i�lem i�in en az seviye 50 yetki gereklidir.';
    end if;
    return (
        with stats as (
          select count(*) as total_votes, count(distinct voter_id) as unique_voters, count(distinct voted_for_id) as unique_voted_for
          from public.survey_votes
        ),
        ranked_votes as (
          select v.category_id, json_agg(json_build_object('profile', json_build_object('id', p.id, 'first_name', p.first_name, 'last_name', p.last_name, 'class', p.class, 'school_number', p.school_number, 'user_year', p.user_year), 'count', v.vote_count) order by v.vote_count desc) as votes
          from (select category_id, voted_for_id, count(*) as vote_count from public.survey_votes where voted_for_id is not null group by category_id, voted_for_id) v
          join public.profiles p on p.id = v.voted_for_id
          group by v.category_id
        )
        select json_build_object('stats', (select json_build_object('total_votes', total_votes, 'unique_voters', unique_voters, 'unique_voted_for', unique_voted_for) from stats), 'results', (select coalesce(json_object_agg(category_id, votes), '{}'::json) from ranked_votes))
    );
end;
$$;

-- Update view to include user_year
CREATE OR REPLACE VIEW "public"."school_data_view" WITH ("security_invoker"='on') AS
 SELECT "p"."id", "p"."first_name", "p"."last_name", "p"."school_number", "p"."class", "p"."user_year",
 (SELECT ("count"(*))::integer FROM "public"."texts" "t" WHERE (("t"."recipient_id" = "p"."id") AND ("t"."is_active" = true))) AS "total_texts_received",
 (SELECT ("count"(*))::integer FROM "public"."texts" "t" WHERE (("t"."author_id" = "p"."id") AND ("t"."is_active" = true))) AS "total_texts_written",
 COALESCE((SELECT ("sum"("pvs"."vote_count"))::integer FROM "public"."profile_vote_summary" "pvs" WHERE ("pvs"."voted_for_id" = "p"."id")), 0) AS "total_votes"
 FROM "public"."profiles" "p";

-- Create get_my_year helper
CREATE OR REPLACE FUNCTION "public"."get_my_year"() RETURNS smallint
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$ SELECT user_year FROM public.profiles WHERE id = auth.uid() $$;

-- Update get_school_data
DROP FUNCTION IF EXISTS public.get_school_data(smallint);
DROP FUNCTION IF EXISTS public.get_school_data();

CREATE OR REPLACE FUNCTION public.get_school_data(target_year smallint DEFAULT NULL)
 RETURNS TABLE(
    id uuid, 
    first_name text, 
    last_name text, 
    school_number text, 
    class text, 
    user_year smallint, 
    total_texts_received bigint, 
    total_texts_written bigint, 
    total_votes numeric
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
    v_query_year smallint;
BEGIN
    -- E�er target_year verilmi�se onu kullan, verilmemi�se kullan�c�n�n kendi y�l�n� al
    v_query_year := COALESCE(target_year, public.get_my_year());

    RETURN QUERY
    SELECT
        v.id,
        v.first_name,
        v.last_name,
        v.school_number,
        v.class,
        v.user_year,
        v.total_texts_received::bigint,
        v.total_texts_written::bigint,
        v.total_votes::numeric
    FROM public.school_data_view v
    WHERE (v_query_year IS NULL OR v.user_year = v_query_year) -- Y�l filtresi
    ORDER BY v.class ASC, v.first_name ASC;
END;
$$;

