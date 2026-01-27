-- =====================================================
-- EGL YILLIK - FULL BACKUP (27.01.2026)
-- Optimized Migration File
-- =====================================================

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "hypopg" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "index_advisor" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

-- 2. FUNCTIONS
CREATE OR REPLACE FUNCTION "public"."admin_update_user_level"("target_user_id" "uuid", "new_level" integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
declare
  requesting_user_level int;
  target_current_level int;
begin
  select level into requesting_user_level from user_levels where id = auth.uid();
  requesting_user_level := coalesce(requesting_user_level, 0);
  if requesting_user_level < 50 then
    raise exception 'Bu işlem için yetkiniz yok (En az 50. seviye gerekli)';
  end if;
  select level into target_current_level from user_levels where id = target_user_id;
  target_current_level := coalesce(target_current_level, 0);
  if target_user_id = auth.uid() then
    raise exception 'Kendi seviyenizi değiştiremezsiniz';
  end if;
  if new_level >= requesting_user_level then
    raise exception 'Kendinizle aynı veya daha yüksek bir seviye atayamazsınız';
  end if;
  if target_current_level >= requesting_user_level then
    raise exception 'Sizden daha yüksek veya eşit yetkiye sahip bir kullanıcının seviyesini değiştiremezsiniz';
  end if;
  insert into user_levels (id, level, set_by, set_at, source, updated_at)
  values (target_user_id, new_level, auth.uid(), now(), 'admin_panel_rpc', now())
  on conflict (id) do update
  set level = excluded.level, set_by = excluded.set_by, set_at = excluded.set_at, source = excluded.source, updated_at = excluded.updated_at;
end;
$$;

CREATE OR REPLACE FUNCTION "public"."admin_update_user_profile"("target_user_id" "uuid", "new_first_name" "text", "new_last_name" "text", "new_school_number" "text", "new_class" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
DECLARE
    caller_level INTEGER;
    target_level INTEGER;
BEGIN
    IF auth.uid() = target_user_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Admin kendi profilini bu fonksiyonla güncelleyemez');
    END IF;
    caller_level := get_my_level();
    IF caller_level < 50 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Bu işlem için admin yetkisi gerekli');
    END IF;
    SELECT COALESCE(level, 0) INTO target_level FROM public.user_levels WHERE id = target_user_id;
    IF target_level IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Kullanıcı bulunamadı');
    END IF;
    IF caller_level <= target_level THEN
        RETURN jsonb_build_object('success', false, 'error', 'Bu kullanıcıyı düzenleme yetkiniz yok');
    END IF;
    UPDATE public.profiles
    SET first_name = new_first_name, last_name = new_last_name, school_number = new_school_number, class = new_class, updated_at = NOW()
    WHERE id = target_user_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Profil güncellenemedi');
    END IF;
    RETURN jsonb_build_object('success', true);
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
        raise exception 'Yetkisiz erişim! Bu işlem için en az seviye 50 yetki gereklidir.';
    end if;
    return (
        with stats as (
          select count(*) as total_votes, count(distinct voter_id) as unique_voters, count(distinct voted_for_id) as unique_voted_for
          from public.survey_votes
        ),
        ranked_votes as (
          select v.category_id, json_agg(json_build_object('profile', json_build_object('id', p.id, 'first_name', p.first_name, 'last_name', p.last_name, 'class', p.class, 'school_number', p.school_number), 'count', v.vote_count) order by v.vote_count desc) as votes
          from (select category_id, voted_for_id, count(*) as vote_count from public.survey_votes where voted_for_id is not null group by category_id, voted_for_id) v
          join public.profiles p on p.id = v.voted_for_id
          group by v.category_id
        )
        select json_build_object('stats', (select json_build_object('total_votes', total_votes, 'unique_voters', unique_voters, 'unique_voted_for', unique_voted_for) from stats), 'results', (select coalesce(json_object_agg(category_id, votes), '{}'::json) from ranked_votes))
    );
end;
$$;

CREATE OR REPLACE FUNCTION "public"."check_auth_registration_status"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
DECLARE
    reg_status TEXT;
BEGIN
    SELECT value INTO reg_status FROM public.site_settings WHERE key = 'registration_enabled';
    IF reg_status IS NULL OR reg_status <> 'true' THEN
        RAISE EXCEPTION 'Yeni kayıtlar şu anda kapalıdır.' USING ERRCODE = 'P0001', DETAIL = 'site_settings tablosundaki registration_enabled anahtarı true değil.';
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."check_same_class_vote"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
DECLARE
    voter_class text;
    target_class text;
BEGIN
    IF NEW.voted_for_id IS NULL THEN RETURN NEW; END IF;
    SELECT class INTO voter_class FROM public.profiles WHERE id = NEW.voter_id;
    SELECT class INTO target_class FROM public.profiles WHERE id = NEW.voted_for_id;
    IF voter_class IS NULL OR target_class IS NULL THEN RAISE EXCEPTION 'Profil veya sınıf bilgisi bulunamadı'; END IF;
    IF voter_class <> target_class THEN RAISE EXCEPTION 'Aynı sınıfta olmayan kullanıcıya oy verilemez'; END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."delete_old_error_logs"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
BEGIN
    DELETE FROM public.error_logs WHERE created_at < now() - interval '30 days';
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_admin_overview_stats"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_users_count INTEGER;
    v_texts_count INTEGER;
    v_votes_count INTEGER;
    v_pending_suggestions_count INTEGER;
    v_active_categories_count INTEGER;
    v_total_feedback_count INTEGER;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND level >= 50) THEN RAISE EXCEPTION 'Yetkisiz erişim'; END IF;
    SELECT COUNT(*)::INTEGER INTO v_users_count FROM profiles;
    SELECT COUNT(*)::INTEGER INTO v_texts_count FROM texts;
    SELECT COUNT(*)::INTEGER INTO v_votes_count FROM survey_votes;
    SELECT COUNT(*)::INTEGER INTO v_pending_suggestions_count FROM user_category_suggestions WHERE status = 'pending';
    SELECT COUNT(*)::INTEGER INTO v_active_categories_count FROM survey_categories WHERE is_active = true;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'feedback') THEN
        EXECUTE 'SELECT COUNT(*)::INTEGER FROM feedback' INTO v_total_feedback_count;
    ELSE
        v_total_feedback_count := 0;
    END IF;
    RETURN json_build_object('users_count', v_users_count, 'texts_count', v_texts_count, 'votes_count', v_votes_count, 'pending_suggestions_count', v_pending_suggestions_count, 'active_categories_count', v_active_categories_count, 'total_feedback_count', v_total_feedback_count);
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_admin_users_list"("class_filter" "text" DEFAULT NULL::"text", "search_query" "text" DEFAULT NULL::"text") RETURNS TABLE("id" "uuid", "first_name" "text", "last_name" "text", "school_number" "text", "class" "text", "last_active" timestamp with time zone, "level" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
BEGIN
    IF get_my_level() < 50 THEN RAISE EXCEPTION 'Bu işlem için admin yetkisi gerekli'; END IF;
    RETURN QUERY
    SELECT p.id, p.first_name, p.last_name, p.school_number, p.class, p.last_active, COALESCE(ul.level, 0) as level
    FROM public.profiles p
    LEFT JOIN public.user_levels ul ON p.id = ul.id
    WHERE (class_filter IS NULL OR class_filter = '' OR p.class = class_filter)
      AND (search_query IS NULL OR search_query = '' OR LOWER(p.first_name || ' ' || p.last_name) LIKE '%' || LOWER(search_query) || '%' OR p.school_number::TEXT LIKE '%' || search_query || '%')
    ORDER BY COALESCE(ul.level, 0) DESC, p.last_name ASC;
