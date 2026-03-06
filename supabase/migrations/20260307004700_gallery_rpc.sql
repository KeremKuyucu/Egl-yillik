-- =============================================
-- 1. Kullanıcı Galeri RPC (sadece açık fotoğraflar + kendi fotoğrafları)
-- =============================================
CREATE OR REPLACE FUNCTION public.get_gallery_photos()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
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
            'is_unlocked', CASE
                WHEN gp.user_id = v_uid THEN true
                WHEN CURRENT_TIMESTAMP >= COALESCE(
                    (SELECT value::timestamptz FROM public.site_settings
                     WHERE key = 'graduation_date_' || p.user_year::text),
                    (SELECT value::timestamptz FROM public.site_settings
                     WHERE key = 'graduation_date'),
                    '2099-01-01'::timestamptz
                ) THEN true
                ELSE false
            END,
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
        WHERE p.deleted_at IS NULL
    ) sub
    WHERE
        -- Kendi fotoğrafları
        (sub.photo_row->>'user_id')::uuid = v_uid
        -- veya kilit açılmış fotoğraflar
        OR (sub.photo_row->>'is_unlocked')::boolean = true;

    RETURN v_result;
END;
$$;

ALTER FUNCTION public.get_gallery_photos() OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.get_gallery_photos() TO authenticated;

-- =============================================
-- 2. Admin Galeri RPC (tüm fotoğraflar — admin.gallery.view izni gerektirir)
-- =============================================
CREATE OR REPLACE FUNCTION public.get_admin_gallery_photos()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
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

ALTER FUNCTION public.get_admin_gallery_photos() OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.get_admin_gallery_photos() TO authenticated;

-- =============================================
-- 3. Galeri istatistikleri
-- =============================================
CREATE OR REPLACE FUNCTION public.get_gallery_stats()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
DECLARE
    v_uid uuid;
    v_total integer;
    v_user_count integer;
BEGIN
    v_uid := auth.uid();
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'UNAUTHENTICATED';
    END IF;

    SELECT COUNT(*)::integer INTO v_total FROM public.gallery_photos;
    SELECT COUNT(*)::integer INTO v_user_count
    FROM public.gallery_photos WHERE user_id = v_uid;

    RETURN jsonb_build_object(
        'total_photos', v_total,
        'user_photos', v_user_count
    );
END;
$$;

ALTER FUNCTION public.get_gallery_stats() OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.get_gallery_stats() TO authenticated;
