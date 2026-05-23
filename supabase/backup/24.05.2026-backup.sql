


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

  SELECT r.level::int INTO role_level
  FROM public.roles r
  WHERE r.key = p_role_key;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ROLE_NOT_FOUND';
  END IF;

  IF role_level >= requester_max THEN
    RAISE EXCEPTION 'CANNOT_MODIFY_ROLE_AT_OR_ABOVE_YOUR_LEVEL';
  END IF;

  -- kendinde olmayan yetkiyi veremez
  IF NOT public.has_permission(p_perm_key) THEN
    RAISE EXCEPTION 'CANNOT_GRANT_PERMISSION_YOU_DO_NOT_HAVE';
  END IF;

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
  is_self boolean;
BEGIN
  PERFORM public.require_permission('admin.roles.update');

  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'UNAUTHENTICATED';
  END IF;

  is_self := (target_user_id = auth.uid());

  -- requester max level
  SELECT COALESCE(MAX(r.level), 0)
    INTO requester_max_level
  FROM public.user_roles ur
  JOIN public.roles r ON r.key = ur.role_key
  WHERE ur.user_id = auth.uid();

  -- role to add must exist
  SELECT r.level
    INTO add_role_level
  FROM public.roles r
  WHERE r.key = add_role_key;

  IF add_role_level IS NULL THEN
    RAISE EXCEPTION 'Geçersiz rol: %', add_role_key;
  END IF;

  -- SELF CASE: sadece daha düşük role izin ver
  IF is_self THEN
    -- 1000 isen 999 ver, 1000/1001 verme
    IF add_role_level >= requester_max_level THEN
      RAISE EXCEPTION 'Kendinize aynı veya daha yüksek bir rol atayamazsınız';
    END IF;

    INSERT INTO public.user_roles(user_id, role_key, created_at, set_by, source)
    VALUES (target_user_id, add_role_key, now(), auth.uid(), 'admin_panel_self')
    ON CONFLICT (user_id, role_key) DO NOTHING;

    RETURN;
  END IF;

  -- OTHER USER CASE
  SELECT COALESCE(MAX(r.level), 0)
    INTO target_max_level
  FROM public.user_roles ur
  JOIN public.roles r ON r.key = ur.role_key
  WHERE ur.user_id = target_user_id;

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


CREATE OR REPLACE FUNCTION "public"."admin_create_role"("p_key" "text", "p_label" "text", "p_level" smallint, "p_description" "text" DEFAULT NULL::"text", "p_badge_color" "text" DEFAULT NULL::"text") RETURNS "void"
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

  IF p_level >= requester_max THEN
    RAISE EXCEPTION 'CANNOT_CREATE_ROLE_AT_OR_ABOVE_YOUR_LEVEL';
  END IF;

  IF EXISTS (SELECT 1 FROM public.roles WHERE key = p_key) THEN
    RAISE EXCEPTION 'ROLE_ALREADY_EXISTS';
  END IF;

  INSERT INTO public.roles(key, label, level, description, badge_color)
  VALUES (p_key, p_label, p_level, p_description, p_badge_color);
END;
$$;


ALTER FUNCTION "public"."admin_create_role"("p_key" "text", "p_label" "text", "p_level" smallint, "p_description" "text", "p_badge_color" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_delete_account"("target_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
DECLARE
  caller_level integer;
  target_level integer;
BEGIN
  -- İzin kontrolü
  PERFORM public.require_permission('admin.account.delete');

  -- Caller level (user_roles + roles join)
  SELECT COALESCE(MAX(r.level), 0)
  INTO caller_level
  FROM public.user_roles ur
  JOIN public.roles r ON r.key = ur.role_key
  WHERE ur.user_id = auth.uid();

  -- Target level (aynı pattern)
  SELECT COALESCE(MAX(r.level), 0)
  INTO target_level
  FROM public.user_roles ur
  JOIN public.roles r ON r.key = ur.role_key
  WHERE ur.user_id = target_user_id;

  -- Kendinden üst veya eşit seviyedeki kullanıcıyı silemez
  IF caller_level <= target_level THEN
    RAISE EXCEPTION 'Bu kullanıcıyı silme yetkiniz yok';
  END IF;

  -- Zaten silinmiş mi kontrol et
  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = target_user_id AND deleted_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Bu hesap zaten silinmiş';
  END IF;

  -- Profil soft delete
  UPDATE public.profiles
  SET deleted_at = now()
  WHERE id = target_user_id;

  -- Email opt-out
  INSERT INTO public.email_opt_outs (user_id)
  VALUES (target_user_id)
  ON CONFLICT (user_id)
  DO UPDATE SET updated_at = now();
 
  DELETE FROM auth.sessions
  WHERE user_id = target_user_id;

  -- Auth ban
  UPDATE auth.users
  SET banned_until = 'infinity',
      updated_at = now()
  WHERE id = target_user_id;
END;
$$;


ALTER FUNCTION "public"."admin_delete_account"("target_user_id" "uuid") OWNER TO "postgres";


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

  SELECT COALESCE(level, 0)::int
  INTO role_level
  FROM public.roles
  WHERE key = p_key;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ROLE_NOT_FOUND';
  END IF;

  IF role_level >= requester_max THEN
    RAISE EXCEPTION 'CANNOT_DELETE_ROLE_AT_OR_ABOVE_YOUR_LEVEL';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.user_roles WHERE role_key = p_key
  ) THEN
    RAISE EXCEPTION 'ROLE_IN_USE';
  END IF;

  DELETE FROM public.roles WHERE key = p_key;
END;
$$;