END;
$$;

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
        SELECT p.id, p.first_name, p.last_name, p.class, u.email::text, COALESCE(ul.level, 0)::integer as level, CASE WHEN eo.user_id IS NOT NULL THEN true ELSE false END as is_opted_out
        FROM profiles p JOIN auth.users u ON p.id = u.id LEFT JOIN user_levels ul ON ul.id = p.id LEFT JOIN email_opt_outs eo ON eo.user_id = p.id
        WHERE (user_ids IS NULL OR p.id = ANY(user_ids))
    ),
    class_counts AS (SELECT p.class, COUNT(*)::integer - 1 AS class_size FROM profiles p GROUP BY p.class),
    text_stats AS (
        SELECT t.author_id AS user_id, COUNT(DISTINCT t.recipient_id)::integer AS messages_sent
        FROM texts t JOIN profiles author ON t.author_id = author.id JOIN profiles recipient ON t.recipient_id = recipient.id
        WHERE t.is_active = true AND author.class = recipient.class AND author.id <> recipient.id GROUP BY t.author_id
    ),
    survey_stats AS (SELECT sv.voter_id AS user_id, COUNT(DISTINCT sv.category_id)::integer AS completed FROM survey_votes sv GROUP BY sv.voter_id),
    total_surveys AS (SELECT COUNT(*)::integer AS total FROM survey_categories WHERE is_active = true)
    SELECT p.id, p.first_name, p.last_name, p.class, p.level, p.email, COALESCE(cc.class_size, 0)::integer, COALESCE(ts.messages_sent, 0)::integer, GREATEST(COALESCE(cc.class_size, 0) - COALESCE(ts.messages_sent, 0), 0)::integer, CASE WHEN COALESCE(cc.class_size, 0) = 0 THEN 0 ELSE ROUND((COALESCE(ts.messages_sent, 0)::numeric / cc.class_size::numeric) * 100, 2) END, tsur.total::integer, COALESCE(ss.completed, 0)::integer, GREATEST(tsur.total - COALESCE(ss.completed, 0), 0)::integer, CASE WHEN tsur.total = 0 THEN 0 ELSE ROUND((COALESCE(ss.completed, 0)::numeric / tsur.total::numeric) * 100, 2) END, p.is_opted_out
    FROM filtered_profiles p LEFT JOIN class_counts cc ON cc.class = p.class LEFT JOIN text_stats ts ON ts.user_id = p.id LEFT JOIN survey_stats ss ON ss.user_id = p.id CROSS JOIN total_surveys tsur
    ORDER BY p.class, p.first_name, p.last_name;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_dashboard_data_v4"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    u_id uuid := auth.uid();
    u_class text;
    u_last_active timestamp with time zone;
    v_written_count int; v_received_count int; v_total_words int; v_last_text_date timestamp with time zone;
    v_class_size int; v_written_unique_count int;
    v_deadline text; v_graduation_date text;
    v_suggested_classmate json;
    res json;
