CREATE OR REPLACE FUNCTION public.soft_delete_text(target_text_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $function$
DECLARE
    v_user_id uuid;
    v_user_level int;
    v_author_id uuid;
BEGIN
    -- Kullanıcı ID
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Oturum açılmamış.'
        );
    END IF;

    -- Kullanıcı level + text author tek sorguda
    SELECT 
        COALESCE(ul.level, 0),
        t.author_id
    INTO 
        v_user_level,
        v_author_id
    FROM texts t
    LEFT JOIN user_levels ul ON ul.id = v_user_id
    WHERE t.id = target_text_id;

    -- Text yoksa
    IF v_author_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Metin bulunamadı.'
        );
    END IF;

    -- Yetki kontrolü
    IF v_user_id = v_author_id OR v_user_level >= 50 THEN
        UPDATE texts
        SET 
            is_active = false,
            updated_at = now()
        WHERE id = target_text_id;

        RETURN jsonb_build_object(
            'success', true,
            'message', 'Metin başarıyla pasife çekildi.'
        );
    END IF;

    RETURN jsonb_build_object(
        'success', false,
        'error', 'Bu işlem için yetkiniz yok.'
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$function$;