ALTER FUNCTION "public"."admin_delete_role"("p_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_get_role_permissions"("p_role_key" "text") RETURNS TABLE("perm_key" "text")
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
BEGIN
  PERFORM public.require_permission('admin.role_permissions.read');

  RETURN QUERY
  SELECT rp.perm_key
  FROM public.role_permissions rp
  WHERE rp.role_key = p_role_key
  ORDER BY rp.perm_key ASC;
END;
$$;


ALTER FUNCTION "public"."admin_get_role_permissions"("p_role_key" "text") OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."admin_list_permissions"() RETURNS TABLE("perm_key" "text", "description" "text")
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
BEGIN
  PERFORM public.require_permission('admin.role_permissions.read');

  RETURN QUERY
  SELECT p.key, p.description
  FROM public.permissions p
  ORDER BY p.key ASC;
END;
$$;


ALTER FUNCTION "public"."admin_list_permissions"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_list_role_permissions"() RETURNS TABLE("role_key" "text", "perm_key" "text")
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
BEGIN
  PERFORM public.require_permission('admin.role_permissions.read');

  RETURN QUERY
  SELECT rp.role_key, rp.perm_key
  FROM public.role_permissions rp
  ORDER BY rp.role_key, rp.perm_key;
END;
$$;


ALTER FUNCTION "public"."admin_list_role_permissions"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_list_roles"() RETURNS TABLE("role_key" "text", "label" "text", "level" integer, "description" "text", "badge_color" "text")
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
BEGIN
  RETURN QUERY
  SELECT r.key, r.label, r.level::int, r.description, r.badge_color
  FROM public.roles r
  ORDER BY r.level DESC, r.key ASC;
END;
$$;


ALTER FUNCTION "public"."admin_list_roles"() OWNER TO "postgres";


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

  SELECT r.level::int INTO role_level
  FROM public.roles r
  WHERE r.key = p_role_key;

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


CREATE OR REPLACE FUNCTION "public"."admin_restore_account"("target_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
DECLARE
  caller_level integer;
  target_level integer;
BEGIN
  -- İzin kontrolü (silme ile aynı izin)
  PERFORM public.require_permission('admin.account.delete');

  -- Caller level (user_roles + roles join)
  SELECT COALESCE(MAX(r.level), 0)
  INTO caller_level
  FROM public.user_roles ur
  JOIN public.roles r ON r.key = ur.role_key
  WHERE ur.user_id = auth.uid();

  -- Target level
  SELECT COALESCE(MAX(r.level), 0)
  INTO target_level
  FROM public.user_roles ur
  JOIN public.roles r ON r.key = ur.role_key
  WHERE ur.user_id = target_user_id;

  -- Kendinden üst veya eşit seviyedeki kullanıcıyı geri getiremez
  IF caller_level <= target_level THEN
    RAISE EXCEPTION 'Bu kullanıcıyı geri getirme yetkiniz yok';
  END IF;

  -- Silinmemiş hesap kontrolü
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = target_user_id AND deleted_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Bu hesap silinmemiş';
  END IF;

  -- Profil geri getir (deleted_at temizle)
  UPDATE public.profiles
  SET deleted_at = NULL
  WHERE id = target_user_id;

  -- Email opt-out kaldır
  DELETE FROM public.email_opt_outs
  WHERE user_id = target_user_id;

  -- Auth ban kaldır
  UPDATE auth.users
  SET banned_until = NULL,
      updated_at = now()
  WHERE id = target_user_id;
END;
$$;


ALTER FUNCTION "public"."admin_restore_account"("target_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_update_role"("p_key" "text", "p_label" "text", "p_level" smallint, "p_description" "text" DEFAULT NULL::"text", "p_badge_color" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
DECLARE
  requester_max int;
  current_level int;
BEGIN
  PERFORM public.require_permission('admin.roles.update');

  requester_max := public.get_requester_max_role_level();

  SELECT COALESCE(level, 0)::int
  INTO current_level
  FROM public.roles
  WHERE key = p_key;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ROLE_NOT_FOUND';
  END IF;

  IF current_level >= requester_max THEN
    RAISE EXCEPTION 'CANNOT_EDIT_ROLE_AT_OR_ABOVE_YOUR_LEVEL';
  END IF;

  IF p_level IS NULL THEN
    RAISE EXCEPTION 'ROLE_LEVEL_REQUIRED';
  END IF;

  IF p_level >= requester_max THEN
    RAISE EXCEPTION 'CANNOT_SET_ROLE_LEVEL_AT_OR_ABOVE_YOUR_LEVEL';
  END IF;

  -- İsteğe bağlı ama güçlü güvenlik
  IF p_level > current_level THEN
    IF EXISTS (SELECT 1 FROM public.user_roles WHERE role_key = p_key) THEN
      RAISE EXCEPTION 'CANNOT_INCREASE_LEVEL_OF_ASSIGNED_ROLE';
    END IF;
  END IF;

  UPDATE public.roles
  SET
    label = COALESCE(p_label, label),
    level = p_level,
    description = COALESCE(p_description, description),
    badge_color = COALESCE(p_badge_color, badge_color)
  WHERE key = p_key;
END;
$$;


ALTER FUNCTION "public"."admin_update_role"("p_key" "text", "p_label" "text", "p_level" smallint, "p_description" "text", "p_badge_color" "text") OWNER TO "postgres";


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

  ELSIF TG_TABLE_NAME = 'anonymous_texts' THEN
    v_user_id := COALESCE(NEW.text_owner, OLD.text_owner);

  ELSIF TG_TABLE_NAME = 'gallery_photos' THEN
    v_user_id := COALESCE(NEW.user_id, OLD.user_id);

  ELSE
    RAISE EXCEPTION 'Unsupported table: %', TG_TABLE_NAME;
  END IF;

  -- Yılı çek
  SELECT p.user_year
    INTO v_user_year
  FROM public.profiles p
  WHERE p.id = v_user_id;

  IF v_user_year IS NULL THEN
    RAISE EXCEPTION 'USER_YEAR_NOT_FOUND';
  END IF;

  -- Sadece yıl bazlı deadline (global yok)
  SELECT s.value::timestamptz
    INTO v_deadline
  FROM public.site_settings s
  WHERE s.key = 'graduation_date_' || v_user_year::text;

  IF v_deadline IS NULL THEN
    RAISE EXCEPTION 'GRADUATION_DATE_NOT_FOUND_FOR_YEAR_%', v_user_year;
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
    WHERE changed_at < now() - interval '30 days';
    
    DELETE FROM public.profile_last_active_log
    WHERE last_active_at < now() - interval '30 days';

    DELETE FROM public.admin_text_access_log
    WHERE accessed_at < now() - interval '30 days';

    DELETE FROM public.vote_access_logs 
    WHERE created_at < now() - INTERVAL '30 days';

    DELETE FROM public.error_logs 
    WHERE created_at < now() - INTERVAL '30 days';
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

  -- profil zaten var mı?
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = v_uid AND deleted_at IS NULL) THEN
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

    -- Default rol: user
    INSERT INTO public.user_roles (user_id, role_key, set_by, source)
    VALUES (v_uid, 'user', v_uid, 'complete_profile')
    ON CONFLICT (user_id, role_key) DO NOTHING;

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
      RETURN jsonb_build_object('success', false, 'error', 'Kullanıcı kaydı bulunamadı.');

    WHEN others THEN
      RETURN jsonb_build_object('success', false, 'error', sqlerrm);
  END;
END;
$$;


ALTER FUNCTION "public"."complete_profile"("p_first_name" "text", "p_last_name" "text", "p_school_number" "text", "p_class_room" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_own_account"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
DECLARE
  v_uid uuid;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Profil soft delete
  UPDATE public.profiles
  SET deleted_at = now()
  WHERE id = v_uid;

  -- Email opt-out (silince otomatik abonelikten çıkar)
  INSERT INTO public.email_opt_outs (user_id)
  VALUES (v_uid)
  ON CONFLICT (user_id)
  DO UPDATE SET updated_at = now();

  -- Auth ban
  UPDATE auth.users
  SET banned_until = 'infinity',
      updated_at = now()
  WHERE id = v_uid;
END;
$$;


ALTER FUNCTION "public"."delete_own_account"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_user_session"("p_session_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    DELETE FROM auth.sessions
    WHERE auth.sessions.id = p_session_id 
      AND auth.sessions.user_id = auth.uid();
      
    RETURN FOUND;
END;
$$;


ALTER FUNCTION "public"."delete_user_session"("p_session_id" "uuid") OWNER TO "postgres";


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
$$;


ALTER FUNCTION "public"."get_admin_category_votes"("p_category_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_admin_gallery_photos"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
DECLARE
    v_result jsonb;
BEGIN
    -- Yetki kontrolü
    PERFORM public.require_permission('admin.gallery.view');

    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', gp.id,
            'user_id', gp.user_id,
            'storage_path', gp.storage_path,
            'file_name', gp.file_name,
            'file_size', gp.file_size,
            'caption', gp.caption,
            'created_at', gp.created_at,
            'profiles', jsonb_build_object(
                'first_name', p.first_name,
                'last_name', p.last_name,
                'school_number', p.school_number,
                'class', p.class,
                'user_year', p.user_year
            )
        ) ORDER BY gp.created_at DESC
    ), '[]'::jsonb)
    INTO v_result
    FROM public.gallery_photos gp
    JOIN public.profiles p ON p.id = gp.user_id
    WHERE p.deleted_at IS NULL;

    RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_admin_gallery_photos"() OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."get_admin_text_access_logs"("p_limit" integer DEFAULT 200) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- Yetki kontrolü
    PERFORM public.require_permission('system.texts.access_log');

    RETURN (
        SELECT COALESCE(json_agg(row_data), '[]'::json)
        FROM (
            SELECT json_build_object(
                'id', log.id,
                'admin_id', log.admin_id,
                'text_id', log.text_id,
                'anonymous_text_id', log.anonymous_text_id,
                'text_type', log.text_type,
                'accessed_at', log.accessed_at,
                'admin', json_build_object(
                    'first_name', ap.first_name,
                    'last_name', ap.last_name,
                    'class', ap.class,
                    'school_number', ap.school_number
                ),
                'target_info', CASE
                    WHEN log.text_type = 'text' THEN (
                        SELECT json_build_object(
                            'author_name', aup.first_name || ' ' || aup.last_name,
                            'recipient_name', rup.first_name || ' ' || rup.last_name
                        )
                        FROM texts t
                        LEFT JOIN profiles aup ON t.author_id = aup.id
                        LEFT JOIN profiles rup ON t.recipient_id = rup.id
                        WHERE t.id = log.text_id
                    )
                    WHEN log.text_type = 'anonymous_text' THEN (
                        SELECT json_build_object(
                            'author_name', at.display_name,
                            'recipient_name', rup.first_name || ' ' || rup.last_name
                        )
                        FROM anonymous_texts at
                        LEFT JOIN profiles rup ON at.recipient_id = rup.id
                        WHERE at.id = log.anonymous_text_id
                    )
                    ELSE NULL
                END
            ) AS row_data
            FROM admin_text_access_log log
            LEFT JOIN profiles ap ON log.admin_id = ap.id
            ORDER BY log.accessed_at DESC
            LIMIT p_limit
        ) sub
    );
END;
$$;


ALTER FUNCTION "public"."get_admin_text_access_logs"("p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_admin_texts_export"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_items json;
BEGIN
  PERFORM public.require_permission('admin.texts.metadata');

  WITH unified AS (
    SELECT
      t.author_id,
      t.recipient_id,
      r.first_name || ' ' || r.last_name AS recipient_name,
      r.school_number AS recipient_school_number,
      r.class AS recipient_class,
      r.user_year AS recipient_year,
      a.first_name || ' ' || a.last_name AS author_name,
      a.school_number AS author_school_number,
      a.class AS author_class,
      a.user_year AS author_year,
      t.content,
      t.created_at,
      false AS is_anonymous
    FROM public.texts t
    JOIN public.profiles r ON t.recipient_id = r.id
    JOIN public.profiles a ON t.author_id = a.id
    WHERE t.is_active = true

    UNION ALL

    SELECT
      NULL::uuid AS author_id,
      at.recipient_id,
      r.first_name || ' ' || r.last_name AS recipient_name,
      r.school_number AS recipient_school_number,
      r.class AS recipient_class,
      r.user_year AS recipient_year,
      at.display_name AS author_name,
      NULL AS author_school_number,
      NULL AS author_class,
      NULL AS author_year,
      at.content,
      at.created_at,
      true AS is_anonymous
    FROM public.anonymous_texts at
    JOIN public.profiles r ON at.recipient_id = r.id
    WHERE at.is_active = true
  )
  SELECT COALESCE(json_agg(row_to_json(u)), '[]'::json)
  INTO v_items
  FROM (
    SELECT * FROM unified
    ORDER BY recipient_class, recipient_school_number, created_at ASC
  ) u;

  RETURN v_items;
END;
$$;


ALTER FUNCTION "public"."get_admin_texts_export"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_admin_texts_page"("p_limit" integer DEFAULT 50, "p_offset" integer DEFAULT 0, "p_author_search" "text" DEFAULT NULL::"text", "p_recipient_search" "text" DEFAULT NULL::"text", "p_filter" "text" DEFAULT 'all'::"text", "p_author_class" "text" DEFAULT NULL::"text", "p_recipient_class" "text" DEFAULT NULL::"text", "p_year" integer DEFAULT NULL::integer, "p_sort" "text" DEFAULT 'newest'::"text", "p_user_id" "uuid" DEFAULT NULL::"uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_total   bigint;
  v_all     bigint;
  v_self    bigint;
  v_others  bigint;
  v_anon    bigint;
  v_classes json;
  v_years   json;
  v_items   json;
BEGIN
  PERFORM public.require_permission('admin.texts.metadata');

  -- ─── 1. Global stats (hafif, profile join yok) ───
  SELECT
    count(*),
    count(*) FILTER (WHERE NOT _anon AND _aid = _rid),
    count(*) FILTER (WHERE NOT _anon AND _aid IS DISTINCT FROM _rid AND _aid IS NOT NULL),
    count(*) FILTER (WHERE _anon)
  INTO v_all, v_self, v_others, v_anon
  FROM (
    SELECT false AS _anon, t.author_id AS _aid, t.recipient_id AS _rid
    FROM public.texts t
    WHERE t.is_active = true
      AND (p_user_id IS NULL OR t.author_id = p_user_id OR t.recipient_id = p_user_id)
    UNION ALL
    SELECT true AS _anon, NULL::uuid AS _aid, at.recipient_id AS _rid
    FROM public.anonymous_texts at
    WHERE at.is_active = true
      AND (p_user_id IS NULL OR at.recipient_id = p_user_id)
  ) s;

  -- ─── 2. Distinct sınıf listesi ───
  SELECT COALESCE(json_agg(c), '[]'::json) INTO v_classes
  FROM (SELECT DISTINCT class AS c FROM public.profiles WHERE class IS NOT NULL ORDER BY class) sub;

  -- ─── 3. Distinct yıllar ───
  SELECT COALESCE(json_agg(y), '[]'::json) INTO v_years
  FROM (SELECT DISTINCT user_year AS y FROM public.profiles WHERE user_year IS NOT NULL ORDER BY user_year DESC) sub;

  -- ─── 4. Filtrelenmiş total + sayfalanmış items (TEK WITH BLOĞU) ───
  WITH unified AS (
    SELECT
      t.id::text           AS id,
      t.created_at,
      length(t.content)    AS content_length,
      false                AS is_anonymous,
      NULL::text           AS display_name,
      t.author_id,
      t.recipient_id,
      json_build_object(
        'id', a.id, 'first_name', a.first_name, 'last_name', a.last_name,
        'school_number', a.school_number, 'class', a.class, 'user_year', a.user_year
      ) AS author,
      json_build_object(
        'id', r.id, 'first_name', r.first_name, 'last_name', r.last_name,
        'school_number', r.school_number, 'class', r.class, 'user_year', r.user_year
      ) AS recipient
    FROM public.texts t
    LEFT JOIN public.profiles a ON t.author_id = a.id
    LEFT JOIN public.profiles r ON t.recipient_id = r.id
    WHERE t.is_active = true
      AND (p_user_id IS NULL OR t.author_id = p_user_id OR t.recipient_id = p_user_id)

    UNION ALL

    SELECT
      ('anon_' || at.id::text) AS id,
      at.created_at,
      length(at.content)       AS content_length,
      true                     AS is_anonymous,
      at.display_name,
      NULL::uuid               AS author_id,
      at.recipient_id,
      NULL::json               AS author,
      json_build_object(
        'id', r.id, 'first_name', r.first_name, 'last_name', r.last_name,
        'school_number', r.school_number, 'class', r.class, 'user_year', r.user_year
      ) AS recipient
    FROM public.anonymous_texts at
    LEFT JOIN public.profiles r ON at.recipient_id = r.id
    WHERE at.is_active = true
      AND (p_user_id IS NULL OR at.recipient_id = p_user_id)
  ),
  filtered AS (
    SELECT *
    FROM unified u
    WHERE
      (
        p_filter = 'all'
        OR (p_filter = 'anonymous' AND u.is_anonymous = true)
        OR (p_filter = 'self'      AND u.is_anonymous = false AND u.author_id = u.recipient_id)
        OR (p_filter = 'others'    AND u.is_anonymous = false AND u.author_id <> u.recipient_id)
      )
      AND (
        p_author_class IS NULL
        OR (u.is_anonymous = false AND (u.author->>'class') = p_author_class)
      )
      AND (
        p_recipient_class IS NULL
        OR ((u.recipient->>'class') = p_recipient_class)
      )
      AND (
        p_year IS NULL
        OR (u.recipient->>'user_year')::int = p_year
        OR (u.is_anonymous = false AND (u.author->>'user_year')::int = p_year)
      )
      AND (
        p_author_search IS NULL OR p_author_search = ''
        OR (
          u.is_anonymous = true AND (
            lower(coalesce(u.display_name,'')) LIKE '%' || lower(p_author_search) || '%'
          )
        )
        OR (
          u.is_anonymous = false AND (
            lower(coalesce(u.author->>'first_name','') || ' ' || coalesce(u.author->>'last_name',''))
              LIKE '%' || lower(p_author_search) || '%'
            OR coalesce(u.author->>'school_number','') LIKE '%' || p_author_search || '%'
          )
        )
      )
      AND (
        p_recipient_search IS NULL OR p_recipient_search = ''
        OR (
          lower(coalesce(u.recipient->>'first_name','') || ' ' || coalesce(u.recipient->>'last_name',''))
            LIKE '%' || lower(p_recipient_search) || '%'
          OR coalesce(u.recipient->>'school_number','') LIKE '%' || p_recipient_search || '%'
        )
      )
  ),
  paged AS (
    SELECT
      json_build_object(
        'id',             f.id,
        'created_at',     f.created_at,
        'content_length', f.content_length,
        'isAnonymous',    f.is_anonymous,
        'display_name',   f.display_name,
        'author',         f.author,
        'recipient',      f.recipient
      ) AS x,
      f.created_at AS created_at_sort
    FROM filtered f
    ORDER BY
      CASE WHEN p_sort = 'oldest' THEN f.created_at END ASC,
      CASE WHEN p_sort <> 'oldest' THEN f.created_at END DESC
    LIMIT p_limit OFFSET p_offset
  )
  SELECT
    (SELECT count(*) FROM filtered),
    COALESCE(
      (
        SELECT json_agg(
          p.x
          ORDER BY
            CASE WHEN p_sort = 'oldest' THEN p.created_at_sort END ASC,
            CASE WHEN p_sort <> 'oldest' THEN p.created_at_sort END DESC
        )
        FROM paged p
      ),
      '[]'::json
    )
  INTO v_total, v_items;

  RETURN json_build_object(
    'total', v_total,
    'stats', json_build_object(
      'all',       v_all,
      'self',      v_self,
      'others',    v_others,
      'anonymous', v_anon
    ),
    'classes', v_classes,
    'years',   v_years,
    'items', v_items
  );
END;
$$;


ALTER FUNCTION "public"."get_admin_texts_page"("p_limit" integer, "p_offset" integer, "p_author_search" "text", "p_recipient_search" "text", "p_filter" "text", "p_author_class" "text", "p_recipient_class" "text", "p_year" integer, "p_sort" "text", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_admin_users_list"("class_filter" "text" DEFAULT NULL::"text", "search_query" "text" DEFAULT NULL::"text", "sort_by" "text" DEFAULT 'role'::"text") RETURNS TABLE("id" "uuid", "first_name" "text", "last_name" "text", "school_number" "text", "class" "text", "user_year" smallint, "last_active" timestamp with time zone, "role_level" integer, "highest_role_key" "text", "is_deleted" boolean, "deleted_at" timestamp with time zone)
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
  ),
  user_last_active AS (
    SELECT DISTINCT ON (pal.profile_id)
      pal.profile_id,
      pal.last_active_at
    FROM public.profile_last_active_log pal
    ORDER BY pal.profile_id, pal.last_active_at DESC
  )
  SELECT
    p.id,
    p.first_name,
    p.last_name,
    p.school_number,
    p.class,
    p.user_year,
    ula.last_active_at AS last_active,
    COALESCE(urm.role_level, 0) AS role_level,
    COALESCE(urm.highest_role_key, 'user') AS highest_role_key,
    (p.deleted_at IS NOT NULL) AS is_deleted,
    p.deleted_at
  FROM public.profiles p
  LEFT JOIN user_role_max urm ON urm.user_id = p.id
  LEFT JOIN user_last_active ula ON ula.profile_id = p.id
  WHERE
    (class_filter IS NULL OR class_filter = '' OR p.class = class_filter)
    AND (
      search_query IS NULL OR search_query = '' OR
      LOWER(p.first_name || ' ' || p.last_name) LIKE '%' || LOWER(search_query) || '%' OR
      p.school_number::TEXT LIKE '%' || search_query || '%'
    )
  ORDER BY
    CASE WHEN sort_by = 'last_active' THEN ula.last_active_at END DESC NULLS LAST,
    CASE WHEN sort_by = 'role' THEN COALESCE(urm.role_level, 0) END DESC,
    p.last_name ASC;
END;
$$;


ALTER FUNCTION "public"."get_admin_users_list"("class_filter" "text", "search_query" "text", "sort_by" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_admin_vote_access_logs"("p_limit" integer DEFAULT 100) RETURNS TABLE("id" "uuid", "admin_id" "uuid", "category_id" "text", "accessed_at" timestamp with time zone, "admin" json, "category_info" json)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."get_admin_vote_access_logs"("p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_admin_votes"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  PERFORM public.require_permission('admin.votes.metadata');

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
          )
          ORDER BY COALESCE(vote_counts.total, 0) DESC
        ), '[]'::json)
        FROM survey_categories sc
        LEFT JOIN (
          SELECT category_id, COUNT(*)::integer AS total
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
            'vote_count', ranked.vote_count,
            'rank', ranked.rn
          )
          ORDER BY sc.id, ranked.rn
        ), '[]'::json)
        FROM (
          SELECT
            pvs.voted_for_id,
            pvs.category_id,
            pvs.vote_count,
            ROW_NUMBER() OVER (
              PARTITION BY pvs.category_id
              ORDER BY pvs.vote_count DESC, pvs.voted_for_id
            ) AS rn
          FROM profile_vote_summary_v2 pvs
          JOIN survey_categories sc2 ON sc2.id = pvs.category_id
          WHERE sc2.is_active = true
        ) ranked
        JOIN profiles p ON p.id = ranked.voted_for_id
        JOIN survey_categories sc ON sc.id = ranked.category_id
        WHERE ranked.rn <= 3
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
    LANGUAGE "sql" SECURITY DEFINER
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
      AND p.deleted_at IS NULL
  ),
  class_counts AS (
    SELECT
      p.class,
      p.user_year,
      (COUNT(*)::integer - 1) AS class_size
    FROM public.profiles p
    WHERE p.deleted_at IS NULL
    GROUP BY p.class, p.user_year
  ),
  text_stats AS (
    SELECT
      t.author_id AS user_id,
      COUNT(DISTINCT t.recipient_id)::integer AS messages_sent
    FROM public.texts t
    JOIN public.profiles author
      ON t.author_id = author.id
     AND author.deleted_at IS NULL
    JOIN public.profiles recipient
      ON t.recipient_id = recipient.id
     AND recipient.deleted_at IS NULL
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
    u_last_active timestamptz;

    v_written_count int := 0;
    v_received_count int := 0;
    v_received_normal int := 0;
    v_received_anon int := 0;

    v_total_words int := 0;
    v_last_text_date timestamptz := NULL;

    v_class_size int := 0;
    v_written_unique_count int := 0;

    v_deadline text := NULL;

    v_grad_year_raw text := NULL;
    v_grad_year_ts timestamptz := NULL;
    v_is_unlocked boolean := false;
    v_days_left integer := NULL;

    v_suggested_classmate json := NULL;
    res json;
BEGIN
    IF u_id IS NULL THEN
        RETURN NULL;
    END IF;

    -- Profil var mı + soft delete kontrol
    SELECT p.class, p.user_year
    INTO u_class, u_year
    FROM public.profiles p
    WHERE p.id = u_id
      AND p.deleted_at IS NULL;

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    -- last_active'ı log tablosundan çek (en son event)
    SELECT pll.last_active_at
    INTO u_last_active
    FROM public.profile_last_active_log pll
    WHERE pll.profile_id = u_id
    ORDER BY pll.last_active_at DESC
    LIMIT 1;

    -- 5 dk throttle: sadece gerekiyorsa log'a yaz
    IF u_last_active IS NULL OR u_last_active < (now() - INTERVAL '5 minutes') THEN
        INSERT INTO public.profile_last_active_log (profile_id, last_active_at)
        VALUES (u_id, now());
        u_last_active := now();
    END IF;

    -- Settings (deadline + sadece o yılın graduation_date)
    SELECT
      MAX(CASE WHEN s.key = 'deadline' THEN s.value END),
      MAX(CASE WHEN s.key = ('graduation_date_' || u_year::text) THEN s.value END)
    INTO v_deadline, v_grad_year_raw
    FROM public.site_settings s
    WHERE s.key IN ('deadline', ('graduation_date_' || u_year::text));

    v_deadline := NULLIF(btrim(v_deadline), '');
    v_grad_year_raw := NULLIF(btrim(v_grad_year_raw), '');

    IF v_grad_year_raw IS NOT NULL THEN
        BEGIN
            v_grad_year_ts := v_grad_year_raw::timestamptz;
        EXCEPTION WHEN others THEN
            v_grad_year_ts := NULL;
        END;
    END IF;

    v_is_unlocked := (v_grad_year_ts IS NOT NULL) AND (now() >= v_grad_year_ts);

    IF v_grad_year_ts IS NULL THEN
        v_days_left := NULL;
    ELSIF v_is_unlocked THEN
        v_days_left := 0;
    ELSE
        v_days_left := GREATEST(
          0,
          CEIL(EXTRACT(EPOCH FROM (v_grad_year_ts - now())) / 86400)::int
        );
    END IF;

    -- written stats
    SELECT
        COUNT(*)::int,
        COALESCE(SUM(regexp_count(t.content, '[[:alpha:]]+(?:[''’.-][[:alpha:]]+)*'))::int, 0),
        MAX(t.updated_at)
    INTO v_written_count, v_total_words, v_last_text_date
    FROM public.texts t
    WHERE t.author_id = u_id
      AND t.is_active = true
      AND t.author_id <> t.recipient_id;

    -- received normal texts
    SELECT COUNT(*)::int
    INTO v_received_normal
    FROM public.texts t
    WHERE t.recipient_id = u_id
      AND t.is_active = true
      AND t.author_id <> t.recipient_id;

    -- received anonymous texts
    SELECT COUNT(*)::int
    INTO v_received_anon
    FROM public.anonymous_texts at
    WHERE at.recipient_id = u_id
      AND at.is_active = true;

    v_received_count := v_received_normal + v_received_anon;

    -- class size (silinenleri KATMA!)
    IF u_class IS NOT NULL THEN
        SELECT COUNT(*)::int
        INTO v_class_size
        FROM public.profiles p
        WHERE p.class = u_class
          AND p.user_year IS NOT DISTINCT FROM u_year
          AND p.id <> u_id
          AND p.deleted_at IS NULL;

        SELECT COUNT(DISTINCT t.recipient_id)::int
        INTO v_written_unique_count
        FROM public.texts t
        JOIN public.profiles p ON p.id = t.recipient_id
        WHERE t.author_id = u_id
          AND t.is_active = true
          AND t.author_id <> t.recipient_id
          AND p.class = u_class
          AND p.user_year IS NOT DISTINCT FROM u_year
          AND p.deleted_at IS NULL;

        SELECT json_build_object(
            'id', p.id,
            'first_name', p.first_name,
            'last_name', p.last_name,
            'school_number', p.school_number,
            'user_year', p.user_year
        )
        INTO v_suggested_classmate
        FROM public.profiles p
        WHERE p.class = u_class
          AND p.user_year IS NOT DISTINCT FROM u_year
          AND p.id <> u_id
          AND p.deleted_at IS NULL
          AND NOT EXISTS (
              SELECT 1
              FROM public.texts t
              WHERE t.author_id = u_id
                AND t.recipient_id = p.id
                AND t.is_active = true
                AND t.author_id <> t.recipient_id
          )
        ORDER BY random()
        LIMIT 1;
    END IF;

    SELECT json_build_object(
        'profile', json_build_object(
            'first_name', pr.first_name,
            'last_name', pr.last_name,
            'class', pr.class,
            'school_number', pr.school_number,
            'user_year', pr.user_year
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
        'survey_stats', json_build_object(
            'total', (SELECT count(*)::int FROM public.survey_categories WHERE is_active = true),
            'voted', (SELECT count(*)::int FROM public.survey_votes WHERE voter_id = u_id)
        ),
        'system_info', json_build_object(
            'deadline', v_deadline,
            'graduation_date', v_grad_year_raw,
            'is_unlocked', v_is_unlocked,
            'days_until_unlock', v_days_left
        ),
        'activity', json_build_object(
            'last_active', u_last_active
        )
    )
    INTO res
    FROM public.profiles pr
    WHERE pr.id = u_id
      AND pr.deleted_at IS NULL;

    RETURN res;
END;
$$;


ALTER FUNCTION "public"."get_dashboard_data_v4"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_gallery_photos"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
DECLARE
    v_uid uuid;
    v_result jsonb;
BEGIN
    v_uid := auth.uid();
    
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'UNAUTHENTICATED';
    END IF;

    SELECT COALESCE(jsonb_agg(photo_row ORDER BY photo_row->>'created_at' DESC), '[]'::jsonb)
    INTO v_result
    FROM (
        SELECT jsonb_build_object(
            'id', gp.id,
            'user_id', gp.user_id,
            'storage_path', gp.storage_path,
            'file_name', gp.file_name,
            'file_size', gp.file_size,
            'caption', gp.caption,
            'created_at', gp.created_at,
            'is_unlocked', true, -- Kendi fotoğrafı olduğu için varsayılan true
            'profiles', jsonb_build_object(
                'first_name', p.first_name,
                'last_name', p.last_name,
                'school_number', p.school_number,
                'class', p.class,
                'user_year', p.user_year
            )
        ) AS photo_row
        FROM public.gallery_photos gp
        JOIN public.profiles p ON p.id = gp.user_id
        WHERE gp.user_id = v_uid 
          AND p.deleted_at IS NULL
    ) sub;

    RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_gallery_photos"() OWNER TO "postgres";


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
    AS $$
DECLARE
    v_profile record;
    v_profile_id uuid;
    v_user_year smallint;

    v_unlock_date timestamp;
    v_is_unlocked boolean;
    v_days_left integer;

    v_grad_year text;

    v_memories jsonb := '[]'::jsonb;
    v_memories_preview jsonb := '[]'::jsonb;
    v_self_memories jsonb := '[]'::jsonb;
    v_categories jsonb := '[]'::jsonb;

    v_photos jsonb := '[]'::jsonb;
    v_photos_preview jsonb := '[]'::jsonb;

    v_anon_received jsonb := '[]'::jsonb;
    v_anon_received_preview jsonb := '[]'::jsonb;
BEGIN
    -- 1) Profil + sayımlar (view üzerinden)
    SELECT *
    INTO v_profile
    FROM public.school_data_view
    WHERE school_number = target_school_number
      AND (target_year IS NULL OR user_year = target_year)
    ORDER BY user_year DESC NULLS LAST
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    v_profile_id := v_profile.id;
    v_user_year := v_profile.user_year;

    -- 2) Unlock hesabı
    SELECT value INTO v_grad_year
    FROM public.site_settings
    WHERE key = 'graduation_date_' || v_user_year::text
    LIMIT 1;

    v_unlock_date := v_grad_year::timestamp;

    v_unlock_date := COALESCE(v_unlock_date, '2099-01-01 00:00:00'::timestamp);
    v_is_unlocked := CURRENT_TIMESTAMP >= v_unlock_date;
    v_days_left := CASE WHEN v_is_unlocked THEN 0 ELSE GREATEST(0, CEIL(EXTRACT(EPOCH FROM (v_unlock_date - CURRENT_TIMESTAMP)) / 86400)::int) END;

    -- 3) Preview (her zaman, content yok)
    -- Memories Preview
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', t.id,
            'created_at', t.created_at,
            'updated_at', t.updated_at,
            'author_id', t.author_id,
            'author', jsonb_build_object(
                'first_name', a.first_name,
                'last_name', a.last_name,
                'school_number', a.school_number,
                'class', a.class,
                'user_year', a.user_year
            )
        ) ORDER BY t.created_at DESC
    ), '[]'::jsonb)
    INTO v_memories_preview
    FROM public.texts t
    JOIN public.profiles a ON a.id = t.author_id
    WHERE t.is_active = true
      AND t.recipient_id = v_profile_id
      AND t.author_id <> t.recipient_id;

    -- Photos Preview (kilitliyken sadece yapısal veri)
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', gp.id,
            'created_at', gp.created_at
        ) ORDER BY gp.created_at DESC
    ), '[]'::jsonb)
    INTO v_photos_preview
    FROM public.gallery_photos gp
    WHERE gp.user_id = v_profile_id;

    -- Anonymous Preview (content yok)
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', at.id,
            'display_name', at.display_name,
            'created_at', at.created_at,
            'updated_at', at.updated_at
        ) ORDER BY at.created_at DESC
    ), '[]'::jsonb)
    INTO v_anon_received_preview
    FROM public.anonymous_texts at
    WHERE at.is_active = true
      AND at.recipient_id = v_profile_id;

    -- 4) Unlock datalar
    IF v_is_unlocked THEN
        -- Full memories
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'id', t.id,
                'content', t.content,
                'created_at', t.created_at,
                'updated_at', t.updated_at,
                'author_id', t.author_id,
                'author', jsonb_build_object(
                    'first_name', a.first_name,
                    'last_name', a.last_name,
                    'school_number', a.school_number,
                    'class', a.class,
                    'user_year', a.user_year
                )
            ) ORDER BY t.created_at DESC
        ), '[]'::jsonb)
        INTO v_memories
        FROM public.texts t
        JOIN public.profiles a ON a.id = t.author_id
        WHERE t.is_active = true
          AND t.recipient_id = v_profile_id
          AND t.author_id <> t.recipient_id;

        -- Full Photos
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'id', gp.id,
                'storage_path', gp.storage_path,
                'file_name', gp.file_name,
                'file_size', gp.file_size,
                'caption', gp.caption,
                'created_at', gp.created_at
            ) ORDER BY gp.created_at DESC
        ), '[]'::jsonb)
        INTO v_photos
        FROM public.gallery_photos gp
        WHERE gp.user_id = v_profile_id;

        -- Self memories
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'id', t.id,
                'content', t.content,
                'created_at', t.created_at,
                'updated_at', t.updated_at,
                'author_id', t.author_id,
                'recipient_id', t.recipient_id,
                'author', jsonb_build_object(
                    'first_name', a.first_name,
                    'last_name', a.last_name,
                    'school_number', a.school_number,
                    'class', a.class,
                    'user_year', a.user_year
                )
            ) ORDER BY t.created_at DESC
        ), '[]'::jsonb)
        INTO v_self_memories
        FROM public.texts t
        JOIN public.profiles a ON a.id = t.author_id
        WHERE t.is_active = true
          AND t.recipient_id = v_profile_id
          AND t.author_id = t.recipient_id;

        -- Categories
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'category', jsonb_build_object(
                    'id', sc.id,
                    'title', sc.title,
                    'emoji', sc.emoji,
                    'color', sc.color
                ),
                'count', COALESCE(pvs.vote_count, 0)
            ) ORDER BY COALESCE(pvs.vote_count,0) DESC, sc.sort_order ASC
        ), '[]'::jsonb)
        INTO v_categories
        FROM public.survey_categories sc
        LEFT JOIN public.profile_vote_summary_v2 pvs
            ON sc.id = pvs.category_id
           AND pvs.voted_for_id = v_profile_id
        WHERE sc.is_active = true;

        -- Anonymous received
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'id', at.id,
                'display_name', at.display_name,
                'content', at.content,
                'created_at', at.created_at,
                'updated_at', at.updated_at
            ) ORDER BY at.created_at DESC
        ), '[]'::jsonb)
        INTO v_anon_received
        FROM public.anonymous_texts at
        WHERE at.is_active = true
          AND at.recipient_id = v_profile_id;
    END IF;

    RETURN json_build_object(
        'profile', json_build_object(
            'id', v_profile.id,
            'first_name', v_profile.first_name,
            'last_name', v_profile.last_name,
            'school_number', v_profile.school_number,
            'class', v_profile.class,
            'user_year', v_profile.user_year
        ),
        'receivedCount', v_profile.total_texts_received,
        'writtenCount', v_profile.total_texts_written,
        'totalVotes', v_profile.total_votes,
        'is_unlocked', v_is_unlocked,
        'days_until_unlock', v_days_left,
        'memories', COALESCE(v_memories, '[]'::jsonb)::json,
        'memories_preview', COALESCE(v_memories_preview, '[]'::jsonb)::json,
        'photos', COALESCE(v_photos, '[]'::jsonb)::json,
        'photos_preview', COALESCE(v_photos_preview, '[]'::jsonb)::json,
        'self_memories', COALESCE(v_self_memories, '[]'::jsonb)::json,
        'categories', COALESCE(v_categories, '[]'::jsonb)::json,
        'anonymous_received', COALESCE(v_anon_received, '[]'::jsonb)::json,
        'anonymous_received_preview', COALESCE(v_anon_received_preview, '[]'::jsonb)::json
    );