BEGIN
    IF u_id IS NULL THEN RETURN NULL; END IF;
    SELECT class, last_active INTO u_class, u_last_active FROM profiles WHERE id = u_id;
    IF u_last_active IS NULL OR u_last_active < (now() - INTERVAL '5 minutes') THEN
        UPDATE profiles SET last_active = now() WHERE id = u_id;
    END IF;
    SELECT value INTO v_deadline FROM site_settings WHERE key = 'deadline';
    SELECT value INTO v_graduation_date FROM site_settings WHERE key = 'graduation_date';
    SELECT count(*), COALESCE(sum(array_length(regexp_split_to_array(content, '\s+'), 1)), 0), max(updated_at) INTO v_written_count, v_total_words, v_last_text_date FROM texts WHERE author_id = u_id AND is_active = true;
    SELECT count(*) INTO v_received_count FROM texts WHERE recipient_id = u_id AND is_active = true;
    SELECT count(*) INTO v_class_size FROM profiles WHERE class = u_class AND id != u_id;
    SELECT count(DISTINCT recipient_id) INTO v_written_unique_count FROM texts t JOIN profiles p ON t.recipient_id = p.id WHERE t.author_id = u_id AND t.is_active = true AND p.class = u_class;
    SELECT json_build_object('id', p.id, 'first_name', p.first_name, 'last_name', p.last_name, 'school_number', p.school_number) INTO v_suggested_classmate FROM profiles p WHERE p.class = u_class AND p.id != u_id AND NOT EXISTS (SELECT 1 FROM texts t WHERE t.author_id = u_id AND t.recipient_id = p.id AND t.is_active = true) ORDER BY random() LIMIT 1;
    SELECT json_build_object('profile', (SELECT json_build_object('first_name', pr.first_name, 'last_name', pr.last_name, 'class', pr.class, 'school_number', pr.school_number) FROM profiles pr WHERE pr.id = u_id), 'stats', json_build_object('written_count', v_written_count, 'received_count', v_received_count, 'total_words', v_total_words, 'last_text_date', v_last_text_date), 'progress', json_build_object('required_written', v_written_unique_count, 'required_total', v_class_size, 'percentage', CASE WHEN v_class_size > 0 THEN round((v_written_unique_count::float / v_class_size::float) * 100) ELSE 0 END, 'is_complete', (v_written_unique_count >= v_class_size AND v_class_size > 0)), 'suggestion', v_suggested_classmate, 'survey_stats', (SELECT json_build_object('total', (SELECT count(*)::int FROM survey_categories WHERE is_active = true), 'voted', (SELECT count(*)::int FROM survey_votes WHERE voter_id = u_id))), 'system_info', json_build_object('deadline', v_deadline, 'graduation_date', v_graduation_date)) INTO res;
    RETURN res;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_my_level"() RETURNS integer
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$ SELECT level FROM public.user_levels WHERE id = auth.uid() $$;

