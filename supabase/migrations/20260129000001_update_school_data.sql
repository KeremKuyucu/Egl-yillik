
-- 1. Update school_data_view to include user_year
CREATE OR REPLACE VIEW "public"."school_data_view" WITH ("security_invoker"='on') AS
 SELECT "p"."id", "p"."first_name", "p"."last_name", "p"."school_number", "p"."class", "p"."user_year",
 (SELECT ("count"(*))::integer FROM "public"."texts" "t" WHERE (("t"."recipient_id" = "p"."id") AND ("t"."is_active" = true))) AS "total_texts_received",
 (SELECT ("count"(*))::integer FROM "public"."texts" "t" WHERE (("t"."author_id" = "p"."id") AND ("t"."is_active" = true))) AS "total_texts_written",
 COALESCE((SELECT ("sum"("pvs"."vote_count"))::integer FROM "public"."profile_vote_summary" "pvs" WHERE ("pvs"."voted_for_id" = "p"."id")), 0) AS "total_votes"
 FROM "public"."profiles" "p";

-- 2. Create get_my_year helper
CREATE OR REPLACE FUNCTION "public"."get_my_year"() RETURNS smallint
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$ SELECT user_year FROM public.profiles WHERE id = auth.uid() $$;

-- 3. Update get_school_data to support year filtering
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
    -- Eğer target_year verilmişse onu kullan, verilmemişse kullanıcının kendi yılını al
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
    WHERE (v_query_year IS NULL OR v.user_year = v_query_year) -- Yıl filtresi
    ORDER BY v.class ASC, v.first_name ASC;
END;
$$;

-- 4. Update get_dashboard_data_v4 to include user_year
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

-- 5. Update admin_votes_json to include user_year
CREATE OR REPLACE FUNCTION "public"."admin_votes_json"() RETURNS json
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
declare
    user_level int;
begin
    user_level := public.get_my_level();
    if user_level < 50 then
        raise exception 'Yetkisiz erişim! Bu işlem için en az seviye 50 yetki gereklidir.';
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