END;
$$;


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
  v_anon_texts_count integer;
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
    into v_anon_texts_count
  from public.anonymous_texts
  where is_active is true;

  select count(*)::integer
    into v_votes_count
  from public.survey_votes;

  return json_build_object(
    'users', v_users_count,
    'active_texts', v_texts_count,
    'active_anonymous_texts', v_anon_texts_count,
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


CREATE OR REPLACE FUNCTION "public"."get_school_data"("target_year" smallint DEFAULT NULL::smallint) RETURNS TABLE("id" "uuid", "first_name" "text", "last_name" "text", "school_number" "text", "class" "text", "user_year" smallint, "total_texts_received" bigint, "total_texts_written" bigint, "total_words_received" bigint, "total_words_written" bigint, "total_votes" numeric)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT
    v.id,
    v.first_name,
    v.last_name,
    v.school_number,
    v.class,
    v.user_year,
    v.total_texts_received::bigint,
    v.total_texts_written::bigint,
    v.total_words_received::bigint,
    v.total_words_written::bigint,
    v.total_votes::numeric
  FROM public.school_data_view v
  WHERE (target_year IS NULL OR v.user_year = target_year)
  ORDER BY v.class ASC, v.first_name ASC;
$$;


ALTER FUNCTION "public"."get_school_data"("target_year" smallint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_sessions"() RETURNS TABLE("id" "uuid", "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "user_agent" "text", "ip" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.created_at,
        s.updated_at,
        s.user_agent,
        s.ip::text
    FROM auth.sessions s
    WHERE s.user_id = auth.uid()
    ORDER BY s.updated_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_user_sessions"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at := now();
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


CREATE OR REPLACE FUNCTION "public"."healthcheck"() RETURNS "text"
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT 'ok';
$$;


ALTER FUNCTION "public"."healthcheck"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_anonymous_text"("p_recipient_id" "uuid", "p_content" "text", "p_display_name" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_owner uuid;
  v_name  text;
  v_messaging boolean;
  v_content text;
BEGIN
  -- 1) Auth kontrolü
  v_owner := auth.uid();
  IF v_owner IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Oturum açılmamış.');
  END IF;

  -- 2) Messaging açık mı?
  SELECT COALESCE(s.value = 'true', false)
    INTO v_messaging
    FROM public.site_settings s
   WHERE s.key = 'messaging_enabled';

  IF NOT v_messaging THEN
    RETURN jsonb_build_object('success', false, 'error', 'Mesaj yazma şu anda kapalıdır.');
  END IF;

  -- 3) Kendine yazma engeli
  IF v_owner = p_recipient_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Kendinize anonim mesaj yazamazsınız.');
  END IF;

  -- 4) Alıcı var mı?
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_recipient_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Alıcı bulunamadı.');
  END IF;

  -- 5) display_name: boşsa 'Anonim'
  v_name := COALESCE(NULLIF(btrim(p_display_name), ''), 'Anonim');

  -- 5.1) content trim + boş kontrol (CHECK constraint var ama hata mesajını düzgün döndürelim)
  v_content := btrim(COALESCE(p_content, ''));
  IF char_length(v_content) < 1 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Mesaj boş olamaz.');
  END IF;

  -- 6) Aynı kişi çiftinde eski aktifleri kapat (varsa)
  UPDATE public.anonymous_texts
     SET is_active = false
   WHERE text_owner = v_owner
     AND recipient_id = p_recipient_id
     AND is_active = true;

  -- 7) Yeni aktif mesajı ekle
  INSERT INTO public.anonymous_texts (text_owner, recipient_id, display_name, content, is_active)
  VALUES (v_owner, p_recipient_id, v_name, v_content, true);

  RETURN jsonb_build_object('success', true, 'message', 'Anonim mesaj kaydedildi.');