CREATE OR REPLACE FUNCTION "public"."get_profile_page_extended_data"("target_school_number" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_data RECORD; v_unlock_date TIMESTAMP; v_is_unlocked BOOLEAN; v_days_left INTEGER; result JSON;
BEGIN
    SELECT * INTO v_data FROM school_data_view WHERE school_number = target_school_number;
    IF NOT FOUND THEN RETURN NULL; END IF;
    SELECT (value)::TIMESTAMP INTO v_unlock_date FROM site_settings WHERE key = 'graduation_date';
    v_unlock_date := COALESCE(v_unlock_date, '2099-01-01 00:00:00');
    v_is_unlocked := CURRENT_TIMESTAMP >= v_unlock_date;
    v_days_left := CEIL(EXTRACT(EPOCH FROM (v_unlock_date - CURRENT_TIMESTAMP)) / 86400)::INTEGER;
    SELECT json_build_object('profile', json_build_object('id', v_data.id, 'first_name', v_data.first_name, 'last_name', v_data.last_name, 'school_number', v_data.school_number, 'class', v_data.class), 'receivedCount', v_data.total_texts_received, 'writtenCount', v_data.total_texts_written, 'totalVotes', v_data.total_votes, 'is_unlocked', v_is_unlocked, 'days_until_unlock', GREATEST(0, v_days_left), 'memories', (CASE WHEN v_is_unlocked THEN (SELECT COALESCE(json_agg(m), '[]'::json) FROM (SELECT t.*, json_build_object('first_name', a.first_name, 'last_name', a.last_name, 'school_number', a.school_number, 'class', a.class) as author FROM texts t JOIN profiles a ON t.author_id = a.id WHERE t.recipient_id = v_data.id AND t.is_active = true ORDER BY t.created_at DESC) m) ELSE '[]'::json END), 'categories', (CASE WHEN v_is_unlocked THEN (SELECT COALESCE(json_agg(c), '[]'::json) FROM (SELECT json_build_object('id', sc.id, 'title', sc.title, 'emoji', sc.emoji, 'color', sc.color) as category, COALESCE(pvs.vote_count, 0) as count FROM survey_categories sc LEFT JOIN profile_vote_summary pvs ON sc.id = pvs.category_id AND pvs.voted_for_id = v_data.id WHERE sc.is_active = true ORDER BY count DESC, sc.sort_order ASC) c) ELSE '[]'::json END)) INTO result;
    RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_school_data"() RETURNS TABLE("id" "uuid", "first_name" "text", "last_name" "text", "school_number" "text", "class" "text", "total_texts_received" bigint, "total_texts_written" bigint, "total_votes" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY SELECT v.id, v.first_name, v.last_name, v.school_number, v.class, v.total_texts_received::bigint, v.total_texts_written::bigint, v.total_votes::numeric FROM public.school_data_view v ORDER BY v.class ASC, v.first_name ASC;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SET "search_path" TO 'public'
    AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION "public"."soft_delete_feedback"("feedback_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER SET "search_path" TO 'public', 'pg_catalog'
    AS $$
DECLARE user_level INTEGER;
BEGIN
    SELECT level INTO user_level FROM public.user_levels WHERE id = auth.uid();
    IF user_level IS NULL OR user_level < 50 THEN RAISE EXCEPTION 'Yetkiniz yok'; END IF;
    UPDATE public.feedback SET deleted_at = NOW() WHERE id = feedback_id AND deleted_at IS NULL;
    RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."soft_delete_text"("target_text_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER SET "search_path" TO 'public'
    AS $$
DECLARE v_user_id uuid; v_user_level int; v_author_id uuid; v_messaging_enabled boolean;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Oturum açılmamış.'); END IF;
    SELECT COALESCE(s.value = 'true', false) INTO v_messaging_enabled FROM site_settings s WHERE s.key = 'messaging_enabled';
    SELECT COALESCE(ul.level, 0), t.author_id INTO v_user_level, v_author_id FROM texts t LEFT JOIN user_levels ul ON ul.id = v_user_id WHERE t.id = target_text_id;
    IF v_author_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Metin bulunamadı.'); END IF;
    IF NOT v_messaging_enabled AND v_user_level < 100 THEN RETURN jsonb_build_object('success', false, 'error', 'Mesajlaşma şu anda kapalı.'); END IF;
    IF v_user_id = v_author_id OR v_user_level >= 50 THEN
        UPDATE texts SET is_active = false, updated_at = now() WHERE id = target_text_id;
        RETURN jsonb_build_object('success', true, 'message', 'Metin başarıyla pasife çekildi.');
    END IF;
    RETURN jsonb_build_object('success', false, 'error', 'Bu işlem için yetkiniz yok.');
EXCEPTION WHEN OTHERS THEN RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

CREATE OR REPLACE FUNCTION "public"."sync_user_data_to_metadata"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER SET "search_path" TO 'public', 'auth'
    AS $$
DECLARE _profile_record RECORD; _level_record RECORD;
BEGIN
    INSERT INTO public.user_levels (id, level) VALUES (NEW.id, 0) ON CONFLICT (id) DO NOTHING;
    SELECT first_name, last_name, school_number, class INTO _profile_record FROM public.profiles WHERE id = NEW.id;
    SELECT level INTO _level_record FROM public.user_levels WHERE id = NEW.id;
    UPDATE auth.users SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('first_name', COALESCE(_profile_record.first_name, ''), 'last_name', COALESCE(_profile_record.last_name, ''), 'school_number', COALESCE(_profile_record.school_number, ''), 'class', COALESCE(_profile_record.class, ''), 'level', COALESCE(_level_record.level, 0)) WHERE id = NEW.id;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."update_site_settings_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SET "search_path" TO 'public', 'pg_catalog'
    AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION "public"."validate_profile"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
declare valid_classes text[]; school_number_len int; school_number_pattern text;
begin
    select string_to_array(value, ',') into valid_classes from site_settings where key = 'valid_classes';
    select value::int into school_number_len from site_settings where key = 'school_number_length';
    select value into school_number_pattern from site_settings where key = 'school_number_regex';
    if not (new.class = any(valid_classes)) then raise exception 'Geçersiz class: %', new.class; end if;
    if length(new.school_number) != school_number_len then raise exception 'Geçersiz school_number uzunluğu: %', new.school_number; end if;
    if new.school_number !~ school_number_pattern then raise exception 'Geçersiz school_number formatı: %', new.school_number; end if;
    return new;
end;
$$;

-- 3. TABLES
SET default_tablespace = '';
SET default_table_access_method = "heap";

CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL PRIMARY KEY,
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "school_number" "text" NOT NULL UNIQUE,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "class" "text" DEFAULT '12A'::"text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_active" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "public"."user_levels" (
    "id" "uuid" NOT NULL PRIMARY KEY REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
    "level" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "set_by" "uuid" REFERENCES "public"."profiles"("id"),
    "set_at" timestamp with time zone DEFAULT "now"(),
    "source" "text"
);

CREATE TABLE IF NOT EXISTS "public"."site_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "key" "text" NOT NULL UNIQUE,
    "value" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

CREATE TABLE IF NOT EXISTS "public"."texts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "author_id" "uuid" NOT NULL REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
    "recipient_id" "uuid" NOT NULL REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_active" boolean DEFAULT true NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."survey_categories" (
    "id" "text" NOT NULL PRIMARY KEY,
    "title" "text" NOT NULL,
    "emoji" "text" NOT NULL,
    "description" "text" NOT NULL,
    "color" "text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_user_suggested" boolean DEFAULT false,
    "suggested_by" "uuid" REFERENCES "public"."profiles"("id")
);

CREATE TABLE IF NOT EXISTS "public"."survey_votes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "voter_id" "uuid" NOT NULL REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
    "voted_for_id" "uuid" REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
    "category_id" "text" NOT NULL REFERENCES "public"."survey_categories"("id") ON UPDATE CASCADE ON DELETE RESTRICT,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    UNIQUE ("voter_id", "category_id")
);

CREATE TABLE IF NOT EXISTS "public"."user_category_suggestions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "title" "text" NOT NULL,
    "emoji" "text" NOT NULL,
    "description" "text" NOT NULL,
    "color" "text" DEFAULT 'from-purple-500 to-pink-500'::"text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "suggested_by" "uuid" NOT NULL REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
    "admin_note" "text",
    "reviewed_by" "uuid" REFERENCES "public"."profiles"("id"),
    "reviewed_at" timestamp with time zone,
    "approved_category_id" "text" REFERENCES "public"."survey_categories"("id") ON DELETE SET NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_category_suggestions_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."email_opt_outs" (
    "user_id" "uuid" NOT NULL PRIMARY KEY REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
    "created_at" timestamp with time zone DEFAULT "now"()
);

CREATE TABLE IF NOT EXISTS "public"."feedback" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "user_id" "uuid" REFERENCES "public"."profiles"("id") ON DELETE SET NULL,
    "type" "text" NOT NULL,
    "message" "text" NOT NULL,
    "page_url" "text",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    CONSTRAINT "feedback_type_check" CHECK (("type" = ANY (ARRAY['bug'::"text", 'suggestion'::"text", 'complaint'::"text", 'other'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."error_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "user_id" "uuid" REFERENCES "public"."profiles"("id") ON DELETE SET NULL,
    "error_message" "text" NOT NULL,
    "stack_trace" "text",
    "page_url" "text",
    "user_agent" "text",
    "severity" "text" DEFAULT 'error'::"text",
    "is_resolved" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);

-- 4. VIEWS
CREATE OR REPLACE VIEW "public"."profile_vote_summary" WITH ("security_invoker"='true') AS
 SELECT "sv"."voted_for_id", "sv"."category_id", "p_voter"."class" AS "voter_class", "count"(*) AS "vote_count"
 FROM ("public"."survey_votes" "sv" JOIN "public"."profiles" "p_voter" ON (("sv"."voter_id" = "p_voter"."id")))
 GROUP BY "sv"."voted_for_id", "sv"."category_id", "p_voter"."class";

CREATE OR REPLACE VIEW "public"."school_data_view" WITH ("security_invoker"='on') AS
 SELECT "id", "first_name", "last_name", "school_number", "class", (SELECT ("count"(*))::integer FROM "public"."texts" "t" WHERE (("t"."recipient_id" = "p"."id") AND ("t"."is_active" = true))) AS "total_texts_received", (SELECT ("count"(*))::integer FROM "public"."texts" "t" WHERE (("t"."author_id" = "p"."id") AND ("t"."is_active" = true))) AS "total_texts_written", COALESCE((SELECT ("sum"("pvs"."vote_count"))::integer FROM "public"."profile_vote_summary" "pvs" WHERE ("pvs"."voted_for_id" = "p"."id")), 0) AS "total_votes"
 FROM "public"."profiles" "p";

-- 5. INDEXES
CREATE INDEX "idx_error_logs_created_at" ON "public"."error_logs" ("created_at" DESC);
CREATE INDEX "idx_error_logs_is_resolved" ON "public"."error_logs" ("is_resolved");
CREATE INDEX "idx_error_logs_user_id" ON "public"."error_logs" ("user_id");
CREATE INDEX "idx_feedback_created_at" ON "public"."feedback" ("created_at" DESC);
CREATE INDEX "idx_survey_votes_category_id" ON "public"."survey_votes" ("category_id");
CREATE INDEX "idx_survey_votes_voted_for_id" ON "public"."survey_votes" ("voted_for_id");
CREATE INDEX "idx_survey_votes_voter_id" ON "public"."survey_votes" ("voter_id");
CREATE INDEX "idx_texts_author_id" ON "public"."texts" ("author_id");
CREATE INDEX "idx_user_category_suggestions_status" ON "public"."user_category_suggestions" ("status");
CREATE INDEX "idx_user_category_suggestions_suggested_by" ON "public"."user_category_suggestions" ("suggested_by");
CREATE INDEX "texts_recipient_id_idx" ON "public"."texts" ("recipient_id");

-- 6. TRIGGERS
CREATE OR REPLACE TRIGGER "site_settings_updated_at" BEFORE UPDATE ON "public"."site_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_site_settings_updated_at"();
CREATE OR REPLACE TRIGGER "texts_updated_at" BEFORE UPDATE ON "public"."texts" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();
CREATE OR REPLACE TRIGGER "trg_check_same_class_vote" BEFORE INSERT OR UPDATE ON "public"."survey_votes" FOR EACH ROW EXECUTE FUNCTION "public"."check_same_class_vote"();
CREATE OR REPLACE TRIGGER "trg_sync_levels_to_metadata" AFTER INSERT OR UPDATE OF "level" ON "public"."user_levels" FOR EACH ROW EXECUTE FUNCTION "public"."sync_user_data_to_metadata"();
CREATE OR REPLACE TRIGGER "trg_sync_profiles_to_metadata" AFTER INSERT OR UPDATE OF "first_name", "last_name", "school_number", "class" ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."sync_user_data_to_metadata"();
CREATE OR REPLACE TRIGGER "trg_validate_profile" BEFORE INSERT OR UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."validate_profile"();

-- 7. POLICIES (RLS)
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_insert_self" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("id" = (SELECT "auth"."uid"())));
CREATE POLICY "profiles_select_all" ON "public"."profiles" FOR SELECT TO "authenticated" USING (true);

ALTER TABLE "public"."user_levels" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_levels_select_self" ON "public"."user_levels" FOR SELECT TO "authenticated" USING (("public"."get_my_level"() >= 50));

ALTER TABLE "public"."site_settings" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site_settings_admin_delete" ON "public"."site_settings" FOR DELETE TO "authenticated" USING (((SELECT "public"."get_my_level"()) >= 100));
CREATE POLICY "site_settings_admin_insert" ON "public"."site_settings" FOR INSERT TO "authenticated" WITH CHECK (((SELECT "public"."get_my_level"()) >= 100));
CREATE POLICY "site_settings_admin_update" ON "public"."site_settings" FOR UPDATE TO "authenticated" USING (((SELECT "public"."get_my_level"()) >= 100)) WITH CHECK (((SELECT "public"."get_my_level"()) >= 100));
CREATE POLICY "site_settings_select_policy" ON "public"."site_settings" FOR SELECT USING (true);

ALTER TABLE "public"."texts" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "texts_insert_policy" ON "public"."texts" FOR INSERT TO "authenticated" WITH CHECK ((("author_id" = (SELECT "auth"."uid"())) AND ((SELECT "s"."value" FROM "public"."site_settings" "s" WHERE ("s"."key" = 'messaging_enabled'::"text")) = 'true'::"text")));
CREATE POLICY "texts_select_policy" ON "public"."texts" FOR SELECT TO "authenticated" USING ((("is_active" = true) AND (("author_id" = (SELECT "auth"."uid"())) OR ((SELECT "public"."get_my_level"()) >= 50))));
CREATE POLICY "texts_update_policy" ON "public"."texts" FOR UPDATE TO "authenticated" USING ((("is_active" = true) AND ("author_id" = (SELECT "auth"."uid"())))) WITH CHECK ((("is_active" = true) AND ("author_id" = (SELECT "auth"."uid"())) AND ((SELECT "s"."value" FROM "public"."site_settings" "s" WHERE ("s"."key" = 'messaging_enabled'::"text")) = 'true'::"text")));

ALTER TABLE "public"."survey_categories" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "survey_categories_admin_delete" ON "public"."survey_categories" FOR DELETE TO "authenticated" USING (("public"."get_my_level"() >= 50));
CREATE POLICY "survey_categories_admin_insert" ON "public"."survey_categories" FOR INSERT TO "authenticated" WITH CHECK (("public"."get_my_level"() >= 50));
CREATE POLICY "survey_categories_admin_update" ON "public"."survey_categories" FOR UPDATE TO "authenticated" USING (("public"."get_my_level"() >= 50)) WITH CHECK (("public"."get_my_level"() >= 50));
CREATE POLICY "survey_categories_select_unified" ON "public"."survey_categories" FOR SELECT TO "authenticated" USING ((("is_active" = true) OR ("public"."get_my_level"() >= 50)));

ALTER TABLE "public"."survey_votes" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "survey_votes_insert_policy" ON "public"."survey_votes" FOR INSERT TO "authenticated" WITH CHECK ((("voter_id" = (SELECT "auth"."uid"())) AND ((SELECT "s"."value" FROM "public"."site_settings" "s" WHERE ("s"."key" = 'voting_enabled'::"text")) = 'true'::"text")));
CREATE POLICY "survey_votes_select_policy" ON "public"."survey_votes" FOR SELECT TO "authenticated" USING ((("voter_id" = (SELECT "auth"."uid"())) OR ((SELECT "public"."get_my_level"()) >= 50)));
CREATE POLICY "survey_votes_update_policy" ON "public"."survey_votes" FOR UPDATE TO "authenticated" USING (("voter_id" = (SELECT "auth"."uid"()))) WITH CHECK ((("voter_id" = (SELECT "auth"."uid"())) AND ((SELECT "s"."value" FROM "public"."site_settings" "s" WHERE ("s"."key" = 'voting_enabled'::"text")) = 'true'::"text")));

ALTER TABLE "public"."user_category_suggestions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "suggestions_admin_select" ON "public"."user_category_suggestions" FOR SELECT TO "authenticated" USING (((SELECT "public"."get_my_level"()) >= 50));
CREATE POLICY "suggestions_admin_update" ON "public"."user_category_suggestions" FOR UPDATE TO "authenticated" USING (((SELECT "public"."get_my_level"()) >= 50)) WITH CHECK (((SELECT "public"."get_my_level"()) >= 50));
CREATE POLICY "suggestions_insert" ON "public"."user_category_suggestions" FOR INSERT TO "authenticated" WITH CHECK (("suggested_by" = (SELECT "auth"."uid"())));

ALTER TABLE "public"."email_opt_outs" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view all opt-outs" ON "public"."email_opt_outs" FOR SELECT TO "authenticated" USING ((EXISTS (SELECT 1 FROM "public"."user_levels" WHERE (("user_levels"."id" = "auth"."uid"()) AND ("user_levels"."level" >= 100)))));
CREATE POLICY "Users can delete their own opt-out" ON "public"."email_opt_outs" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));
CREATE POLICY "Users can insert their own opt-out" ON "public"."email_opt_outs" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));
CREATE POLICY "Users can update their own opt-out" ON "public"."email_opt_outs" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));

