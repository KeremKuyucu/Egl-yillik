-- ============================================================
-- get_admin_anonymous_texts RPC
-- Admin paneli icin anonim yazilari dondurur.
-- text_owner id'si disariya cikMaz, sadece display_name gosterilir.
-- ============================================================
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
                'content', at.content,
                'display_name', at.display_name,
                'created_at', at.created_at,
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

-- Yetkilendirme
REVOKE ALL ON FUNCTION "public"."get_admin_anonymous_texts"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_admin_anonymous_texts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_admin_anonymous_texts"() TO "service_role";

-- soft_delete icin de bir RPC ekleyelim
CREATE OR REPLACE FUNCTION "public"."soft_delete_anonymous_text"(target_text_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

ALTER FUNCTION "public"."soft_delete_anonymous_text"(uuid) OWNER TO "postgres";

REVOKE ALL ON FUNCTION "public"."soft_delete_anonymous_text"(uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."soft_delete_anonymous_text"(uuid) TO "authenticated";
GRANT ALL ON FUNCTION "public"."soft_delete_anonymous_text"(uuid) TO "service_role";