EXCEPTION
  WHEN unique_violation THEN
    -- Bu artık normalde olmamalı; olursa concurrency/race vardır
    RETURN jsonb_build_object('success', false, 'error', 'İşlem çakıştı, tekrar deneyin.');
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


ALTER FUNCTION "public"."insert_anonymous_text"("p_recipient_id" "uuid", "p_content" "text", "p_display_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_all_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_user_ok boolean := false;

  v_old jsonb := NULL;
  v_new jsonb := NULL;

  v_row jsonb;
  v_record_id text := 'unknown';
  v_pk_cols text[];
  v_col text;
  v_parts text[] := ARRAY[]::text[];
BEGIN
  -- actor profiles'ta var mı?
  IF v_user_id IS NOT NULL THEN
    SELECT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = v_user_id) INTO v_user_ok;
  END IF;

  -- gereksiz profiles update filtresi (sende zaten var)
  IF TG_TABLE_NAME = 'profiles' AND TG_OP = 'UPDATE' THEN
    IF OLD.first_name = NEW.first_name AND 
       OLD.last_name = NEW.last_name AND 
       OLD.school_number = NEW.school_number AND 
       OLD.class = NEW.class AND
       (OLD.user_year IS NOT DISTINCT FROM NEW.user_year) THEN
      RETURN NEW;
    END IF;
  END IF;

  -- OLD/NEW hazırla
  IF TG_OP = 'INSERT' THEN
    v_new := to_jsonb(NEW);
    v_row := v_new;
  ELSIF TG_OP = 'UPDATE' THEN
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    v_row := v_new;
  ELSE -- DELETE
    v_old := to_jsonb(OLD);
    v_row := v_old;
  END IF;

  -- PK kolonlarını bul (public schema varsayımı)
  SELECT array_agg(a.attname ORDER BY a.attnum)
  INTO v_pk_cols
  FROM pg_index i
  JOIN pg_class c ON c.oid = i.indrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = ANY(i.indkey)
  WHERE i.indisprimary
    AND n.nspname = 'public'
    AND c.relname = TG_TABLE_NAME;

  IF v_pk_cols IS NOT NULL AND array_length(v_pk_cols, 1) > 0 THEN
    FOREACH v_col IN ARRAY v_pk_cols LOOP
      v_parts := array_append(v_parts, v_col || '=' || COALESCE(v_row->>v_col, 'null'));
    END LOOP;
    v_record_id := array_to_string(v_parts, ',');
  END IF;

  INSERT INTO public.activity_logs(table_name, operation, record_id, old_data, new_data, changed_by)
  VALUES (
    TG_TABLE_NAME,
    TG_OP,
    v_record_id,
    v_old,
    v_new,
    CASE WHEN v_user_ok THEN v_user_id ELSE NULL END
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."log_all_changes"() OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."soft_delete_anonymous_text"("target_text_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    PERFORM public.require_permission('admin.texts.delete');

    UPDATE public.anonymous_texts
    SET is_active = false
    WHERE id = target_text_id
      AND is_active = true;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Yazi bulunamadi veya zaten silinmis.');
    END IF;

    RETURN jsonb_build_object('success', true);
END;
$$;


ALTER FUNCTION "public"."soft_delete_anonymous_text"("target_text_id" "uuid") OWNER TO "postgres";


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
    IF NOT v_messaging_enabled THEN
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


CREATE OR REPLACE FUNCTION "public"."trg_user_texts_stats"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_old_active boolean;
  v_new_active boolean;
  v_old_words bigint := 0;
  v_new_words bigint := 0;
  v_old_author uuid;
  v_new_author uuid;
  v_old_recipient uuid;
  v_new_recipient uuid;
begin
  if tg_op = 'INSERT' then
    v_new_active := coalesce(NEW.is_active, false);
    if v_new_active then
      v_new_words := coalesce(
        regexp_count(NEW.content, '[[:alpha:]]+(?:[''’.-][[:alpha:]]+)*'),
        0
      );
      v_new_author := NEW.author_id;
      v_new_recipient := NEW.recipient_id;
      -- author: written +1
      perform public.upsert_user_stats(v_new_author, 1, v_new_words, 0, 0);
      -- recipient: received +1 (ignore self-send)
      if v_new_recipient is not null and v_new_recipient <> v_new_author then
        perform public.upsert_user_stats(v_new_recipient, 0, 0, 1, v_new_words);
      end if;
    end if;

    return NEW;
  elsif tg_op = 'DELETE' then
    v_old_active := coalesce(OLD.is_active, false);
    if v_old_active then
      v_old_words := coalesce(
        regexp_count(OLD.content, '[[:alpha:]]+(?:[''’.-][[:alpha:]]+)*'),
        0
      );
      v_old_author := OLD.author_id;
      v_old_recipient := OLD.recipient_id;
      -- subtract
      perform public.upsert_user_stats(v_old_author, -1, -v_old_words, 0, 0);
      if v_old_recipient is not null and v_old_recipient <> v_old_author then
        perform public.upsert_user_stats(v_old_recipient, 0, 0, -1, -v_old_words);
      end if;
    end if;

    return OLD;
  elsif tg_op = 'UPDATE' then
    v_old_active := coalesce(OLD.is_active, false);
    v_new_active := coalesce(NEW.is_active, false);

    v_old_words := 0;
    v_new_words := 0;
    if v_old_active then
      v_old_words := coalesce(
        regexp_count(OLD.content, '[[:alpha:]]+(?:[''’.-][[:alpha:]]+)*'),
        0
      );
      v_old_author := OLD.author_id;
      v_old_recipient := OLD.recipient_id;
    end if;
    if v_new_active then
      v_new_words := coalesce(
        regexp_count(NEW.content, '[[:alpha:]]+(?:[''’.-][[:alpha:]]+)*'),
        0
      );
      v_new_author := NEW.author_id;
      v_new_recipient := NEW.recipient_id;
    end if;

    -- remove old contributions (if any)
    if v_old_active then
      perform public.upsert_user_stats(v_old_author, -1, -v_old_words, 0, 0);
      if v_old_recipient is not null and v_old_recipient <> v_old_author then
        perform public.upsert_user_stats(v_old_recipient, 0, 0, -1, -v_old_words);
      end if;
    end if;

    -- add new contributions (if any)
    if v_new_active then
      perform public.upsert_user_stats(v_new_author, 1, v_new_words, 0, 0);
      if v_new_recipient is not null and v_new_recipient <> v_new_author then
        perform public.upsert_user_stats(v_new_recipient, 0, 0, 1, v_new_words);
      end if;
    end if;

    return NEW;
  end if;

  return NULL; -- shouldn't reach
end;
$$;


ALTER FUNCTION "public"."trg_user_texts_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."upsert_user_stats"("p_user_id" "uuid", "p_d_texts_written" bigint, "p_d_words_written" bigint, "p_d_texts_received" bigint, "p_d_words_received" bigint) RETURNS "void"
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  insert into public.user_text_stats(
    user_id, total_texts_written, total_words_written, total_texts_received, total_words_received, updated_at
  )
  values (
    p_user_id,
    p_d_texts_written,
    p_d_words_written,
    p_d_texts_received,
    p_d_words_received,
    now()
  )
  on conflict (user_id) do update
  set
    total_texts_written = public.user_text_stats.total_texts_written + excluded.total_texts_written,
    total_words_written = public.user_text_stats.total_words_written + excluded.total_words_written,
    total_texts_received = public.user_text_stats.total_texts_received + excluded.total_texts_received,
    total_words_received = public.user_text_stats.total_words_received + excluded.total_words_received,
    updated_at = now();
$$;


ALTER FUNCTION "public"."upsert_user_stats"("p_user_id" "uuid", "p_d_texts_written" bigint, "p_d_words_written" bigint, "p_d_texts_received" bigint, "p_d_words_received" bigint) OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."view_anonymous_text_content"("target_text_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_admin_id uuid;
    v_content text;
BEGIN
    -- Yetki kontrolü
    PERFORM public.require_permission('admin.texts.read');

    v_admin_id := auth.uid();

    -- İçeriği al
    SELECT at.content INTO v_content
    FROM anonymous_texts at
    WHERE at.id = target_text_id
      AND at.is_active = true;

    IF v_content IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Anonim yazı bulunamadı.');
    END IF;

    -- Erişim logla
    INSERT INTO admin_text_access_log (admin_id, anonymous_text_id, text_type)
    VALUES (v_admin_id, target_text_id, 'anonymous_text');

    RETURN jsonb_build_object('success', true, 'content', v_content);
END;
$$;


ALTER FUNCTION "public"."view_anonymous_text_content"("target_text_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."view_text_content"("target_text_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_admin_id uuid;
    v_content text;
BEGIN
    -- Yetki kontrolü
    PERFORM public.require_permission('admin.texts.read');

    v_admin_id := auth.uid();

    -- İçeriği al
    SELECT t.content INTO v_content
    FROM texts t
    WHERE t.id = target_text_id
      AND t.is_active = true;

    IF v_content IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Yazı bulunamadı.');
    END IF;

    -- Erişim logla
    INSERT INTO admin_text_access_log (admin_id, text_id, text_type)
    VALUES (v_admin_id, target_text_id, 'text');

    RETURN jsonb_build_object('success', true, 'content', v_content);
END;
$$;


ALTER FUNCTION "public"."view_text_content"("target_text_id" "uuid") OWNER TO "postgres";

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


CREATE TABLE IF NOT EXISTS "public"."admin_text_access_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "admin_id" "uuid" NOT NULL,
    "text_id" "uuid",
    "anonymous_text_id" "uuid",
    "text_type" "text" NOT NULL,
    "accessed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "admin_text_access_log_text_type_check" CHECK (("text_type" = ANY (ARRAY['text'::"text", 'anonymous_text'::"text"])))
);


ALTER TABLE "public"."admin_text_access_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."anonymous_texts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "text_owner" "uuid" NOT NULL,
    "recipient_id" "uuid" NOT NULL,
    "display_name" "text" DEFAULT 'Anonim'::"text" NOT NULL,
    "content" "text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "anonymous_texts_content_len" CHECK (("char_length"("btrim"("content")) >= 1)),
    CONSTRAINT "anonymous_texts_display_name_len" CHECK (("char_length"("btrim"("display_name")) <= 50))
);


ALTER TABLE "public"."anonymous_texts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email_opt_outs" (
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."email_opt_outs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."error_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "message" "text" NOT NULL,
    "digest" "text",
    "stack" "text",
    "source" "text",
    "url" "text",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."error_logs" OWNER TO "postgres";


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



CREATE TABLE IF NOT EXISTS "public"."gallery_photos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "storage_path" "text" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_size" integer DEFAULT 0 NOT NULL,
    "caption" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."gallery_photos" OWNER TO "postgres";


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
    "user_year" smallint,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "profiles_first_name_len_chk" CHECK ((("char_length"("btrim"("first_name")) >= 1) AND ("char_length"("btrim"("first_name")) <= 50))),
    CONSTRAINT "profiles_last_name_len_chk" CHECK ((("char_length"("btrim"("last_name")) >= 1) AND ("char_length"("btrim"("last_name")) <= 50)))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."role_permissions" (
    "role_key" "text" NOT NULL,
    "perm_key" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."role_permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."roles" (
    "key" "text" NOT NULL,
    "label" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "level" smallint,
    "description" "text",
    "badge_color" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_text_stats" (
    "user_id" "uuid" NOT NULL,
    "total_texts_received" bigint DEFAULT 0 NOT NULL,
    "total_words_received" bigint DEFAULT 0 NOT NULL,
    "total_texts_written" bigint DEFAULT 0 NOT NULL,
    "total_words_written" bigint DEFAULT 0 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_text_stats" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."school_data_view" WITH ("security_invoker"='on') AS
 SELECT "p"."id",
    "p"."first_name",
    "p"."last_name",
    "p"."school_number",
    "p"."class",
    "p"."user_year",
    COALESCE("s"."total_texts_received", (0)::bigint) AS "total_texts_received",
    COALESCE("s"."total_texts_written", (0)::bigint) AS "total_texts_written",
    COALESCE("s"."total_words_received", (0)::bigint) AS "total_words_received",
    COALESCE("s"."total_words_written", (0)::bigint) AS "total_words_written",
    COALESCE(( SELECT ("sum"("pvs"."vote_count"))::integer AS "sum"
           FROM "public"."profile_vote_summary_v2" "pvs"
          WHERE ("pvs"."voted_for_id" = "p"."id")), 0) AS "total_votes"
   FROM ("public"."profiles" "p"
     LEFT JOIN "public"."user_text_stats" "s" ON (("s"."user_id" = "p"."id")))
  WHERE ("p"."deleted_at" IS NULL);


ALTER VIEW "public"."school_data_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."site_settings" (
    "key" "text" NOT NULL,
    "value" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."site_settings" OWNER TO "postgres";


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
    "source" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vote_access_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "admin_id" "uuid" NOT NULL,
    "category_id" "text" NOT NULL,
    "accessed_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."vote_access_logs" OWNER TO "postgres";


ALTER TABLE ONLY "public"."profile_last_active_log" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."profile_last_active_log_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."activity_logs"
    ADD CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_text_access_log"
    ADD CONSTRAINT "admin_text_access_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."anonymous_texts"
    ADD CONSTRAINT "anonymous_texts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_opt_outs"
    ADD CONSTRAINT "email_opt_outs_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."error_logs"
    ADD CONSTRAINT "error_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feedback"
    ADD CONSTRAINT "feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gallery_photos"
    ADD CONSTRAINT "gallery_photos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."profile_last_active_log"
    ADD CONSTRAINT "profile_last_active_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



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



ALTER TABLE ONLY "public"."user_text_stats"
    ADD CONSTRAINT "user_text_stats_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."vote_access_logs"
    ADD CONSTRAINT "vote_access_logs_pkey" PRIMARY KEY ("id");



CREATE INDEX "anon_texts_active_created_at_idx" ON "public"."anonymous_texts" USING "btree" ("is_active", "created_at" DESC);



CREATE INDEX "anon_texts_recipient_idx" ON "public"."anonymous_texts" USING "btree" ("recipient_id");



CREATE INDEX "idx_activity_logs_changed_by" ON "public"."activity_logs" USING "btree" ("changed_by");



CREATE INDEX "idx_admin_text_access_log_admin" ON "public"."admin_text_access_log" USING "btree" ("admin_id", "accessed_at" DESC);



CREATE INDEX "idx_admin_text_access_log_anon_text" ON "public"."admin_text_access_log" USING "btree" ("anonymous_text_id") WHERE ("anonymous_text_id" IS NOT NULL);



CREATE INDEX "idx_admin_text_access_log_text" ON "public"."admin_text_access_log" USING "btree" ("text_id") WHERE ("text_id" IS NOT NULL);



CREATE INDEX "idx_anon_texts_owner" ON "public"."anonymous_texts" USING "btree" ("text_owner") WHERE ("is_active" IS TRUE);



CREATE INDEX "idx_anon_texts_recipient_active" ON "public"."anonymous_texts" USING "btree" ("recipient_id", "created_at" DESC) WHERE ("is_active" IS TRUE);



CREATE INDEX "idx_error_logs_created_at" ON "public"."error_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_error_logs_source" ON "public"."error_logs" USING "btree" ("source");



CREATE INDEX "idx_feedback_created_at" ON "public"."feedback" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_feedback_user_id" ON "public"."feedback" USING "btree" ("user_id");



CREATE INDEX "idx_gallery_photos_created_at" ON "public"."gallery_photos" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_gallery_photos_user_id" ON "public"."gallery_photos" USING "btree" ("user_id");



CREATE INDEX "idx_role_permissions_perm" ON "public"."role_permissions" USING "btree" ("perm_key");



CREATE INDEX "idx_role_permissions_role" ON "public"."role_permissions" USING "btree" ("role_key");



CREATE INDEX "idx_survey_categories_suggested_by" ON "public"."survey_categories" USING "btree" ("suggested_by");



CREATE INDEX "idx_survey_votes_category_id" ON "public"."survey_votes" USING "btree" ("category_id");



CREATE INDEX "idx_survey_votes_voted_for_id" ON "public"."survey_votes" USING "btree" ("voted_for_id");



CREATE INDEX "idx_survey_votes_voter_id" ON "public"."survey_votes" USING "btree" ("voter_id");



CREATE INDEX "idx_texts_author_active" ON "public"."texts" USING "btree" ("author_id") WHERE ("is_active" IS TRUE);



CREATE INDEX "idx_texts_recipient_active" ON "public"."texts" USING "btree" ("recipient_id") WHERE ("is_active" IS TRUE);



CREATE INDEX "idx_texts_recipient_active_created" ON "public"."texts" USING "btree" ("recipient_id", "created_at" DESC) WHERE ("is_active" IS TRUE);



CREATE INDEX "idx_user_category_suggestions_approved_category_id" ON "public"."user_category_suggestions" USING "btree" ("approved_category_id");



CREATE INDEX "idx_user_category_suggestions_reviewed_by" ON "public"."user_category_suggestions" USING "btree" ("reviewed_by");



CREATE INDEX "idx_user_category_suggestions_status" ON "public"."user_category_suggestions" USING "btree" ("status");



CREATE INDEX "idx_user_category_suggestions_suggested_by" ON "public"."user_category_suggestions" USING "btree" ("suggested_by");



CREATE INDEX "idx_user_roles_role" ON "public"."user_roles" USING "btree" ("role_key");



CREATE INDEX "idx_user_roles_user" ON "public"."user_roles" USING "btree" ("user_id");



CREATE INDEX "profile_last_active_log_idx" ON "public"."profile_last_active_log" USING "btree" ("profile_id", "last_active_at" DESC);



CREATE UNIQUE INDEX "profiles_school_number_year_active_uq" ON "public"."profiles" USING "btree" ("school_number", "user_year") WHERE ("deleted_at" IS NULL);



CREATE INDEX "texts_active_created_at_idx" ON "public"."texts" USING "btree" ("is_active", "created_at" DESC);



CREATE INDEX "texts_author_recipient_idx" ON "public"."texts" USING "btree" ("author_id", "recipient_id");



CREATE UNIQUE INDEX "ux_anon_texts_one_active_per_pair" ON "public"."anonymous_texts" USING "btree" ("text_owner", "recipient_id") WHERE ("is_active" = true);



CREATE UNIQUE INDEX "ux_texts_one_active_per_pair" ON "public"."texts" USING "btree" ("author_id", "recipient_id") WHERE ("is_active" = true);



CREATE OR REPLACE TRIGGER "audit_email_opt_outs" AFTER INSERT OR DELETE OR UPDATE ON "public"."email_opt_outs" FOR EACH ROW EXECUTE FUNCTION "public"."log_all_changes"();



CREATE OR REPLACE TRIGGER "audit_feedback" AFTER INSERT OR DELETE OR UPDATE ON "public"."feedback" FOR EACH ROW EXECUTE FUNCTION "public"."log_all_changes"();



CREATE OR REPLACE TRIGGER "audit_profiles" AFTER INSERT OR DELETE OR UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."log_all_changes"();



CREATE OR REPLACE TRIGGER "audit_role_permissions" AFTER INSERT OR DELETE OR UPDATE ON "public"."role_permissions" FOR EACH ROW EXECUTE FUNCTION "public"."log_all_changes"();



CREATE OR REPLACE TRIGGER "audit_roles" AFTER INSERT OR DELETE OR UPDATE ON "public"."roles" FOR EACH ROW EXECUTE FUNCTION "public"."log_all_changes"();



CREATE OR REPLACE TRIGGER "audit_site_settings" AFTER INSERT OR DELETE OR UPDATE ON "public"."site_settings" FOR EACH ROW EXECUTE FUNCTION "public"."log_all_changes"();



CREATE OR REPLACE TRIGGER "audit_survey_categories" AFTER INSERT OR DELETE OR UPDATE ON "public"."survey_categories" FOR EACH ROW EXECUTE FUNCTION "public"."log_all_changes"();



CREATE OR REPLACE TRIGGER "audit_survey_votes" AFTER INSERT OR DELETE OR UPDATE ON "public"."survey_votes" FOR EACH ROW EXECUTE FUNCTION "public"."log_all_changes"();



CREATE OR REPLACE TRIGGER "audit_texts" AFTER INSERT OR DELETE OR UPDATE ON "public"."texts" FOR EACH ROW EXECUTE FUNCTION "public"."log_all_changes"();



CREATE OR REPLACE TRIGGER "audit_user_category_suggestions" AFTER INSERT OR DELETE OR UPDATE ON "public"."user_category_suggestions" FOR EACH ROW EXECUTE FUNCTION "public"."log_all_changes"();



CREATE OR REPLACE TRIGGER "audit_user_roles" AFTER INSERT OR DELETE OR UPDATE ON "public"."user_roles" FOR EACH ROW EXECUTE FUNCTION "public"."log_all_changes"();



CREATE OR REPLACE TRIGGER "trg_check_graduation_deadline_anonymous_texts" BEFORE INSERT OR DELETE OR UPDATE ON "public"."anonymous_texts" FOR EACH ROW EXECUTE FUNCTION "public"."check_graduation_deadline"();



CREATE OR REPLACE TRIGGER "trg_check_graduation_gallery" BEFORE INSERT OR UPDATE ON "public"."gallery_photos" FOR EACH ROW EXECUTE FUNCTION "public"."check_graduation_deadline"();



CREATE OR REPLACE TRIGGER "trg_check_graduation_survey_votes" BEFORE INSERT OR UPDATE ON "public"."survey_votes" FOR EACH ROW EXECUTE FUNCTION "public"."check_graduation_deadline"();



CREATE OR REPLACE TRIGGER "trg_check_graduation_texts" BEFORE INSERT OR UPDATE ON "public"."texts" FOR EACH ROW EXECUTE FUNCTION "public"."check_graduation_deadline"();



CREATE OR REPLACE TRIGGER "trg_check_same_class_vote" BEFORE INSERT OR UPDATE ON "public"."survey_votes" FOR EACH ROW EXECUTE FUNCTION "public"."check_same_class_vote"();



CREATE OR REPLACE TRIGGER "trg_handle_updated_at_anonymous_texts" BEFORE UPDATE ON "public"."anonymous_texts" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "trg_handle_updated_at_email_opt_outs" BEFORE UPDATE ON "public"."email_opt_outs" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "trg_handle_updated_at_profiles" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "trg_handle_updated_at_role_permissions" BEFORE UPDATE ON "public"."role_permissions" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "trg_handle_updated_at_roles" BEFORE UPDATE ON "public"."roles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "trg_handle_updated_at_site_settings" BEFORE UPDATE ON "public"."site_settings" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "trg_handle_updated_at_texts" BEFORE UPDATE ON "public"."texts" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "trg_handle_updated_at_user_roles" BEFORE UPDATE ON "public"."user_roles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "trg_texts_same_year" BEFORE INSERT OR UPDATE OF "author_id", "recipient_id" ON "public"."texts" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_texts_same_year"();



CREATE OR REPLACE TRIGGER "trg_texts_stats" AFTER INSERT OR DELETE OR UPDATE ON "public"."texts" FOR EACH ROW EXECUTE FUNCTION "public"."trg_user_texts_stats"();



CREATE OR REPLACE TRIGGER "trg_validate_profile_insupd" BEFORE INSERT OR UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."validate_profile"();



ALTER TABLE ONLY "public"."activity_logs"
    ADD CONSTRAINT "activity_logs_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."admin_text_access_log"
    ADD CONSTRAINT "admin_text_access_log_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."anonymous_texts"
    ADD CONSTRAINT "anonymous_texts_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."anonymous_texts"
    ADD CONSTRAINT "anonymous_texts_text_owner_fkey" FOREIGN KEY ("text_owner") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."email_opt_outs"
    ADD CONSTRAINT "email_opt_outs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feedback"
    ADD CONSTRAINT "feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."gallery_photos"
    ADD CONSTRAINT "gallery_photos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



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



ALTER TABLE ONLY "public"."vote_access_logs"
    ADD CONSTRAINT "vote_access_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."vote_access_logs"
    ADD CONSTRAINT "vote_access_logs_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."survey_categories"("id");



CREATE POLICY "Admins can view active feedback" ON "public"."feedback" FOR SELECT TO "authenticated" USING ((("deleted_at" IS NULL) AND "public"."has_permission"('admin.feedback.read'::"text")));



CREATE POLICY "Admins view logs" ON "public"."activity_logs" FOR SELECT TO "authenticated" USING ("public"."has_permission"('system.logs.read'::"text"));



CREATE POLICY "Authenticated users can insert feedback" ON "public"."feedback" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Profilleri herkes görebilir" ON "public"."profiles" FOR SELECT USING (("deleted_at" IS NULL));



CREATE POLICY "Rolleri herkes görebilir" ON "public"."roles" FOR SELECT USING (true);



CREATE POLICY "Users or admins can view opt-outs" ON "public"."email_opt_outs" TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."has_permission"('admin.email_opt_outs.read'::"text")));



ALTER TABLE "public"."activity_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_text_access_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."anonymous_texts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."email_opt_outs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."error_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."feedback" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gallery_photos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profile_last_active_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


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



CREATE POLICY "texts_select_policy" ON "public"."texts" FOR SELECT TO "authenticated" USING ((("is_active" = true) AND ("author_id" = "auth"."uid"())));



CREATE POLICY "texts_update_policy" ON "public"."texts" FOR UPDATE TO "authenticated" USING ((("is_active" = true) AND ("author_id" = ( SELECT "auth"."uid"() AS "uid")))) WITH CHECK ((("is_active" = true) AND ("author_id" = ( SELECT "auth"."uid"() AS "uid")) AND (( SELECT "s"."value"
   FROM "public"."site_settings" "s"
  WHERE ("s"."key" = 'messaging_enabled'::"text")) = 'true'::"text")));



CREATE POLICY "user_can_see_own_roles" ON "public"."user_roles" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."user_category_suggestions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_text_stats" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vote_access_logs" ENABLE ROW LEVEL SECURITY;




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



GRANT ALL ON FUNCTION "public"."admin_create_role"("p_key" "text", "p_label" "text", "p_level" smallint, "p_description" "text", "p_badge_color" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_create_role"("p_key" "text", "p_label" "text", "p_level" smallint, "p_description" "text", "p_badge_color" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_create_role"("p_key" "text", "p_label" "text", "p_level" smallint, "p_description" "text", "p_badge_color" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_delete_account"("target_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_delete_account"("target_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_delete_account"("target_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_delete_role"("p_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_delete_role"("p_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_delete_role"("p_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_get_role_permissions"("p_role_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_get_role_permissions"("p_role_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_get_role_permissions"("p_role_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_get_user_roles"("target_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_get_user_roles"("target_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_get_user_roles"("target_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_list_permissions"() TO "anon";
GRANT ALL ON FUNCTION "public"."admin_list_permissions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_list_permissions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_list_role_permissions"() TO "anon";
GRANT ALL ON FUNCTION "public"."admin_list_role_permissions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_list_role_permissions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_list_roles"() TO "anon";
GRANT ALL ON FUNCTION "public"."admin_list_roles"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_list_roles"() TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_remove_role_permission"("p_role_key" "text", "p_perm_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_remove_role_permission"("p_role_key" "text", "p_perm_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_remove_role_permission"("p_role_key" "text", "p_perm_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_remove_user_role"("target_user_id" "uuid", "remove_role_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_remove_user_role"("target_user_id" "uuid", "remove_role_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_remove_user_role"("target_user_id" "uuid", "remove_role_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_restore_account"("target_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_restore_account"("target_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_restore_account"("target_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_update_role"("p_key" "text", "p_label" "text", "p_level" smallint, "p_description" "text", "p_badge_color" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_update_role"("p_key" "text", "p_label" "text", "p_level" smallint, "p_description" "text", "p_badge_color" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_update_role"("p_key" "text", "p_label" "text", "p_level" smallint, "p_description" "text", "p_badge_color" "text") TO "service_role";



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



GRANT ALL ON FUNCTION "public"."delete_own_account"() TO "anon";
GRANT ALL ON FUNCTION "public"."delete_own_account"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_own_account"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."delete_user_session"("p_session_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."delete_user_session"("p_session_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_user_session"("p_session_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_user_session"("p_session_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."enforce_texts_same_year"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."enforce_texts_same_year"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_activity_logs_latest"("p_limit" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_activity_logs_latest"("p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_activity_logs_latest"("p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_activity_logs_latest"("p_limit" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_admin_category_votes"("p_category_id" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_admin_category_votes"("p_category_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_admin_category_votes"("p_category_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_admin_gallery_photos"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_admin_gallery_photos"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_admin_gallery_photos"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_admin_overview_stats"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_admin_overview_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_admin_overview_stats"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_admin_text_access_logs"("p_limit" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_admin_text_access_logs"("p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_admin_text_access_logs"("p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_admin_text_access_logs"("p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_admin_texts_export"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_admin_texts_export"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_admin_texts_export"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_admin_texts_page"("p_limit" integer, "p_offset" integer, "p_author_search" "text", "p_recipient_search" "text", "p_filter" "text", "p_author_class" "text", "p_recipient_class" "text", "p_year" integer, "p_sort" "text", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_admin_texts_page"("p_limit" integer, "p_offset" integer, "p_author_search" "text", "p_recipient_search" "text", "p_filter" "text", "p_author_class" "text", "p_recipient_class" "text", "p_year" integer, "p_sort" "text", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_admin_texts_page"("p_limit" integer, "p_offset" integer, "p_author_search" "text", "p_recipient_search" "text", "p_filter" "text", "p_author_class" "text", "p_recipient_class" "text", "p_year" integer, "p_sort" "text", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_admin_users_list"("class_filter" "text", "search_query" "text", "sort_by" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_admin_users_list"("class_filter" "text", "search_query" "text", "sort_by" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_admin_users_list"("class_filter" "text", "search_query" "text", "sort_by" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_admin_vote_access_logs"("p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_admin_vote_access_logs"("p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_admin_vote_access_logs"("p_limit" integer) TO "service_role";



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



GRANT ALL ON FUNCTION "public"."get_gallery_photos"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_gallery_photos"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_gallery_photos"() TO "service_role";



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



GRANT ALL ON FUNCTION "public"."get_school_data"("target_year" smallint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_school_data"("target_year" smallint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_school_data"("target_year" smallint) TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_user_sessions"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_user_sessions"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_sessions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_sessions"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."handle_updated_at"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_permission"("p_perm" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."has_permission"("p_perm" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_permission"("p_perm" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."healthcheck"() TO "anon";
GRANT ALL ON FUNCTION "public"."healthcheck"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."healthcheck"() TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_anonymous_text"("p_recipient_id" "uuid", "p_content" "text", "p_display_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."insert_anonymous_text"("p_recipient_id" "uuid", "p_content" "text", "p_display_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_anonymous_text"("p_recipient_id" "uuid", "p_content" "text", "p_display_name" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."log_all_changes"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."log_all_changes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."require_permission"("p_perm" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."require_permission"("p_perm" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."require_permission"("p_perm" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."soft_delete_anonymous_text"("target_text_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."soft_delete_anonymous_text"("target_text_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."soft_delete_anonymous_text"("target_text_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."soft_delete_anonymous_text"("target_text_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."soft_delete_feedback"("feedback_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."soft_delete_feedback"("feedback_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."soft_delete_feedback"("feedback_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."soft_delete_text"("target_text_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."soft_delete_text"("target_text_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."soft_delete_text"("target_text_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_user_texts_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_user_texts_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_user_texts_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."upsert_user_stats"("p_user_id" "uuid", "p_d_texts_written" bigint, "p_d_words_written" bigint, "p_d_texts_received" bigint, "p_d_words_received" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."upsert_user_stats"("p_user_id" "uuid", "p_d_texts_written" bigint, "p_d_words_written" bigint, "p_d_texts_received" bigint, "p_d_words_received" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."upsert_user_stats"("p_user_id" "uuid", "p_d_texts_written" bigint, "p_d_words_written" bigint, "p_d_texts_received" bigint, "p_d_words_received" bigint) TO "service_role";



REVOKE ALL ON FUNCTION "public"."validate_profile"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."validate_profile"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."view_anonymous_text_content"("target_text_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."view_anonymous_text_content"("target_text_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."view_anonymous_text_content"("target_text_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."view_anonymous_text_content"("target_text_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."view_text_content"("target_text_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."view_text_content"("target_text_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."view_text_content"("target_text_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."view_text_content"("target_text_id" "uuid") TO "service_role";






























GRANT ALL ON TABLE "public"."activity_logs" TO "service_role";
GRANT SELECT,INSERT ON TABLE "public"."activity_logs" TO "authenticated";



GRANT ALL ON TABLE "public"."admin_text_access_log" TO "anon";
GRANT ALL ON TABLE "public"."admin_text_access_log" TO "service_role";



GRANT ALL ON TABLE "public"."anonymous_texts" TO "anon";
GRANT ALL ON TABLE "public"."anonymous_texts" TO "authenticated";
GRANT ALL ON TABLE "public"."anonymous_texts" TO "service_role";



GRANT ALL ON TABLE "public"."email_opt_outs" TO "anon";
GRANT ALL ON TABLE "public"."email_opt_outs" TO "authenticated";
GRANT ALL ON TABLE "public"."email_opt_outs" TO "service_role";



GRANT ALL ON TABLE "public"."error_logs" TO "anon";
GRANT ALL ON TABLE "public"."error_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."error_logs" TO "service_role";



GRANT ALL ON TABLE "public"."feedback" TO "anon";
GRANT ALL ON TABLE "public"."feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."feedback" TO "service_role";



GRANT ALL ON TABLE "public"."gallery_photos" TO "anon";
GRANT ALL ON TABLE "public"."gallery_photos" TO "authenticated";
GRANT ALL ON TABLE "public"."gallery_photos" TO "service_role";



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



GRANT ALL ON TABLE "public"."user_text_stats" TO "anon";
GRANT ALL ON TABLE "public"."user_text_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."user_text_stats" TO "service_role";



GRANT ALL ON TABLE "public"."school_data_view" TO "anon";
GRANT ALL ON TABLE "public"."school_data_view" TO "authenticated";
GRANT ALL ON TABLE "public"."school_data_view" TO "service_role";



GRANT ALL ON TABLE "public"."site_settings" TO "anon";
GRANT ALL ON TABLE "public"."site_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."site_settings" TO "service_role";



GRANT ALL ON TABLE "public"."texts" TO "anon";
GRANT ALL ON TABLE "public"."texts" TO "authenticated";
GRANT ALL ON TABLE "public"."texts" TO "service_role";



GRANT ALL ON TABLE "public"."user_category_suggestions" TO "anon";
GRANT ALL ON TABLE "public"."user_category_suggestions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_category_suggestions" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON TABLE "public"."vote_access_logs" TO "anon";
GRANT ALL ON TABLE "public"."vote_access_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."vote_access_logs" TO "service_role";









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































