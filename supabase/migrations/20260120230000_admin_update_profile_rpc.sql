-- RPC: Kullanıcı profilini güncelle (Admin yetkisi gerekli)
CREATE OR REPLACE FUNCTION public.admin_update_user_profile(
    target_user_id UUID,
    new_first_name TEXT,
    new_last_name TEXT,
    new_school_number TEXT,
    new_class TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    caller_level INTEGER;
    target_level INTEGER;
BEGIN
    -- Kendi profilini düzenleyemez
    IF target_user_id = auth.uid() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Kendi profilinizi bu panelden düzenleyemezsiniz');
    END IF;

    -- Çağıran kullanıcının level'ını al
    caller_level := get_my_level();

    -- Admin kontrolü (level >= 50)
    IF caller_level < 50 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Bu işlem için admin yetkisi gerekli');
    END IF;

    -- Hedef kullanıcının level'ını al
    SELECT COALESCE(level, 0) INTO target_level
    FROM public.user_levels
    WHERE id = target_user_id;

    -- Kullanıcı bulunamadı
    IF target_level IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Kullanıcı bulunamadı');
    END IF;

    -- Kendinden düşük seviyedeki kullanıcıları düzenleyebilir
    IF caller_level <= target_level THEN
        RETURN jsonb_build_object('success', false, 'error', 'Bu kullanıcıyı düzenleme yetkiniz yok');
    END IF;

    -- Profili güncelle
    UPDATE public.profiles
    SET 
        first_name = new_first_name,
        last_name = new_last_name,
        school_number = new_school_number,
        class = new_class,
        updated_at = NOW()
    WHERE id = target_user_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Profil güncellenemedi');
    END IF;

    -- Başarılı
    RETURN jsonb_build_object('success', true);
END;
$$;
