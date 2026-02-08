


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


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "hypopg" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "index_advisor" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."permission_effect" AS ENUM (
    'allow',
    'deny'
);


ALTER TYPE "public"."permission_effect" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_add_role_permission"("p_role_key" "text", "p_perm_key" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
DECLARE
  requester_max int;
  role_level int;
BEGIN
  PERFORM public.require_permission('admin.role_permissions.update');

  requester_max := public.get_requester_max_role_level();

  SELECT COALESCE(level, 0)::int INTO role_level
  FROM public.roles
  WHERE key = p_role_key;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ROLE_NOT_FOUND';
  END IF;

  IF role_level >= requester_max THEN
    RAISE EXCEPTION 'CANNOT_MODIFY_ROLE_AT_OR_ABOVE_YOUR_LEVEL';
  END IF;

  -- perm var mı? FK zaten kontrol eder
  INSERT INTO public.role_permissions(role_key, perm_key)
  VALUES (p_role_key, p_perm_key)
  ON CONFLICT (role_key, perm_key) DO NOTHING;
END;
$$;


ALTER FUNCTION "public"."admin_add_role_permission"("p_role_key" "text", "p_perm_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_add_user_role"("target_user_id" "uuid", "add_role_key" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
DECLARE
  requester_max_level int;
  target_max_level int;
  add_role_level int;
BEGIN
  PERFORM public.require_permission('admin.roles.update');

  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'UNAUTHENTICATED';
  END IF;

  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Kendi rolünüzü değiştiremezsiniz';
  END IF;

  SELECT COALESCE(MAX(r.level), 0)
  INTO requester_max_level
  FROM public.user_roles ur
  JOIN public.roles r ON r.key = ur.role_key
  WHERE ur.user_id = auth.uid();

  SELECT COALESCE(MAX(r.level), 0)
  INTO target_max_level
  FROM public.user_roles ur
  JOIN public.roles r ON r.key = ur.role_key
  WHERE ur.user_id = target_user_id;

  SELECT r.level
  INTO add_role_level
  FROM public.roles r
  WHERE r.key = add_role_key;

  IF add_role_level IS NULL THEN
    RAISE EXCEPTION 'Geçersiz rol: %', add_role_key;
  END IF;

  -- hedef senden eşit/üst ise dokunma
  IF target_max_level >= requester_max_level THEN
    RAISE EXCEPTION 'Sizden daha yüksek veya eşit yetkiye sahip bir kullanıcının rolünü değiştiremezsiniz';
  END IF;

  -- eklemek istediğin rol senden eşit/üst olamaz
  IF add_role_level >= requester_max_level THEN
    RAISE EXCEPTION 'Kendinizle aynı veya daha yüksek bir rol atayamazsınız';
  END IF;

  INSERT INTO public.user_roles(user_id, role_key, created_at, set_by, source)
  VALUES (target_user_id, add_role_key, now(), auth.uid(), 'admin_panel')
  ON CONFLICT (user_id, role_key) DO NOTHING;
END;
$$;


ALTER FUNCTION "public"."admin_add_user_role"("target_user_id" "uuid", "add_role_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_create_role"("p_key" "text", "p_label" "text", "p_level" smallint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
DECLARE
  requester_max int;
BEGIN
  PERFORM public.require_permission('admin.roles.create');

  requester_max := public.get_requester_max_role_level();

  IF p_level IS NULL THEN
    RAISE EXCEPTION 'ROLE_LEVEL_REQUIRED';
  END IF;

  -- Discord: kendi seviyene eşit/üst rol oluşturamazsın
  IF p_level >= requester_max THEN
    RAISE EXCEPTION 'CANNOT_CREATE_ROLE_AT_OR_ABOVE_YOUR_LEVEL';
  END IF;

  INSERT INTO public.roles(key, label, level)
  VALUES (p_key, p_label, p_level);
END;
$$;


ALTER FUNCTION "public"."admin_create_role"("p_key" "text", "p_label" "text", "p_level" smallint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_delete_role"("p_key" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
DECLARE
  requester_max int;
  role_level int;
BEGIN
  PERFORM public.require_permission('admin.roles.delete');

  requester_max := public.get_requester_max_role_level();

  SELECT COALESCE(level, 0)::int INTO role_level
  FROM public.roles
  WHERE key = p_key;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ROLE_NOT_FOUND';
  END IF;

  IF role_level >= requester_max THEN
    RAISE EXCEPTION 'CANNOT_DELETE_ROLE_AT_OR_ABOVE_YOUR_LEVEL';
  END IF;

  DELETE FROM public.roles WHERE key = p_key;
END;
$$;


ALTER FUNCTION "public"."admin_delete_role"("p_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_get_user_roles"("target_user_id" "uuid") RETURNS TABLE("role_key" "text", "level" integer)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
BEGIN
  PERFORM public.require_permission('admin.roles.read');

  RETURN QUERY
  SELECT r.key, r.level::int
  FROM public.user_roles ur
  JOIN public.roles r ON r.key = ur.role_key
  WHERE ur.user_id = target_user_id
  ORDER BY r.level DESC, r.key ASC;
END;
$$;


ALTER FUNCTION "public"."admin_get_user_roles"("target_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_remove_role_permission"("p_role_key" "text", "p_perm_key" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
DECLARE
  requester_max int;
  role_level int;
BEGIN
  PERFORM public.require_permission('admin.role_permissions.update');

  requester_max := public.get_requester_max_role_level();

  SELECT COALESCE(level, 0)::int INTO role_level
  FROM public.roles
  WHERE key = p_role_key;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ROLE_NOT_FOUND';
  END IF;

  IF role_level >= requester_max THEN
    RAISE EXCEPTION 'CANNOT_MODIFY_ROLE_AT_OR_ABOVE_YOUR_LEVEL';
  END IF;

  DELETE FROM public.role_permissions
  WHERE role_key = p_role_key
    AND perm_key = p_perm_key;
END;
$$;


ALTER FUNCTION "public"."admin_remove_role_permission"("p_role_key" "text", "p_perm_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_remove_user_role"("target_user_id" "uuid", "remove_role_key" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
DECLARE
  requester_max_level int;
  target_max_level int;
  remove_role_level int;
BEGIN
  PERFORM public.require_permission('admin.roles.update');

  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'UNAUTHENTICATED';
  END IF;

  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Kendi rolünüzü değiştiremezsiniz';
  END IF;

  SELECT COALESCE(MAX(r.level), 0)
  INTO requester_max_level
  FROM public.user_roles ur
  JOIN public.roles r ON r.key = ur.role_key
  WHERE ur.user_id = auth.uid();

  SELECT COALESCE(MAX(r.level), 0)
  INTO target_max_level
  FROM public.user_roles ur
  JOIN public.roles r ON r.key = ur.role_key
  WHERE ur.user_id = target_user_id;

  SELECT r.level
  INTO remove_role_level
  FROM public.roles r
  WHERE r.key = remove_role_key;

  IF remove_role_level IS NULL THEN
    RAISE EXCEPTION 'Geçersiz rol: %', remove_role_key;
  END IF;

  -- hedef senden eşit/üst ise dokunma
  IF target_max_level >= requester_max_level THEN
    RAISE EXCEPTION 'Sizden daha yüksek veya eşit yetkiye sahip bir kullanıcının rolünü değiştiremezsiniz';
  END IF;

  -- kaldıramayacağın rol: senden eşit/üst seviyede
  IF remove_role_level >= requester_max_level THEN
    RAISE EXCEPTION 'Kendinizle aynı veya daha yüksek bir rolü kaldıramazsınız';
  END IF;

  DELETE FROM public.user_roles
  WHERE user_id = target_user_id
    AND role_key = remove_role_key;
END;
$$;


ALTER FUNCTION "public"."admin_remove_user_role"("target_user_id" "uuid", "remove_role_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_update_role"("p_key" "text", "p_label" "text", "p_level" smallint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
DECLARE
  requester_max int;
  current_level int;
BEGIN
  PERFORM public.require_permission('admin.roles.update');

  requester_max := public.get_requester_max_role_level();

  SELECT COALESCE(level, 0)::int INTO current_level
  FROM public.roles
  WHERE key = p_key;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ROLE_NOT_FOUND';
  END IF;

  -- Üst/eşit rolü düzenleyemezsin
  IF current_level >= requester_max THEN
    RAISE EXCEPTION 'CANNOT_EDIT_ROLE_AT_OR_ABOVE_YOUR_LEVEL';
  END IF;

  IF p_level IS NULL THEN
    RAISE EXCEPTION 'ROLE_LEVEL_REQUIRED';
  END IF;

  IF p_level >= requester_max THEN
    RAISE EXCEPTION 'CANNOT_SET_ROLE_LEVEL_AT_OR_ABOVE_YOUR_LEVEL';
  END IF;

  UPDATE public.roles
  SET label = COALESCE(p_label, label),
      level = p_level
  WHERE key = p_key;
END;
$$;


ALTER FUNCTION "public"."admin_update_role"("p_key" "text", "p_label" "text", "p_level" smallint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_update_user_profile"("target_user_id" "uuid", "new_first_name" "text", "new_last_name" "text", "new_school_number" "text", "new_class" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
DECLARE
  caller_level integer;
  target_level integer;
  v_rows integer;
BEGIN

perform public.require_permission('admin.users.update');

  SELECT COALESCE(MAX(r.level), 0)
  INTO caller_level
  FROM public.user_roles ur
  JOIN public.roles r ON r.key = ur.role_key
  WHERE ur.user_id = auth.uid();

  -- Hedef kullanıcı profili var mı?
  IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = target_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Kullanıcı bulunamadı');
  END IF;

  -- Hedefin level'ı (yoksa 0)
  SELECT ul.level INTO target_level
  FROM public.user_levels ul
  WHERE ul.id = target_user_id;

  IF NOT FOUND THEN
    target_level := 0;
  END IF;

  IF caller_level <= target_level THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bu kullanıcıyı düzenleme yetkiniz yok');
  END IF;

  UPDATE public.profiles
  SET
    first_name = new_first_name,
    last_name = new_last_name,
    school_number = new_school_number,
    class = new_class
  WHERE id = target_user_id;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profil güncellenemedi');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;


ALTER FUNCTION "public"."admin_update_user_profile"("target_user_id" "uuid", "new_first_name" "text", "new_last_name" "text", "new_school_number" "text", "new_class" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_auth_registration_status"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
DECLARE
    reg_status TEXT;
BEGIN
    -- site_settings tablosundan registration_enabled anahtarının değerini çek
    SELECT value INTO reg_status 
    FROM public.site_settings 
    WHERE key = 'registration_enabled';

    -- Eğer kayıt "true" değilse işlemi engelle ve hata döndür
    -- (null olma ihtimaline karşı coalesce veya doğrudan kontrol)
    IF reg_status IS NULL OR reg_status <> 'true' THEN
        RAISE EXCEPTION 'Yeni kayıtlar şu anda kapalıdır.' 
        USING ERRCODE = 'P0001',
              DETAIL = 'site_settings tablosundaki registration_enabled anahtarı true değil.';
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_auth_registration_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_graduation_deadline"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
DECLARE
  v_user_id uuid;
  v_user_year smallint;
  v_deadline timestamptz;
BEGIN
  -- Kullanıcıyı bul
  IF TG_TABLE_NAME = 'texts' THEN
    v_user_id := COALESCE(NEW.author_id, OLD.author_id);
  ELSIF TG_TABLE_NAME = 'survey_votes' THEN
    v_user_id := COALESCE(NEW.voter_id, OLD.voter_id);
  ELSE
    RAISE EXCEPTION 'Unsupported table: %', TG_TABLE_NAME;
  END IF;

  -- Yılı çek
  SELECT user_year INTO v_user_year
  FROM public.profiles
  WHERE id = v_user_id;

  -- Önce yıl bazlı deadline
  IF v_user_year IS NOT NULL THEN
    SELECT value::timestamptz
    INTO v_deadline
    FROM public.site_settings
    WHERE key = 'graduation_date_' || v_user_year::text;
  END IF;

  -- Yoksa global deadline
  IF v_deadline IS NULL THEN
    SELECT value::timestamptz
    INTO v_deadline
    FROM public.site_settings
    WHERE key = 'graduation_date';
  END IF;

  -- Hâlâ yoksa → fail closed
  IF v_deadline IS NULL THEN
    RAISE EXCEPTION 'Mezuniyet tarihi tanımlı değil.';
  END IF;

  -- Süre geçtiyse kilitle
  IF now() > v_deadline THEN
    RAISE EXCEPTION 'Mezuniyet tarihi (%) geçtiği için işlem yapılamaz.', v_deadline;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_graduation_deadline"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_same_class_vote"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
DECLARE
    voter_info RECORD;
    target_info RECORD;
    self_vote_count integer;
BEGIN
    ------------------------------------------------------------------
    -- SELF VOTE LİMİTİ (farklı kategorilerde max 3)
    ------------------------------------------------------------------
    IF NEW.voted_for_id IS NOT NULL
       AND NEW.voter_id = NEW.voted_for_id THEN

        SELECT COUNT(DISTINCT category_id)
        INTO self_vote_count
        FROM public.survey_votes
        WHERE voter_id = NEW.voter_id
          AND voted_for_id = NEW.voter_id
          -- UPDATE senaryosunda kendini saymaması için
          AND (TG_OP = 'INSERT' OR id <> OLD.id);

        IF self_vote_count >= 3 THEN
            RAISE EXCEPTION
                'En fazla 3 farklı kategoride kendinize oy verebilirsiniz.';
        END IF;
    END IF;

    ------------------------------------------------------------------
    -- Manuel giriş (custom option)
    ------------------------------------------------------------------
    IF NEW.voted_for_id IS NULL THEN
        RETURN NEW;
    END IF;

    ------------------------------------------------------------------
    -- Profil bilgileri
    ------------------------------------------------------------------
    SELECT class, user_year
    INTO voter_info
    FROM public.profiles
    WHERE id = NEW.voter_id;

    SELECT class, user_year
    INTO target_info
    FROM public.profiles
    WHERE id = NEW.voted_for_id;

    IF voter_info IS NULL OR target_info IS NULL THEN
        RAISE EXCEPTION 'Profil bilgisi bulunamadı.';
    END IF;

    ------------------------------------------------------------------
    -- Yıl (nesil) kontrolü
    ------------------------------------------------------------------
    IF voter_info.user_year <> target_info.user_year THEN
        RAISE EXCEPTION
            'Farklı mezuniyet yılındaki (Nesil: %) kullanıcıya oy verilemez.',
            target_info.user_year;
    END IF;

    ------------------------------------------------------------------
    -- Sınıf kontrolü
    ------------------------------------------------------------------
    IF voter_info.class <> target_info.class THEN
        RAISE EXCEPTION
            'Sadece kendi sınıfınızdaki (%) kişilere oy verebilirsiniz.',
            voter_info.class;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_same_class_vote"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_system_logs"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
BEGIN
    DELETE FROM public.activity_logs 
    WHERE changed_at < now() - interval '14 days';
    
    DELETE FROM public.profile_last_active_log
    WHERE last_active_at < now() - interval '30 days';
END;
$$;


ALTER FUNCTION "public"."cleanup_system_logs"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."complete_profile"("p_first_name" "text", "p_last_name" "text", "p_school_number" "text", "p_class_room" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
DECLARE
  v_uid uuid;
  v_constraint text;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Oturum bulunamadı');
  END IF;

  -- hızlı boş kontrol (asıl validasyon trigger'da)
  IF COALESCE(btrim(p_first_name), '') = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ad gerekli');
  END IF;

  IF COALESCE(btrim(p_last_name), '') = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Soyad gerekli');
  END IF;

  IF COALESCE(btrim(p_school_number), '') = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Okul numarası gerekli');
  END IF;

  IF COALESCE(btrim(p_class_room), '') = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sınıf gerekli');
  END IF;

  -- profil zaten var mı? (pk çakışmasını önceden yakala)
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = v_uid) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profil zaten oluşturulmuş.');
  END IF;

  BEGIN
    INSERT INTO public.profiles (id, first_name, last_name, school_number, class)
    VALUES (
      v_uid,
      btrim(p_first_name),
      btrim(p_last_name),
      btrim(p_school_number),
      btrim(p_class_room)
    );

    RETURN jsonb_build_object('success', true);

  EXCEPTION
    WHEN unique_violation THEN
      GET STACKED DIAGNOSTICS v_constraint = CONSTRAINT_NAME;

      IF v_constraint = 'profiles_school_number_year_unique' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Bu okul numarası bu dönem için zaten alınmış.');
      ELSIF v_constraint = 'profiles_pkey' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Profil zaten oluşturulmuş.');
      ELSE
        RETURN jsonb_build_object('success', false, 'error', 'Bu kayıt zaten mevcut.');
      END IF;

    WHEN foreign_key_violation THEN
      -- auth.users satırı yoksa (normalde signup olmadan gelmez ama yine de)
      RETURN jsonb_build_object('success', false, 'error', 'Kullanıcı kaydı bulunamadı.');

    WHEN others THEN
      -- validate_profile trigger mesajlarını UI'ya taşımak istiyorsan:
      RETURN jsonb_build_object('success', false, 'error', sqlerrm);
      -- daha kapalı istersen sqlerrm yerine genel mesaj dön.
  END;
END;
$$;


ALTER FUNCTION "public"."complete_profile"("p_first_name" "text", "p_last_name" "text", "p_school_number" "text", "p_class_room" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_texts_same_year"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  author_year    smallint;
  recipient_year smallint;
BEGIN
  -- author user_year
  SELECT p.user_year
    INTO author_year
  FROM public.profiles p
  WHERE p.id = NEW.author_id;

  IF author_year IS NULL THEN
    RAISE EXCEPTION 'author_id için profil yok veya user_year NULL';
  END IF;

  -- recipient user_year
  SELECT p.user_year
    INTO recipient_year
  FROM public.profiles p
  WHERE p.id = NEW.recipient_id;

  IF recipient_year IS NULL THEN
    RAISE EXCEPTION 'recipient_id için profil yok veya user_year NULL';
  END IF;

  -- same year check
  IF author_year IS DISTINCT FROM recipient_year THEN
    RAISE EXCEPTION 'Farklı yıllar arasında mesaj gönderilemez (author_year=%, recipient_year=%)',
      author_year, recipient_year;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."enforce_texts_same_year"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_activity_logs_latest"("p_limit" integer DEFAULT 100) RETURNS TABLE("id" "uuid", "table_name" "text", "operation" "text", "record_id" "text", "old_data" "jsonb", "new_data" "jsonb", "changed_at" timestamp with time zone, "changed_by" "uuid", "profile_first_name" "text", "profile_last_name" "text", "profile_class" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
BEGIN
  -- Yetki kontrolü (auth + permission içeride)
  PERFORM public.require_permission('system.logs.read');

  RETURN QUERY
  SELECT
    al.id,
    al.table_name,
    al.operation,
    al.record_id,
    al.old_data,
    al.new_data,
    al.changed_at,
    al.changed_by,
    p.first_name,
    p.last_name,
    p.class
  FROM public.activity_logs al
  LEFT JOIN public.profiles p
    ON p.id = al.changed_by
  ORDER BY al.changed_at DESC
  LIMIT LEAST(GREATEST(p_limit, 1), 500);
END;
$$;


ALTER FUNCTION "public"."get_activity_logs_latest"("p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_admin_category_votes"("p_category_id" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_category survey_categories%ROWTYPE;
BEGIN
    -- Yetki Kontrolü (Min Level 100 - Super Admin)
perform public.require_permission('admin.votes.read');


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


ALTER FUNCTION "public"."get_admin_category_votes"("p_category_id" "text") OWNER TO "postgres";


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
perform public.require_permission('admin.stats.read');


    -- Ana İstatistikler
    SELECT COUNT(*)::INTEGER INTO v_users_count FROM profiles;
    SELECT COUNT(*)::INTEGER INTO v_texts_count FROM texts WHERE is_active = true;
    SELECT COUNT(*)::INTEGER INTO v_votes_count FROM survey_votes;
    SELECT COUNT(*)::INTEGER INTO v_pending_suggestions_count FROM user_category_suggestions WHERE status = 'pending';
    SELECT COUNT(*)::INTEGER INTO v_active_categories_count FROM survey_categories WHERE is_active = true;

    -- Feedback Sayısı (Tablo varsa ve silinmemiş olanlar)
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'feedback') THEN
        EXECUTE 'SELECT COUNT(*)::INTEGER FROM feedback WHERE deleted_at IS NULL' INTO v_total_feedback_count;
    ELSE
        v_total_feedback_count := 0;
    END IF;

    -- JSON olarak döndür
    RETURN json_build_object(
        'users_count', v_users_count, 
        'texts_count', v_texts_count, 
        'votes_count', v_votes_count, 
        'pending_suggestions_count', v_pending_suggestions_count, 
        'active_categories_count', v_active_categories_count, 
        'total_feedback_count', v_total_feedback_count
    );
END;
$$;


ALTER FUNCTION "public"."get_admin_overview_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_admin_texts"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- Yetki Kontrolü (Min Level 50)
perform public.require_permission('admin.texts.read');


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
                    'class', a.class,
                    'user_year', a.user_year
                ),
                'recipient', json_build_object(
                    'id', r.id,
                    'first_name', r.first_name,
                    'last_name', r.last_name,
                    'school_number', r.school_number,
                    'class', r.class,
                    'user_year', r.user_year
                )
            ) ORDER BY t.created_at DESC
        ), '[]'::json)
        FROM texts t
        LEFT JOIN profiles a ON t.author_id = a.id
        LEFT JOIN profiles r ON t.recipient_id = r.id
        WHERE t.is_active = true
    );
END;
$$;


ALTER FUNCTION "public"."get_admin_texts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_admin_users_list"("class_filter" "text" DEFAULT NULL::"text", "search_query" "text" DEFAULT NULL::"text", "sort_by" "text" DEFAULT 'role'::"text") RETURNS TABLE("id" "uuid", "first_name" "text", "last_name" "text", "school_number" "text", "class" "text", "last_active" timestamp with time zone, "role_level" integer, "highest_role_key" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
BEGIN
  PERFORM public.require_permission('admin.users.read');

  RETURN QUERY
  WITH user_role_max AS (
    SELECT
      ur.user_id,
      MAX(r.level)::int AS role_level,
      (ARRAY_AGG(r.key ORDER BY r.level DESC))[1]::text AS highest_role_key
    FROM public.user_roles ur
    JOIN public.roles r ON r.key = ur.role_key
    GROUP BY ur.user_id
  )
  SELECT
    p.id,
    p.first_name,
    p.last_name,
    p.school_number,
    p.class,
    p.last_active,
    COALESCE(urm.role_level, 0) AS role_level,
    COALESCE(urm.highest_role_key, 'user') AS highest_role_key
  FROM public.profiles p
  LEFT JOIN user_role_max urm ON urm.user_id = p.id
  WHERE
    (class_filter IS NULL OR class_filter = '' OR p.class = class_filter)
    AND (
      search_query IS NULL OR search_query = '' OR
      LOWER(p.first_name || ' ' || p.last_name) LIKE '%' || LOWER(search_query) || '%' OR
      p.school_number::TEXT LIKE '%' || search_query || '%'
    )
  ORDER BY
    CASE WHEN sort_by = 'last_active' THEN p.last_active END DESC NULLS LAST,
    CASE WHEN sort_by = 'role' THEN COALESCE(urm.role_level, 0) END DESC,
    p.last_name ASC;
END;
$$;


ALTER FUNCTION "public"."get_admin_users_list"("class_filter" "text", "search_query" "text", "sort_by" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_admin_votes"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- Yetki Kontrolü (Min Level 100 - Super Admin)
perform public.require_permission('admin.votes.read');


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


ALTER FUNCTION "public"."get_admin_votes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_available_years"() RETURNS TABLE("year" integer)
    LANGUAGE "sql"
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
  SELECT DISTINCT user_year 
  FROM profiles 
  WHERE user_year IS NOT NULL 
  ORDER BY user_year DESC;
$$;


ALTER FUNCTION "public"."get_available_years"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_bulk_user_stats"("user_ids" "uuid"[] DEFAULT NULL::"uuid"[]) RETURNS TABLE("user_id" "uuid", "first_name" "text", "last_name" "text", "class" "text", "email" "text", "total_classmates" integer, "messages_sent_to_classmates" integer, "remaining_classmates" integer, "text_completion_percentage" numeric, "total_survey_categories" integer, "completed_surveys" integer, "remaining_surveys" integer, "survey_completion_percentage" numeric, "is_opted_out" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth', 'pg_catalog'
    AS $$
BEGIN
  PERFORM public.require_permission('admin.reminder.read');

  RETURN QUERY
  WITH filtered_profiles AS (
    SELECT
      p.id,
      p.first_name,
      p.last_name,
      p.class,
      p.user_year,
      u.email::text AS email,
      (eo.user_id IS NOT NULL) AS is_opted_out
    FROM public.profiles p
    JOIN auth.users u ON p.id = u.id
    LEFT JOIN public.email_opt_outs eo ON eo.user_id = p.id
    WHERE (user_ids IS NULL OR p.id = ANY(user_ids))
  ),
  class_counts AS (
    SELECT
      p.class,
      p.user_year,
      (COUNT(*)::integer - 1) AS class_size
    FROM public.profiles p
    GROUP BY p.class, p.user_year
  ),
  text_stats AS (
    SELECT
      t.author_id AS user_id,
      COUNT(DISTINCT t.recipient_id)::integer AS messages_sent
    FROM public.texts t
    JOIN public.profiles author    ON t.author_id = author.id
    JOIN public.profiles recipient ON t.recipient_id = recipient.id
    WHERE
      t.is_active = true
      AND author.class = recipient.class
      AND author.user_year = recipient.user_year
      AND author.id <> recipient.id
    GROUP BY t.author_id
  ),
  survey_stats AS (
    SELECT
      sv.voter_id AS user_id,
      COUNT(DISTINCT sv.category_id)::integer AS completed
    FROM public.survey_votes sv
    GROUP BY sv.voter_id
  ),
  total_surveys AS (
    SELECT COUNT(*)::integer AS total
    FROM public.survey_categories
    WHERE is_active = true
  )
  SELECT
    p.id AS user_id,
    p.first_name,
    p.last_name,
    p.class,
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
  LEFT JOIN class_counts cc
    ON cc.class = p.class
   AND cc.user_year = p.user_year
  LEFT JOIN text_stats ts ON ts.user_id = p.id
  LEFT JOIN survey_stats ss ON ss.user_id = p.id
  CROSS JOIN total_surveys tsur
  ORDER BY p.user_year, p.class, p.first_name, p.last_name;
END;
$$;


ALTER FUNCTION "public"."get_bulk_user_stats"("user_ids" "uuid"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_dashboard_data_v4"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    u_id uuid := auth.uid();
    u_class text;
    u_year smallint;
    u_last_active timestamp with time zone;

    v_written_count int;
    v_received_count int;
    v_total_words int;
    v_last_text_date timestamp with time zone;

    v_class_size int;
    v_written_unique_count int;

    v_deadline text;
    v_graduation_date text;

    v_suggested_classmate json;
    res json;
BEGIN
    IF u_id IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT class, user_year, last_active
    INTO u_class, u_year, u_last_active
    FROM profiles
    WHERE id = u_id;

    IF u_last_active IS NULL OR u_last_active < (now() - INTERVAL '5 minutes') THEN
        UPDATE profiles SET last_active = now() WHERE id = u_id;
    END IF;

    SELECT value INTO v_deadline FROM site_settings WHERE key = 'deadline';
    SELECT value INTO v_graduation_date FROM site_settings WHERE key = 'graduation_date';

    -- written stats (self-text hariç)
    SELECT
        count(*),
        COALESCE(sum(array_length(regexp_split_to_array(content, '\s+'), 1)), 0),
        max(updated_at)
    INTO v_written_count, v_total_words, v_last_text_date
    FROM texts
    WHERE author_id = u_id
      AND is_active = true
      AND author_id <> recipient_id;

    -- received stats (self-text hariç)
    SELECT count(*)
    INTO v_received_count
    FROM texts
    WHERE recipient_id = u_id
      AND is_active = true
      AND author_id <> recipient_id;

    -- class size (zaten kendisi hariç)
    SELECT count(*)
    INTO v_class_size
    FROM profiles
    WHERE class = u_class
      AND user_year IS NOT DISTINCT FROM u_year
      AND id <> u_id;

    -- unique written (self-text hariç)
    SELECT count(DISTINCT t.recipient_id)
    INTO v_written_unique_count
    FROM texts t
    JOIN profiles p ON t.recipient_id = p.id
    WHERE t.author_id = u_id
      AND t.is_active = true
      AND t.author_id <> t.recipient_id
      AND p.class = u_class
      AND p.user_year IS NOT DISTINCT FROM u_year;

    -- suggestion: daha önce aktif mesaj yazmadığı bir sınıf arkadaşını öner
    SELECT json_build_object(
        'id', p.id,
        'first_name', p.first_name,
        'last_name', p.last_name,
        'school_number', p.school_number,
        'user_year', p.user_year
    )
    INTO v_suggested_classmate
    FROM profiles p
    WHERE p.class = u_class
      AND p.user_year IS NOT DISTINCT FROM u_year
      AND p.id <> u_id
      AND NOT EXISTS (
          SELECT 1
          FROM texts t
          WHERE t.author_id = u_id
            AND t.recipient_id = p.id
            AND t.is_active = true
            AND t.author_id <> t.recipient_id
      )
    ORDER BY random()
    LIMIT 1;

    SELECT json_build_object(
        'profile', (
            SELECT json_build_object(
                'first_name', pr.first_name,
                'last_name', pr.last_name,
                'class', pr.class,
                'school_number', pr.school_number,
                'user_year', pr.user_year
            )
            FROM profiles pr
            WHERE pr.id = u_id
        ),
        'stats', json_build_object(
            'written_count', v_written_count,
            'received_count', v_received_count,
            'total_words', v_total_words,
            'last_text_date', v_last_text_date
        ),
        'progress', json_build_object(
            'required_written', v_written_unique_count,
            'required_total', v_class_size,
            'percentage', CASE
                WHEN v_class_size > 0
                    THEN round((v_written_unique_count::float / v_class_size::float) * 100)
                ELSE 0
            END,
            'is_complete', (v_written_unique_count >= v_class_size AND v_class_size > 0)
        ),
        'suggestion', v_suggested_classmate,
        'survey_stats', (
            SELECT json_build_object(
                'total', (SELECT count(*)::int FROM survey_categories WHERE is_active = true),
                'voted', (SELECT count(*)::int FROM survey_votes WHERE voter_id = u_id)
            )
        ),
        'system_info', json_build_object(
            'deadline', v_deadline,
            'graduation_date', v_graduation_date
        )
    )
    INTO res;

    RETURN res;
END;
$$;


ALTER FUNCTION "public"."get_dashboard_data_v4"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_last_active_stats"("p_bucket" "text" DEFAULT 'day'::"text", "p_start" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_end" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_profile_id" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("bucket_start" timestamp with time zone, "events" bigint, "unique_profiles" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
DECLARE
  v_start timestamptz;
  v_end   timestamptz;
  v_trunc text;
BEGIN
  PERFORM public.require_permission('admin.stats.read');

  v_end := COALESCE(p_end, now());
  v_start := COALESCE(p_start, v_end - interval '30 days');

  -- Bucket doğrulama
  IF p_bucket NOT IN ('hour', 'day', 'week') THEN
    RAISE EXCEPTION 'Geçersiz bucket: %. hour|day|week olmalı', p_bucket;
  END IF;

  v_trunc := p_bucket;

  RETURN QUERY
  SELECT
    date_trunc(v_trunc, l.last_active_at) AS bucket_start,
    COUNT(*)::bigint AS events,
    COUNT(DISTINCT l.profile_id)::bigint AS unique_profiles
  FROM public.profile_last_active_log l
  WHERE l.last_active_at >= v_start
    AND l.last_active_at < v_end
    AND (p_profile_id IS NULL OR l.profile_id = p_profile_id)
  GROUP BY 1
  ORDER BY 1;
END;
$$;


ALTER FUNCTION "public"."get_last_active_stats"("p_bucket" "text", "p_start" timestamp with time zone, "p_end" timestamp with time zone, "p_profile_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_permissions"() RETURNS "text"[]
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT COALESCE(array_agg(DISTINCT rp.perm_key ORDER BY rp.perm_key), '{}')::text[]
  FROM public.user_roles ur
  JOIN public.role_permissions rp ON rp.role_key = ur.role_key
  WHERE ur.user_id = auth.uid();
$$;


ALTER FUNCTION "public"."get_my_permissions"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_roles"() RETURNS "text"[]
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select coalesce(array_agg(ur.role_key order by ur.role_key), '{}')
  from public.user_roles ur
  where ur.user_id = auth.uid();
$$;


ALTER FUNCTION "public"."get_my_roles"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_profile_page_extended_data"("target_school_number" "text", "target_year" smallint DEFAULT NULL::smallint) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
DECLARE
  v_profile_id uuid;
  v_user_year smallint;
  v_unlock_date timestamp;
  v_is_unlocked boolean;
  v_days_left integer;

  -- viewer
  v_viewer_id uuid;

  -- Profil ve istatistik verileri
  v_profile_data record;
  v_memories json;
  v_memories_preview json;
  v_self_memories json;
  v_categories json;

  -- FORCE UNLOCK (TEXT, virgül ayracı) -> VIEWER LIST
  v_force_unlock_enabled boolean := false;
  v_force_unlock_list text := '';
  v_force_unlock_active boolean := false;

  v_tmp text := '';
  v_grad_raw text := NULL;
  v_grad_year_raw text := NULL;
BEGIN
  -- ========================================================================
  -- 0. VIEWER
  -- ========================================================================
  v_viewer_id := auth.uid(); -- bakan kişi

  -- ========================================================================
  -- 1. PROFİL BULMA
  -- ========================================================================
  SELECT
    sdv.id,
    sdv.first_name,
    sdv.last_name,
    sdv.school_number,
    sdv.class,
    sdv.user_year,
    sdv.total_texts_received,
    sdv.total_texts_written,
    sdv.total_votes
  INTO v_profile_data
  FROM school_data_view sdv
  WHERE sdv.school_number = target_school_number
    AND (target_year IS NULL OR sdv.user_year = target_year)
  ORDER BY sdv.user_year DESC NULLS LAST
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  v_profile_id := v_profile_data.id;
  v_user_year := v_profile_data.user_year;

  --========================================================================
  -- 2. KİLİT DURUMU HESAPLAMA (value TEXT -> güvenli parse)
  -- ========================================================================
  SELECT value INTO v_grad_year_raw
  FROM site_settings
  WHERE key = 'graduation_date_' || v_user_year::text
  LIMIT 1;

  SELECT value INTO v_grad_raw
  FROM site_settings
  WHERE key = 'graduation_date'
  LIMIT 1;

  IF v_grad_year_raw IS NOT NULL THEN v_grad_year_raw := btrim(v_grad_year_raw); END IF;
  IF v_grad_raw IS NOT NULL THEN v_grad_raw := btrim(v_grad_raw); END IF;

  v_unlock_date := NULL;

  IF v_grad_year_raw IS NOT NULL AND v_grad_year_raw <> '' AND
     v_grad_year_raw ~ '^\d{4}-\d{2}-\d{2}(\s+\d{2}:\d{2}(:\d{2})?)?$'
  THEN
    v_unlock_date := v_grad_year_raw::timestamp;
  ELSIF v_grad_raw IS NOT NULL AND v_grad_raw <> '' AND
     v_grad_raw ~ '^\d{4}-\d{2}-\d{2}(\s+\d{2}:\d{2}(:\d{2})?)?$'
  THEN
    v_unlock_date := v_grad_raw::timestamp;
  END IF;

  v_unlock_date := COALESCE(v_unlock_date, '2099-01-01 00:00:00'::timestamp);

  v_is_unlocked := CURRENT_TIMESTAMP >= v_unlock_date;

  IF v_is_unlocked THEN
    v_days_left := 0;
  ELSE
    v_days_left := CEIL(EXTRACT(EPOCH FROM (v_unlock_date - CURRENT_TIMESTAMP)) / 86400)::int;
    v_days_left := GREATEST(0, v_days_left);
  END IF;

  -- ========================================================================
  -- 3. ANILARI GETIR
  -- ========================================================================
  IF v_is_unlocked THEN
    SELECT memories
    INTO v_memories
    FROM texts_memories_v
    WHERE recipient_id = v_profile_id;

    v_memories := COALESCE(v_memories, '[]'::json);
  ELSE
    v_memories := '[]'::json;
  END IF;

  -- ========================================================================
  -- 4. ÖNİZLEME
  -- ========================================================================
  SELECT memories_preview
  INTO v_memories_preview
  FROM texts_memories_preview_v
  WHERE recipient_id = v_profile_id;

  v_memories_preview := COALESCE(v_memories_preview, '[]'::json);

  -- ========================================================================
  -- 5. KENDİNE YAZILANLAR
  -- ========================================================================
  IF v_is_unlocked THEN
    SELECT COALESCE(json_agg(
      json_build_object(
        'id', ts.id,
        'content', ts.content,
        'created_at', ts.created_at,
        'updated_at', ts.updated_at,
        'author_id', ts.author_id,
        'recipient_id', ts.recipient_id,
        'author', ts.author
      )
      ORDER BY ts.created_at DESC
    ), '[]'::json)
    INTO v_self_memories
    FROM texts_self_v ts
    WHERE ts.recipient_id = v_profile_id;
  ELSE
    v_self_memories := '[]'::json;
  END IF;

  -- ========================================================================
  -- 6. KATEGORİLER
  -- ========================================================================
  IF v_is_unlocked THEN
    SELECT COALESCE(json_agg(
      json_build_object(
        'category', json_build_object(
          'id', sc.id,
          'title', sc.title,
          'emoji', sc.emoji,
          'color', sc.color
        ),
        'count', COALESCE(pvs.vote_count, 0)
      )
      ORDER BY COALESCE(pvs.vote_count, 0) DESC, sc.sort_order ASC
    ), '[]'::json)
    INTO v_categories
    FROM survey_categories sc
    LEFT JOIN profile_vote_summary_v2 pvs
      ON sc.id = pvs.category_id
     AND pvs.voted_for_id = v_profile_id
    WHERE sc.is_active = true;
  ELSE
    v_categories := '[]'::json;
  END IF;

  -- ========================================================================
  -- 7. SONUÇ
  -- ========================================================================
  RETURN json_build_object(
    'profile', json_build_object(
      'id', v_profile_data.id,
      'first_name', v_profile_data.first_name,
      'last_name', v_profile_data.last_name,
      'school_number', v_profile_data.school_number,
      'class', v_profile_data.class,
      'user_year', v_profile_data.user_year
    ),
    'receivedCount', v_profile_data.total_texts_received,
    'writtenCount', v_profile_data.total_texts_written,
    'totalVotes', v_profile_data.total_votes,
    'is_unlocked', v_is_unlocked,
    'days_until_unlock', v_days_left,
    'memories', v_memories,
    'memories_preview', v_memories_preview,
    'self_memories', v_self_memories,
    'categories', v_categories
  );
END;
$_$;


ALTER FUNCTION "public"."get_profile_page_extended_data"("target_school_number" "text", "target_year" smallint) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_profile_page_extended_data"("target_school_number" "text", "target_year" smallint) IS 'Profil sayfası için genişletilmiş veri getiren fonksiyon.
- Sadece service_role erişebilir (server-side calls only)
- Normal kullanıcılar bu fonksiyonu doğrudan çağıramaz';



CREATE OR REPLACE FUNCTION "public"."get_public_site_counts"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_users_count integer;
  v_texts_count integer;
  v_votes_count integer;
begin
  select count(*)::integer
    into v_users_count
  from public.profiles;

  select count(*)::integer
    into v_texts_count
  from public.texts
  where is_active is true;

  select count(*)::integer
    into v_votes_count
  from public.survey_votes;

  return json_build_object(
    'users', v_users_count,
    'active_texts', v_texts_count,
    'votes', v_votes_count
  );
end;
$$;


ALTER FUNCTION "public"."get_public_site_counts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_requester_max_role_level"() RETURNS integer
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT COALESCE(MAX(r.level), 0)::int
  FROM public.user_roles ur
  JOIN public.roles r ON r.key = ur.role_key
  WHERE ur.user_id = auth.uid();
$$;


ALTER FUNCTION "public"."get_requester_max_role_level"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_school_data"("target_year" smallint DEFAULT NULL::smallint) RETURNS TABLE("id" "uuid", "first_name" "text", "last_name" "text", "school_number" "text", "class" "text", "user_year" smallint, "total_texts_received" bigint, "total_texts_written" bigint, "total_votes" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_query_year smallint;
BEGIN
  v_query_year := target_year;

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
  WHERE (v_query_year IS NULL OR v.user_year = v_query_year)
  ORDER BY v.class ASC, v.first_name ASC;
END;
$$;


ALTER FUNCTION "public"."get_school_data"("target_year" smallint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_profiles_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
BEGIN
    -- Sadece last_active değişmişse updated_at'e dokunma
    IF (OLD IS NOT DISTINCT FROM NEW) THEN
        RETURN NEW;
    END IF;
    
    -- last_active dışındaki sütunların değişimini kontrol et
    IF (OLD.first_name IS DISTINCT FROM NEW.first_name OR
        OLD.last_name IS DISTINCT FROM NEW.last_name OR
        OLD.school_number IS DISTINCT FROM NEW.school_number OR
        OLD.class IS DISTINCT FROM NEW.class OR
        OLD.user_year IS DISTINCT FROM NEW.user_year) THEN
        
        NEW.updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_profiles_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_permission"("p_perm" "text") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role_key = ur.role_key
    WHERE ur.user_id = auth.uid()
      AND rp.perm_key = p_perm
  );
$$;


ALTER FUNCTION "public"."has_permission"("p_perm" "text") OWNER TO "postgres";


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


ALTER FUNCTION "public"."log_all_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_profile_last_active_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  -- last_active değişmediyse hiçbir şey yapma
    if new.last_active is not distinct from old.last_active then
        return new;
          end if;

            -- null gelirse yazma
              if new.last_active is null then
                  return new;
                    end if;

                      insert into public.profile_last_active_log (
                          profile_id,
                              last_active_at
                                )
                                  values (
                                      new.id,
                                          new.last_active
                                            );

                                              return new;
                                              end;
                                              $$;


ALTER FUNCTION "public"."log_profile_last_active_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."require_permission"("p_perm" "text") RETURNS "void"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'UNAUTHENTICATED';
  END IF;

  IF NOT public.has_permission(p_perm) THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;
END;
$$;


ALTER FUNCTION "public"."require_permission"("p_perm" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."soft_delete_feedback"("feedback_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
BEGIN
    -- Yetki kontrolü
    PERFORM public.require_permission('admin.feedback.delete');

    -- Soft delete
    UPDATE public.feedback
    SET deleted_at = NOW()
    WHERE id = feedback_id
      AND deleted_at IS NULL;

    RETURN FOUND;
END;
$$;


ALTER FUNCTION "public"."soft_delete_feedback"("feedback_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."soft_delete_text"("target_text_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_user_id uuid;
    v_author_id uuid;
    v_messaging_enabled boolean;
    v_is_admin boolean;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Oturum açılmamış.');
    END IF;

    -- Admin mi? (permission)
    v_is_admin := public.has_permission('admin.texts.delete');

    -- messaging_enabled al (yoksa false)
    SELECT COALESCE(s.value = 'true', false)
    INTO v_messaging_enabled
    FROM public.site_settings s
    WHERE s.key = 'messaging_enabled';

    -- author_id getir
    SELECT t.author_id
    INTO v_author_id
    FROM public.texts t
    WHERE t.id = target_text_id;

    IF v_author_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Metin bulunamadı.');
    END IF;

    -- ❗ messaging kapalıysa: sadece admin silebilsin (eski davranışı korur)
    IF NOT v_messaging_enabled AND NOT v_is_admin THEN
        RETURN jsonb_build_object('success', false, 'error', 'Mesajlaşma şu anda kapalı.');
    END IF;

    -- Yetki: yazar veya admin
    IF v_user_id = v_author_id OR v_is_admin THEN
        UPDATE public.texts
        SET is_active = false,
            updated_at = now()
        WHERE id = target_text_id;

        IF NOT FOUND THEN
            RETURN jsonb_build_object('success', false, 'error', 'Metin bulunamadı.');
        END IF;

        RETURN jsonb_build_object('success', true, 'message', 'Metin başarıyla pasife çekildi.');
    END IF;

    RETURN jsonb_build_object('success', false, 'error', 'Bu işlem için yetkiniz yok.');

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


ALTER FUNCTION "public"."soft_delete_text"("target_text_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_profile"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
DECLARE
    valid_classes text[];
    school_number_len int;
    school_number_pattern text;
    active_year int;
BEGIN
    ----------------------------------------------------------------
    -- AYARLAR (TEK SORGU)
    ----------------------------------------------------------------
    SELECT
        string_to_array(max(value) FILTER (WHERE key = 'valid_classes'), ','),
        (max(value) FILTER (WHERE key = 'school_number_length'))::int,
        max(value) FILTER (WHERE key = 'school_number_regex'),
        (max(value) FILTER (WHERE key = 'active_year'))::int
    INTO valid_classes, school_number_len, school_number_pattern, active_year
    FROM public.site_settings
    WHERE key IN ('valid_classes', 'school_number_length', 'school_number_regex', 'active_year');

    ----------------------------------------------------------------
    -- AYAR KONTROLLERİ (ZORUNLU)
    ----------------------------------------------------------------
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
    -- USER_YEAR KURALLARI
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
    -- CLASS (trim + kontrol)
    ----------------------------------------------------------------
    NEW.class := btrim(NEW.class);

    IF NEW.class IS NULL OR NEW.class = '' THEN
        RAISE EXCEPTION 'class boş olamaz';
    END IF;

    IF NOT (NEW.class = ANY(valid_classes)) THEN
        RAISE EXCEPTION 'Geçersiz class: %', NEW.class;
    END IF;

    ----------------------------------------------------------------
    -- SCHOOL NUMBER (trim + kontrol)
    ----------------------------------------------------------------
    NEW.school_number := btrim(NEW.school_number);

    IF NEW.school_number IS NULL OR NEW.school_number = '' THEN
        RAISE EXCEPTION 'school_number boş olamaz';
    END IF;

    IF length(NEW.school_number) != school_number_len THEN
        RAISE EXCEPTION 'Geçersiz school_number uzunluğu: %', NEW.school_number;
    END IF;

    IF NEW.school_number !~ school_number_pattern THEN
        RAISE EXCEPTION 'Geçersiz school_number formatı: %', NEW.school_number;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_profile"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."activity_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "table_name" "text" NOT NULL,
    "operation" "text" NOT NULL,
    "record_id" "text" NOT NULL,
    "old_data" "jsonb",
    "new_data" "jsonb",
    "changed_by" "uuid",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."activity_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email_opt_outs" (
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."email_opt_outs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."feedback" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "type" "text" NOT NULL,
    "message" "text" NOT NULL,
    "page_url" "text",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    CONSTRAINT "feedback_type_check" CHECK (("type" = ANY (ARRAY['bug'::"text", 'suggestion'::"text", 'complaint'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."feedback" OWNER TO "postgres";


COMMENT ON TABLE "public"."feedback" IS 'Kullanıcı geri bildirimleri';



CREATE TABLE IF NOT EXISTS "public"."permissions" (
    "key" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profile_last_active_log" (
    "id" bigint NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "last_active_at" timestamp with time zone NOT NULL
);


ALTER TABLE "public"."profile_last_active_log" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."profile_last_active_log_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."profile_last_active_log_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."profile_last_active_log_id_seq" OWNED BY "public"."profile_last_active_log"."id";



CREATE TABLE IF NOT EXISTS "public"."survey_categories" (
    "id" "text" NOT NULL,
    "title" "text" NOT NULL,
    "emoji" "text" NOT NULL,
    "description" "text" NOT NULL,
    "color" "text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_user_suggested" boolean DEFAULT false,
    "suggested_by" "uuid"
);

ALTER TABLE ONLY "public"."survey_categories" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."survey_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."survey_votes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "voter_id" "uuid" NOT NULL,
    "voted_for_id" "uuid",
    "category_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."survey_votes" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."profile_vote_summary_v2" WITH ("security_invoker"='on') AS
 SELECT "sv"."voted_for_id",
    "sc"."id" AS "category_id",
    "sc"."title",
    "sc"."emoji",
    "sc"."color",
    ("count"(*))::integer AS "vote_count"
   FROM ("public"."survey_votes" "sv"
     JOIN "public"."survey_categories" "sc" ON (("sc"."id" = "sv"."category_id")))
  GROUP BY "sv"."voted_for_id", "sc"."id", "sc"."title", "sc"."emoji", "sc"."color";


ALTER VIEW "public"."profile_vote_summary_v2" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "school_number" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "class" "text" DEFAULT '12A'::"text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_active" timestamp with time zone DEFAULT "now"(),
    "user_year" smallint,
    CONSTRAINT "profiles_first_name_len_chk" CHECK ((("char_length"("btrim"("first_name")) >= 1) AND ("char_length"("btrim"("first_name")) <= 50))),
    CONSTRAINT "profiles_last_name_len_chk" CHECK ((("char_length"("btrim"("last_name")) >= 1) AND ("char_length"("btrim"("last_name")) <= 50)))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."role_permissions" (
    "role_key" "text" NOT NULL,
    "perm_key" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."role_permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."roles" (
    "key" "text" NOT NULL,
    "label" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "level" smallint
);


ALTER TABLE "public"."roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."texts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "author_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "recipient_id" "uuid" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."texts" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."school_data_view" WITH ("security_invoker"='on') AS
 SELECT "id",
    "first_name",
    "last_name",
    "school_number",
    "class",
    "user_year",
    ( SELECT ("count"(*))::integer AS "count"
           FROM "public"."texts" "t"
          WHERE (("t"."recipient_id" = "p"."id") AND ("t"."is_active" IS TRUE) AND ("t"."author_id" <> "t"."recipient_id"))) AS "total_texts_received",
    ( SELECT ("count"(*))::integer AS "count"
           FROM "public"."texts" "t"
          WHERE (("t"."author_id" = "p"."id") AND ("t"."is_active" IS TRUE) AND ("t"."author_id" <> "t"."recipient_id"))) AS "total_texts_written",
    COALESCE(( SELECT ("sum"("pvs"."vote_count"))::integer AS "sum"
           FROM "public"."profile_vote_summary_v2" "pvs"
          WHERE ("pvs"."voted_for_id" = "p"."id")), 0) AS "total_votes"
   FROM "public"."profiles" "p";


ALTER VIEW "public"."school_data_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."site_settings" (
    "key" "text" NOT NULL,
    "value" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."site_settings" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."texts_memories_preview_v" WITH ("security_invoker"='on') AS
 SELECT "r"."id" AS "recipient_id",
    "r"."first_name",
    "r"."last_name",
    "r"."school_number",
    "r"."class",
    "r"."user_year",
    COALESCE("json_agg"("json_build_object"('id', "t"."id", 'created_at', "t"."created_at", 'updated_at', "t"."updated_at", 'author_id', "t"."author_id", 'author', "json_build_object"('first_name', "a"."first_name", 'last_name', "a"."last_name", 'school_number', "a"."school_number", 'class', "a"."class", 'user_year', "a"."user_year")) ORDER BY "t"."created_at" DESC) FILTER (WHERE ("t"."id" IS NOT NULL)), '[]'::json) AS "memories_preview"
   FROM (("public"."profiles" "r"
     LEFT JOIN "public"."texts" "t" ON ((("t"."recipient_id" = "r"."id") AND ("t"."is_active" IS TRUE) AND ("t"."author_id" <> "t"."recipient_id"))))
     LEFT JOIN "public"."profiles" "a" ON (("a"."id" = "t"."author_id")))
  GROUP BY "r"."id", "r"."first_name", "r"."last_name", "r"."school_number", "r"."class", "r"."user_year";


ALTER VIEW "public"."texts_memories_preview_v" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."texts_memories_v" WITH ("security_invoker"='on') AS
 SELECT "r"."id" AS "recipient_id",
    "r"."first_name",
    "r"."last_name",
    "r"."school_number",
    "r"."class",
    "r"."user_year",
    COALESCE("json_agg"("json_build_object"('id', "t"."id", 'content', "t"."content", 'created_at', "t"."created_at", 'author_id', "t"."author_id", 'author',
        CASE
            WHEN ("a"."id" IS NULL) THEN NULL::json
            ELSE "json_build_object"('first_name', "a"."first_name", 'last_name', "a"."last_name", 'school_number', "a"."school_number", 'class', "a"."class", 'user_year', "a"."user_year")
        END) ORDER BY "t"."created_at" DESC) FILTER (WHERE ("t"."id" IS NOT NULL)), '[]'::json) AS "memories"
   FROM (("public"."profiles" "r"
     LEFT JOIN "public"."texts" "t" ON ((("t"."recipient_id" = "r"."id") AND ("t"."is_active" IS TRUE) AND ("t"."author_id" <> "t"."recipient_id"))))
     LEFT JOIN "public"."profiles" "a" ON (("a"."id" = "t"."author_id")))
  GROUP BY "r"."id", "r"."first_name", "r"."last_name", "r"."school_number", "r"."class", "r"."user_year";


ALTER VIEW "public"."texts_memories_v" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."texts_self_v" WITH ("security_invoker"='on') AS
 SELECT "t"."id",
    "t"."content",
    "t"."created_at",
    "t"."updated_at",
    "t"."author_id",
    "t"."recipient_id",
    "json_build_object"('first_name', "a"."first_name", 'last_name', "a"."last_name", 'school_number', "a"."school_number", 'class', "a"."class", 'user_year', "a"."user_year") AS "author"
   FROM ("public"."texts" "t"
     JOIN "public"."profiles" "a" ON (("a"."id" = "t"."author_id")))
  WHERE (("t"."is_active" = true) AND ("t"."author_id" = "t"."recipient_id"));


ALTER VIEW "public"."texts_self_v" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_category_suggestions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "emoji" "text" NOT NULL,
    "description" "text" NOT NULL,
    "color" "text" DEFAULT 'from-purple-500 to-pink-500'::"text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "suggested_by" "uuid" NOT NULL,
    "admin_note" "text",
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "approved_category_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_category_suggestions_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"])))
);

ALTER TABLE ONLY "public"."user_category_suggestions" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_category_suggestions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "user_id" "uuid" NOT NULL,
    "role_key" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "set_by" "uuid",
    "source" "text"
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


ALTER TABLE ONLY "public"."profile_last_active_log" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."profile_last_active_log_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."activity_logs"
    ADD CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_opt_outs"
    ADD CONSTRAINT "email_opt_outs_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."feedback"
    ADD CONSTRAINT "feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."profile_last_active_log"
    ADD CONSTRAINT "profile_last_active_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_school_number_year_unique" UNIQUE ("school_number", "user_year");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_key", "perm_key");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."site_settings"
    ADD CONSTRAINT "site_settings_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."survey_categories"
    ADD CONSTRAINT "survey_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."survey_votes"
    ADD CONSTRAINT "survey_votes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."survey_votes"
    ADD CONSTRAINT "survey_votes_voter_id_category_id_key" UNIQUE ("voter_id", "category_id");



ALTER TABLE ONLY "public"."texts"
    ADD CONSTRAINT "texts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_category_suggestions"
    ADD CONSTRAINT "user_category_suggestions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id", "role_key");



CREATE INDEX "idx_activity_logs_changed_by" ON "public"."activity_logs" USING "btree" ("changed_by");



CREATE INDEX "idx_feedback_created_at" ON "public"."feedback" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_feedback_user_id" ON "public"."feedback" USING "btree" ("user_id");



CREATE INDEX "idx_role_permissions_perm" ON "public"."role_permissions" USING "btree" ("perm_key");



CREATE INDEX "idx_role_permissions_role" ON "public"."role_permissions" USING "btree" ("role_key");



CREATE INDEX "idx_survey_categories_suggested_by" ON "public"."survey_categories" USING "btree" ("suggested_by");



CREATE INDEX "idx_survey_votes_category_id" ON "public"."survey_votes" USING "btree" ("category_id");



CREATE INDEX "idx_survey_votes_voted_for_id" ON "public"."survey_votes" USING "btree" ("voted_for_id");



CREATE INDEX "idx_survey_votes_voter_id" ON "public"."survey_votes" USING "btree" ("voter_id");



CREATE INDEX "idx_texts_author_active" ON "public"."texts" USING "btree" ("author_id") WHERE ("is_active" IS TRUE);



CREATE INDEX "idx_texts_recipient_active_created" ON "public"."texts" USING "btree" ("recipient_id", "created_at" DESC) WHERE ("is_active" IS TRUE);



CREATE INDEX "idx_user_category_suggestions_approved_category_id" ON "public"."user_category_suggestions" USING "btree" ("approved_category_id");



CREATE INDEX "idx_user_category_suggestions_reviewed_by" ON "public"."user_category_suggestions" USING "btree" ("reviewed_by");



CREATE INDEX "idx_user_category_suggestions_status" ON "public"."user_category_suggestions" USING "btree" ("status");



CREATE INDEX "idx_user_category_suggestions_suggested_by" ON "public"."user_category_suggestions" USING "btree" ("suggested_by");



CREATE INDEX "idx_user_roles_role" ON "public"."user_roles" USING "btree" ("role_key");



CREATE INDEX "idx_user_roles_user" ON "public"."user_roles" USING "btree" ("user_id");



CREATE INDEX "profile_last_active_log_idx" ON "public"."profile_last_active_log" USING "btree" ("profile_id", "last_active_at" DESC);



CREATE UNIQUE INDEX "ux_texts_one_active_per_pair" ON "public"."texts" USING "btree" ("author_id", "recipient_id") WHERE ("is_active" = true);



CREATE OR REPLACE TRIGGER "audit_feedback" AFTER INSERT OR DELETE OR UPDATE ON "public"."feedback" FOR EACH ROW EXECUTE FUNCTION "public"."log_all_changes"();



CREATE OR REPLACE TRIGGER "audit_profiles" AFTER INSERT OR UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."log_all_changes"();



CREATE OR REPLACE TRIGGER "audit_site_settings" AFTER INSERT OR DELETE OR UPDATE ON "public"."site_settings" FOR EACH ROW EXECUTE FUNCTION "public"."log_all_changes"();



CREATE OR REPLACE TRIGGER "audit_survey_categories" AFTER INSERT OR DELETE OR UPDATE ON "public"."survey_categories" FOR EACH ROW EXECUTE FUNCTION "public"."log_all_changes"();



CREATE OR REPLACE TRIGGER "audit_survey_votes" AFTER INSERT OR DELETE OR UPDATE ON "public"."survey_votes" FOR EACH ROW EXECUTE FUNCTION "public"."log_all_changes"();



CREATE OR REPLACE TRIGGER "audit_texts" AFTER INSERT OR DELETE OR UPDATE ON "public"."texts" FOR EACH ROW EXECUTE FUNCTION "public"."log_all_changes"();



CREATE OR REPLACE TRIGGER "audit_user_category_suggestions" AFTER INSERT OR DELETE OR UPDATE ON "public"."user_category_suggestions" FOR EACH ROW EXECUTE FUNCTION "public"."log_all_changes"();



CREATE OR REPLACE TRIGGER "profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_profiles_updated_at"();



CREATE OR REPLACE TRIGGER "site_settings_updated_at" BEFORE UPDATE ON "public"."site_settings" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "texts_updated_at" BEFORE UPDATE ON "public"."texts" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "trg_check_same_class_vote" BEFORE INSERT OR UPDATE ON "public"."survey_votes" FOR EACH ROW EXECUTE FUNCTION "public"."check_same_class_vote"();



CREATE OR REPLACE TRIGGER "trg_log_profile_last_active_change" AFTER UPDATE OF "last_active" ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."log_profile_last_active_change"();



CREATE OR REPLACE TRIGGER "trg_survey_deadline_check" BEFORE INSERT OR UPDATE ON "public"."survey_votes" FOR EACH ROW EXECUTE FUNCTION "public"."check_graduation_deadline"();



CREATE OR REPLACE TRIGGER "trg_texts_deadline_check" BEFORE INSERT OR UPDATE ON "public"."texts" FOR EACH ROW EXECUTE FUNCTION "public"."check_graduation_deadline"();



CREATE OR REPLACE TRIGGER "trg_texts_same_year" BEFORE INSERT OR UPDATE OF "author_id", "recipient_id" ON "public"."texts" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_texts_same_year"();



CREATE OR REPLACE TRIGGER "trg_validate_profile_insupd" BEFORE INSERT OR UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."validate_profile"();



ALTER TABLE ONLY "public"."activity_logs"
    ADD CONSTRAINT "activity_logs_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."email_opt_outs"
    ADD CONSTRAINT "email_opt_outs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feedback"
    ADD CONSTRAINT "feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profile_last_active_log"
    ADD CONSTRAINT "profile_last_active_log_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_perm_key_fkey" FOREIGN KEY ("perm_key") REFERENCES "public"."permissions"("key") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_role_key_fkey" FOREIGN KEY ("role_key") REFERENCES "public"."roles"("key") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."survey_categories"
    ADD CONSTRAINT "survey_categories_suggested_by_fkey" FOREIGN KEY ("suggested_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."survey_votes"
    ADD CONSTRAINT "survey_votes_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."survey_categories"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."survey_votes"
    ADD CONSTRAINT "survey_votes_voted_for_id_fkey" FOREIGN KEY ("voted_for_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."survey_votes"
    ADD CONSTRAINT "survey_votes_voter_id_fkey" FOREIGN KEY ("voter_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."texts"
    ADD CONSTRAINT "texts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."texts"
    ADD CONSTRAINT "texts_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_category_suggestions"
    ADD CONSTRAINT "user_category_suggestions_approved_category_id_fkey" FOREIGN KEY ("approved_category_id") REFERENCES "public"."survey_categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_category_suggestions"
    ADD CONSTRAINT "user_category_suggestions_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."user_category_suggestions"
    ADD CONSTRAINT "user_category_suggestions_suggested_by_fkey" FOREIGN KEY ("suggested_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_role_key_fkey" FOREIGN KEY ("role_key") REFERENCES "public"."roles"("key") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_set_by_fkey" FOREIGN KEY ("set_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can view active feedback" ON "public"."feedback" FOR SELECT TO "authenticated" USING ((("deleted_at" IS NULL) AND "public"."has_permission"('admin.feedback.read'::"text")));



CREATE POLICY "Admins view logs" ON "public"."activity_logs" FOR SELECT TO "authenticated" USING ("public"."has_permission"('system.logs.read'::"text"));



CREATE POLICY "Authenticated users can insert feedback" ON "public"."feedback" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "No delete" ON "public"."activity_logs" FOR DELETE TO "authenticated" USING (false);



CREATE POLICY "No direct insert" ON "public"."activity_logs" FOR INSERT TO "authenticated" WITH CHECK (false);



CREATE POLICY "No update" ON "public"."activity_logs" FOR UPDATE TO "authenticated" USING (false);



CREATE POLICY "Users can delete their own opt-out" ON "public"."email_opt_outs" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert their own opt-out" ON "public"."email_opt_outs" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own opt-out" ON "public"."email_opt_outs" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users or admins can view opt-outs" ON "public"."email_opt_outs" TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."has_permission"('admin.email_opt_outs.read'::"text")));



ALTER TABLE "public"."activity_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."email_opt_outs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."feedback" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profile_last_active_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_select_all" ON "public"."profiles" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."role_permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."site_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "site_settings_admin_delete" ON "public"."site_settings" FOR DELETE TO "authenticated" USING ("public"."has_permission"('site.settings.write'::"text"));



CREATE POLICY "site_settings_admin_insert" ON "public"."site_settings" FOR INSERT TO "authenticated" WITH CHECK ("public"."has_permission"('site.settings.write'::"text"));



CREATE POLICY "site_settings_admin_update" ON "public"."site_settings" FOR UPDATE TO "authenticated" USING ("public"."has_permission"('site.settings.write'::"text")) WITH CHECK ("public"."has_permission"('site.settings.write'::"text"));



CREATE POLICY "site_settings_select_policy" ON "public"."site_settings" FOR SELECT USING (true);



CREATE POLICY "suggestions_admin_select" ON "public"."user_category_suggestions" FOR SELECT TO "authenticated" USING ("public"."has_permission"('admin.suggestions.read'::"text"));



CREATE POLICY "suggestions_admin_update" ON "public"."user_category_suggestions" FOR UPDATE TO "authenticated" USING ("public"."has_permission"('admin.suggestions.update'::"text")) WITH CHECK ("public"."has_permission"('admin.suggestions.update'::"text"));



CREATE POLICY "suggestions_insert" ON "public"."user_category_suggestions" FOR INSERT TO "authenticated" WITH CHECK (("suggested_by" = "auth"."uid"()));



ALTER TABLE "public"."survey_categories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "survey_categories_admin_delete" ON "public"."survey_categories" FOR DELETE TO "authenticated" USING ("public"."has_permission"('survey.categories.write'::"text"));



CREATE POLICY "survey_categories_admin_insert" ON "public"."survey_categories" FOR INSERT TO "authenticated" WITH CHECK ("public"."has_permission"('survey.categories.write'::"text"));



CREATE POLICY "survey_categories_admin_update" ON "public"."survey_categories" FOR UPDATE TO "authenticated" USING ("public"."has_permission"('survey.categories.write'::"text")) WITH CHECK ("public"."has_permission"('survey.categories.write'::"text"));



CREATE POLICY "survey_categories_select_unified" ON "public"."survey_categories" FOR SELECT TO "authenticated" USING ((("is_active" = true) OR "public"."has_permission"('survey.categories.read_all'::"text")));



ALTER TABLE "public"."survey_votes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "survey_votes_insert_policy" ON "public"."survey_votes" FOR INSERT TO "authenticated" WITH CHECK ((("voter_id" = ( SELECT "auth"."uid"() AS "uid")) AND (( SELECT "s"."value"
   FROM "public"."site_settings" "s"
  WHERE ("s"."key" = 'voting_enabled'::"text")) = 'true'::"text")));



CREATE POLICY "survey_votes_select_policy" ON "public"."survey_votes" FOR SELECT TO "authenticated" USING (("voter_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "survey_votes_update_policy" ON "public"."survey_votes" FOR UPDATE TO "authenticated" USING (("voter_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ((("voter_id" = ( SELECT "auth"."uid"() AS "uid")) AND (( SELECT "s"."value"
   FROM "public"."site_settings" "s"
  WHERE ("s"."key" = 'voting_enabled'::"text")) = 'true'::"text")));



ALTER TABLE "public"."texts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "texts_insert_policy" ON "public"."texts" FOR INSERT TO "authenticated" WITH CHECK ((("author_id" = ( SELECT "auth"."uid"() AS "uid")) AND (( SELECT "s"."value"
   FROM "public"."site_settings" "s"
  WHERE ("s"."key" = 'messaging_enabled'::"text")) = 'true'::"text")));



CREATE POLICY "texts_select_policy" ON "public"."texts" FOR SELECT TO "authenticated" USING (("author_id" = "auth"."uid"()));



CREATE POLICY "texts_update_policy" ON "public"."texts" FOR UPDATE TO "authenticated" USING ((("is_active" = true) AND ("author_id" = ( SELECT "auth"."uid"() AS "uid")))) WITH CHECK ((("is_active" = true) AND ("author_id" = ( SELECT "auth"."uid"() AS "uid")) AND (( SELECT "s"."value"
   FROM "public"."site_settings" "s"
  WHERE ("s"."key" = 'messaging_enabled'::"text")) = 'true'::"text")));



CREATE POLICY "user_can_see_own_roles" ON "public"."user_roles" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."user_category_suggestions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";


















































































































































































































GRANT ALL ON FUNCTION "public"."admin_add_role_permission"("p_role_key" "text", "p_perm_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_add_role_permission"("p_role_key" "text", "p_perm_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_add_role_permission"("p_role_key" "text", "p_perm_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_add_user_role"("target_user_id" "uuid", "add_role_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_add_user_role"("target_user_id" "uuid", "add_role_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_add_user_role"("target_user_id" "uuid", "add_role_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_create_role"("p_key" "text", "p_label" "text", "p_level" smallint) TO "anon";
GRANT ALL ON FUNCTION "public"."admin_create_role"("p_key" "text", "p_label" "text", "p_level" smallint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_create_role"("p_key" "text", "p_label" "text", "p_level" smallint) TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_delete_role"("p_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_delete_role"("p_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_delete_role"("p_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_get_user_roles"("target_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_get_user_roles"("target_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_get_user_roles"("target_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_remove_role_permission"("p_role_key" "text", "p_perm_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_remove_role_permission"("p_role_key" "text", "p_perm_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_remove_role_permission"("p_role_key" "text", "p_perm_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_remove_user_role"("target_user_id" "uuid", "remove_role_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_remove_user_role"("target_user_id" "uuid", "remove_role_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_remove_user_role"("target_user_id" "uuid", "remove_role_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_update_role"("p_key" "text", "p_label" "text", "p_level" smallint) TO "anon";
GRANT ALL ON FUNCTION "public"."admin_update_role"("p_key" "text", "p_label" "text", "p_level" smallint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_update_role"("p_key" "text", "p_label" "text", "p_level" smallint) TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_update_user_profile"("target_user_id" "uuid", "new_first_name" "text", "new_last_name" "text", "new_school_number" "text", "new_class" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_update_user_profile"("target_user_id" "uuid", "new_first_name" "text", "new_last_name" "text", "new_school_number" "text", "new_class" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_update_user_profile"("target_user_id" "uuid", "new_first_name" "text", "new_last_name" "text", "new_school_number" "text", "new_class" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."check_auth_registration_status"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."check_auth_registration_status"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."check_graduation_deadline"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."check_graduation_deadline"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."check_same_class_vote"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."check_same_class_vote"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."cleanup_system_logs"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."cleanup_system_logs"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."complete_profile"("p_first_name" "text", "p_last_name" "text", "p_school_number" "text", "p_class_room" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."complete_profile"("p_first_name" "text", "p_last_name" "text", "p_school_number" "text", "p_class_room" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."complete_profile"("p_first_name" "text", "p_last_name" "text", "p_school_number" "text", "p_class_room" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."enforce_texts_same_year"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."enforce_texts_same_year"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_activity_logs_latest"("p_limit" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_activity_logs_latest"("p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_activity_logs_latest"("p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_activity_logs_latest"("p_limit" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_admin_category_votes"("p_category_id" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_admin_category_votes"("p_category_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_admin_category_votes"("p_category_id" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_admin_overview_stats"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_admin_overview_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_admin_overview_stats"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_admin_texts"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_admin_texts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_admin_texts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_admin_users_list"("class_filter" "text", "search_query" "text", "sort_by" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_admin_users_list"("class_filter" "text", "search_query" "text", "sort_by" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_admin_users_list"("class_filter" "text", "search_query" "text", "sort_by" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_admin_votes"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_admin_votes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_admin_votes"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_available_years"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_available_years"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_available_years"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_bulk_user_stats"("user_ids" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."get_bulk_user_stats"("user_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_bulk_user_stats"("user_ids" "uuid"[]) TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_dashboard_data_v4"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_dashboard_data_v4"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_dashboard_data_v4"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_last_active_stats"("p_bucket" "text", "p_start" timestamp with time zone, "p_end" timestamp with time zone, "p_profile_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_last_active_stats"("p_bucket" "text", "p_start" timestamp with time zone, "p_end" timestamp with time zone, "p_profile_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_last_active_stats"("p_bucket" "text", "p_start" timestamp with time zone, "p_end" timestamp with time zone, "p_profile_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_permissions"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_permissions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_permissions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_roles"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_roles"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_roles"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_profile_page_extended_data"("target_school_number" "text", "target_year" smallint) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_profile_page_extended_data"("target_school_number" "text", "target_year" smallint) TO "service_role";
GRANT ALL ON FUNCTION "public"."get_profile_page_extended_data"("target_school_number" "text", "target_year" smallint) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."get_public_site_counts"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_public_site_counts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_public_site_counts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_requester_max_role_level"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_requester_max_role_level"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_requester_max_role_level"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_school_data"("target_year" smallint) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_school_data"("target_year" smallint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_school_data"("target_year" smallint) TO "service_role";



REVOKE ALL ON FUNCTION "public"."handle_profiles_updated_at"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_profiles_updated_at"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."handle_updated_at"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_permission"("p_perm" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."has_permission"("p_perm" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_permission"("p_perm" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."log_all_changes"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."log_all_changes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_profile_last_active_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_profile_last_active_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_profile_last_active_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."require_permission"("p_perm" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."require_permission"("p_perm" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."require_permission"("p_perm" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."soft_delete_feedback"("feedback_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."soft_delete_feedback"("feedback_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."soft_delete_feedback"("feedback_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."soft_delete_text"("target_text_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."soft_delete_text"("target_text_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."soft_delete_text"("target_text_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."validate_profile"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."validate_profile"() TO "service_role";






























GRANT ALL ON TABLE "public"."activity_logs" TO "service_role";
GRANT SELECT,INSERT ON TABLE "public"."activity_logs" TO "authenticated";



GRANT ALL ON TABLE "public"."email_opt_outs" TO "anon";
GRANT ALL ON TABLE "public"."email_opt_outs" TO "authenticated";
GRANT ALL ON TABLE "public"."email_opt_outs" TO "service_role";



GRANT ALL ON TABLE "public"."feedback" TO "anon";
GRANT ALL ON TABLE "public"."feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."feedback" TO "service_role";



GRANT ALL ON TABLE "public"."permissions" TO "service_role";



GRANT ALL ON TABLE "public"."profile_last_active_log" TO "anon";
GRANT ALL ON TABLE "public"."profile_last_active_log" TO "authenticated";
GRANT ALL ON TABLE "public"."profile_last_active_log" TO "service_role";



GRANT ALL ON SEQUENCE "public"."profile_last_active_log_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."profile_last_active_log_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."profile_last_active_log_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."survey_categories" TO "anon";
GRANT ALL ON TABLE "public"."survey_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."survey_categories" TO "service_role";



GRANT ALL ON TABLE "public"."survey_votes" TO "anon";
GRANT ALL ON TABLE "public"."survey_votes" TO "authenticated";
GRANT ALL ON TABLE "public"."survey_votes" TO "service_role";



GRANT ALL ON TABLE "public"."profile_vote_summary_v2" TO "anon";
GRANT ALL ON TABLE "public"."profile_vote_summary_v2" TO "authenticated";
GRANT ALL ON TABLE "public"."profile_vote_summary_v2" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."role_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."roles" TO "service_role";



GRANT ALL ON TABLE "public"."texts" TO "anon";
GRANT ALL ON TABLE "public"."texts" TO "authenticated";
GRANT ALL ON TABLE "public"."texts" TO "service_role";



GRANT ALL ON TABLE "public"."school_data_view" TO "anon";
GRANT ALL ON TABLE "public"."school_data_view" TO "authenticated";
GRANT ALL ON TABLE "public"."school_data_view" TO "service_role";



GRANT ALL ON TABLE "public"."site_settings" TO "anon";
GRANT ALL ON TABLE "public"."site_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."site_settings" TO "service_role";



GRANT ALL ON TABLE "public"."texts_memories_preview_v" TO "anon";
GRANT ALL ON TABLE "public"."texts_memories_preview_v" TO "authenticated";
GRANT ALL ON TABLE "public"."texts_memories_preview_v" TO "service_role";



GRANT ALL ON TABLE "public"."texts_memories_v" TO "anon";
GRANT ALL ON TABLE "public"."texts_memories_v" TO "authenticated";
GRANT ALL ON TABLE "public"."texts_memories_v" TO "service_role";



GRANT ALL ON TABLE "public"."texts_self_v" TO "anon";
GRANT ALL ON TABLE "public"."texts_self_v" TO "authenticated";
GRANT ALL ON TABLE "public"."texts_self_v" TO "service_role";



GRANT ALL ON TABLE "public"."user_category_suggestions" TO "anon";
GRANT ALL ON TABLE "public"."user_category_suggestions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_category_suggestions" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































