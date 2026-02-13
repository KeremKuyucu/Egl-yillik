-- ============================================================
-- Admin metin erişim loglarını listeleme RPC fonksiyonu
-- RLS ile kimse doğrudan erişemez, sadece bu RPC ile okunabilir
-- ============================================================

-- RLS politikası: kimse erişemesin (sadece RPC ile)
-- Not: Tablo zaten RLS aktif ve policy yok, dolayısıyla kimse SELECT yapamaz.
-- Ancak güvenlik için açıkça bir deny-all yaklaşımı izliyoruz.

-- Mevcut GRANT'ları kaldır (sadece service_role doğrudan erişebilsin)
REVOKE ALL ON public.admin_text_access_log FROM "authenticated";
GRANT ALL ON public.admin_text_access_log TO "service_role";

-- ─────────────────────────────────────────────────
-- RPC: get_admin_text_access_logs
-- Son N erişim logunu admin profil bilgileriyle döner
-- ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION "public"."get_admin_text_access_logs"(
    p_limit integer DEFAULT 200
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

ALTER FUNCTION "public"."get_admin_text_access_logs"(integer) OWNER TO "postgres";

REVOKE ALL ON FUNCTION "public"."get_admin_text_access_logs"(integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_admin_text_access_logs"(integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_admin_text_access_logs"(integer) TO "service_role";
