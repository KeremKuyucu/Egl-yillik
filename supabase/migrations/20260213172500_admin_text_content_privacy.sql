-- ============================================================
-- Admin metin içerik gizliliği ve erişim loglama
-- 
-- 1) admin_text_access_log tablosu (hangi admin hangi mesaja baktı)
-- 2) get_admin_texts → content alanı çıkarıldı
-- 3) get_admin_anonymous_texts → content alanı çıkarıldı
-- 4) view_text_content RPC → content döner + erişim loglar
-- 5) view_anonymous_text_content RPC → content döner + erişim loglar
-- ============================================================

-- ─────────────────────────────────────────────────
-- 1) Erişim log tablosu
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_text_access_log (
    id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id    uuid NOT NULL REFERENCES auth.users(id),
    text_id     uuid,
    anonymous_text_id uuid,
    text_type   text NOT NULL CHECK (text_type IN ('text', 'anonymous_text')),
    accessed_at timestamptz DEFAULT now() NOT NULL
);

-- Index: admin_id ve tarih
CREATE INDEX IF NOT EXISTS idx_admin_text_access_log_admin
    ON public.admin_text_access_log (admin_id, accessed_at DESC);

-- Index: hangi mesaja bakıldı
CREATE INDEX IF NOT EXISTS idx_admin_text_access_log_text
    ON public.admin_text_access_log (text_id)
    WHERE text_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_admin_text_access_log_anon_text
    ON public.admin_text_access_log (anonymous_text_id)
    WHERE anonymous_text_id IS NOT NULL;

-- RLS: adminler kendi loglarını okuyabilir, ama genel erişim yok
ALTER TABLE public.admin_text_access_log ENABLE ROW LEVEL SECURITY;

-- Sadece service_role ve postgres doğrudan erişebilir
-- (RPC SECURITY DEFINER olduğu için yazma sorunsuz)

ALTER TABLE public.admin_text_access_log OWNER TO "postgres";

GRANT SELECT ON public.admin_text_access_log TO "authenticated";
GRANT ALL ON public.admin_text_access_log TO "service_role";

-- ─────────────────────────────────────────────────
-- 2) get_admin_texts → content ÇIKARILDI
-- ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION "public"."get_admin_texts"()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Yetki Kontrolü
    PERFORM public.require_permission('admin.texts.read');

    RETURN (
        SELECT COALESCE(json_agg(
            json_build_object(
                'id', t.id,
                'created_at', t.created_at,
                'content_length', LENGTH(t.content),
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

REVOKE ALL ON FUNCTION "public"."get_admin_texts"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_admin_texts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_admin_texts"() TO "service_role";

-- ─────────────────────────────────────────────────
-- 3) get_admin_anonymous_texts → content ÇIKARILDI
-- ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION "public"."get_admin_anonymous_texts"()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Yetki Kontrolu
    PERFORM public.require_permission('admin.texts.read');

    RETURN (
        SELECT COALESCE(json_agg(
            json_build_object(
                'id', at.id,
                'display_name', at.display_name,
                'created_at', at.created_at,
                'content_length', LENGTH(at.content),
                'recipient', json_build_object(
                    'id', r.id,
                    'first_name', r.first_name,
                    'last_name', r.last_name,
                    'school_number', r.school_number,
                    'class', r.class,
                    'user_year', r.user_year
                )
            ) ORDER BY at.created_at DESC
        ), '[]'::json)
        FROM anonymous_texts at
        LEFT JOIN profiles r ON at.recipient_id = r.id
        WHERE at.is_active = true
    );
END;
$$;

ALTER FUNCTION "public"."get_admin_anonymous_texts"() OWNER TO "postgres";

REVOKE ALL ON FUNCTION "public"."get_admin_anonymous_texts"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_admin_anonymous_texts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_admin_anonymous_texts"() TO "service_role";

-- ─────────────────────────────────────────────────
-- 4) view_text_content → İçerik döner + erişim loglar
-- ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION "public"."view_text_content"(target_text_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

ALTER FUNCTION "public"."view_text_content"(uuid) OWNER TO "postgres";

REVOKE ALL ON FUNCTION "public"."view_text_content"(uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."view_text_content"(uuid) TO "authenticated";
GRANT ALL ON FUNCTION "public"."view_text_content"(uuid) TO "service_role";

-- ─────────────────────────────────────────────────
-- 5) view_anonymous_text_content → İçerik döner + erişim loglar
-- ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION "public"."view_anonymous_text_content"(target_text_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

ALTER FUNCTION "public"."view_anonymous_text_content"(uuid) OWNER TO "postgres";

REVOKE ALL ON FUNCTION "public"."view_anonymous_text_content"(uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."view_anonymous_text_content"(uuid) TO "authenticated";
GRANT ALL ON FUNCTION "public"."view_anonymous_text_content"(uuid) TO "service_role";
