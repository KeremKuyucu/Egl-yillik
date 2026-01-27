-- 1. Log Tablosu (Eğer yoksa oluşturur)
CREATE TABLE IF NOT EXISTS "public"."activity_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "table_name" "text" NOT NULL,
    "operation" "text" NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    "record_id" "text",           -- Hangi kayıt?
    "old_data" "jsonb",           -- Eskiden neydi? (Insert'te boş)
    "new_data" "jsonb",           -- Ne oldu? (Delete'te boş)
    "changed_by" "uuid",          -- Kim yaptı?
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

-- Güvenlik: Sadece Level 100+ Adminler logları okuyabilir
ALTER TABLE "public"."activity_logs" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins view logs" ON "public"."activity_logs";
CREATE POLICY "Admins view logs" ON "public"."activity_logs" 
    FOR SELECT TO "authenticated" 
    USING (public.get_my_level() >= 100);

DROP POLICY IF EXISTS "System inserts logs" ON "public"."activity_logs";
CREATE POLICY "System inserts logs" ON "public"."activity_logs" 
    FOR INSERT WITH CHECK (true);

-- 2. Gelişmiş Loglama Fonksiyonu (INSERT, UPDATE, DELETE destekli)
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

    -- FİLTRE: PROFILES (Gürültü Azaltma)
    -- Sadece adminlerin yaptığı kritik değişiklikleri alalım.
    -- (Last_active veya updated_at değişimlerini yoksay)
    IF TG_TABLE_NAME = 'profiles' AND TG_OP = 'UPDATE' THEN
        IF OLD.first_name = NEW.first_name AND 
           OLD.last_name = NEW.last_name AND 
           OLD.school_number = NEW.school_number AND 
           OLD.class = NEW.class THEN
           RETURN NEW; 
        END IF;
    END IF;

    -- VERİLERİ HAZIRLA
    IF TG_OP = 'INSERT' THEN
        v_new := to_jsonb(NEW);
        -- ID'yi new data'dan al
        v_record_id := COALESCE(v_new->>'id', v_new->>'user_id', 'unknown');
    ELSIF TG_OP = 'UPDATE' THEN
        v_old := to_jsonb(OLD);
        v_new := to_jsonb(NEW);
        v_record_id := COALESCE(v_new->>'id', v_new->>'user_id');
    ELSIF TG_OP = 'DELETE' THEN
        v_old := to_jsonb(OLD);
        -- ID'yi old data'dan al
        v_record_id := COALESCE(v_old->>'id', v_old->>'user_id');
    END IF;

    -- LOG TABLOSUNA YAZ
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

-- 3. Triggerları Tanımla (Tüm tablolar için Insert, Update, Delete)

-- A) TEXTS (Mesajlar)
-- Mesaj yazıldığında, düzenlendiğinde veya silindiğinde(pasife çekildiğinde) loglar.
DROP TRIGGER IF EXISTS "audit_texts" ON "public"."texts";
CREATE TRIGGER "audit_texts" AFTER INSERT OR UPDATE OR DELETE ON "public"."texts"
    FOR EACH ROW EXECUTE FUNCTION "public"."log_all_changes"();

-- B) SURVEY_VOTES (Oylar)
-- Oy verildiğinde veya değiştirildiğinde loglar.
DROP TRIGGER IF EXISTS "audit_survey_votes" ON "public"."survey_votes";
CREATE TRIGGER "audit_survey_votes" AFTER INSERT OR UPDATE OR DELETE ON "public"."survey_votes"
    FOR EACH ROW EXECUTE FUNCTION "public"."log_all_changes"();

-- C) SITE SETTINGS (Ayarlar)
DROP TRIGGER IF EXISTS "audit_site_settings" ON "public"."site_settings";
CREATE TRIGGER "audit_site_settings" AFTER INSERT OR UPDATE OR DELETE ON "public"."site_settings"
    FOR EACH ROW EXECUTE FUNCTION "public"."log_all_changes"();

-- D) USER LEVELS (Yetkiler)
DROP TRIGGER IF EXISTS "audit_user_levels" ON "public"."user_levels";
CREATE TRIGGER "audit_user_levels" AFTER INSERT OR UPDATE OR DELETE ON "public"."user_levels"
    FOR EACH ROW EXECUTE FUNCTION "public"."log_all_changes"();

-- E) PROFILES (Profiller)
-- Profile insert (yeni kayıt) ve update (admin değişikliği) loglanır.
DROP TRIGGER IF EXISTS "audit_profiles" ON "public"."profiles";
CREATE TRIGGER "audit_profiles" AFTER INSERT OR UPDATE ON "public"."profiles"
    FOR EACH ROW EXECUTE FUNCTION "public"."log_all_changes"();
