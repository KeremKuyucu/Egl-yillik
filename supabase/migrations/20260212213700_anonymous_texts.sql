-- ============================================================
-- anonymous_texts table
-- ============================================================
CREATE TABLE IF NOT EXISTS "public"."anonymous_texts" (
    "id"           uuid DEFAULT gen_random_uuid() NOT NULL,
    "text_owner"   uuid NOT NULL,                          -- yazarın gerçek uid'si (gizli tutulur)
    "recipient_id" uuid NOT NULL,                          -- kime yazıldığı
    "display_name" text NOT NULL DEFAULT 'Anonim',         -- gösterilecek takma ad (boşsa Anonim)
    "content"      text NOT NULL,
    "is_active"    boolean NOT NULL DEFAULT true,
    "created_at"   timestamptz DEFAULT now(),
    "updated_at"   timestamptz DEFAULT now(),

    CONSTRAINT "anonymous_texts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "anonymous_texts_content_len" CHECK (char_length(btrim(content)) >= 1),
    CONSTRAINT "anonymous_texts_display_name_len" CHECK (char_length(btrim(display_name)) <= 50)
);

ALTER TABLE "public"."anonymous_texts" OWNER TO "postgres";

-- Foreign keys
ALTER TABLE ONLY "public"."anonymous_texts"
    ADD CONSTRAINT "anonymous_texts_text_owner_fkey"
    FOREIGN KEY ("text_owner") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."anonymous_texts"
    ADD CONSTRAINT "anonymous_texts_recipient_id_fkey"
    FOREIGN KEY ("recipient_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;

-- Indexes
CREATE INDEX "idx_anon_texts_recipient_active" ON "public"."anonymous_texts" ("recipient_id", "created_at" DESC) WHERE (is_active IS TRUE);
CREATE INDEX "idx_anon_texts_owner"            ON "public"."anonymous_texts" ("text_owner") WHERE (is_active IS TRUE);

-- Her yazar → alıcı çifti için en fazla 1 aktif kayıt
CREATE UNIQUE INDEX "ux_anon_texts_one_active_per_pair"
    ON "public"."anonymous_texts" ("text_owner", "recipient_id")
    WHERE (is_active = true);

-- updated_at trigger (mevcut handle_updated_at fonksiyonunu kullan)
CREATE OR REPLACE TRIGGER "anonymous_texts_updated_at"
    BEFORE UPDATE ON "public"."anonymous_texts"
    FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();

-- Audit trigger
CREATE OR REPLACE TRIGGER "audit_anonymous_texts"
    AFTER INSERT OR DELETE OR UPDATE ON "public"."anonymous_texts"
    FOR EACH ROW EXECUTE FUNCTION "public"."log_all_changes"();

-- RLS
ALTER TABLE "public"."anonymous_texts" ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- insert_anonymous_text RPC
-- ============================================================
CREATE OR REPLACE FUNCTION "public"."insert_anonymous_text"(
    p_recipient_id uuid,
    p_content      text,
    p_display_name text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_owner uuid;
    v_name  text;
    v_messaging boolean;
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

    -- 6) Insert
    INSERT INTO public.anonymous_texts (text_owner, recipient_id, display_name, content)
    VALUES (v_owner, p_recipient_id, v_name, btrim(p_content));

    RETURN jsonb_build_object('success', true, 'message', 'Anonim mesaj kaydedildi.');

EXCEPTION
    WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'error', 'Bu kişiye zaten anonim mesaj yazmışsınız.');
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

ALTER FUNCTION "public"."insert_anonymous_text"(uuid, text, text) OWNER TO "postgres";