ALTER TABLE "public"."feedback" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view active feedback" ON "public"."feedback" FOR SELECT TO "authenticated" USING ((("deleted_at" IS NULL) AND ((SELECT "public"."get_my_level"()) >= 50)));
CREATE POLICY "Authenticated users can insert feedback" ON "public"."feedback" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = (SELECT "auth"."uid"())));

ALTER TABLE "public"."error_logs" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can delete error logs" ON "public"."error_logs" FOR DELETE TO "authenticated" USING (("public"."get_my_level"() >= 1000));
CREATE POLICY "Admins can update error logs" ON "public"."error_logs" FOR UPDATE TO "authenticated" USING (("public"."get_my_level"() >= 1000));
CREATE POLICY "Admins can view error logs" ON "public"."error_logs" FOR SELECT TO "authenticated" USING (("public"."get_my_level"() >= 1000));
CREATE POLICY "Anyone can insert error logs" ON "public"."error_logs" FOR INSERT WITH CHECK (true);

-- 8. GRANTS
GRANT USAGE ON SCHEMA "public" TO "postgres", "anon", "authenticated", "service_role";
GRANT ALL ON ALL FUNCTIONS IN SCHEMA "public" TO "postgres", "anon", "authenticated", "service_role";
GRANT ALL ON ALL TABLES IN SCHEMA "public" TO "postgres", "anon", "authenticated", "service_role";
GRANT ALL ON ALL SEQUENCES IN SCHEMA "public" TO "postgres", "anon", "authenticated", "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres", "anon", "authenticated", "service_role";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres", "anon", "authenticated", "service_role";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres", "anon", "authenticated", "service_role";

