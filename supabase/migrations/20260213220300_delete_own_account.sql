-- Kullanıcının kendi hesabını silmesi için RPC fonksiyonu
-- SECURITY DEFINER ile çalışır: profiles tablosundan satırı siler,
-- diğer tablolardaki veriler CASCADE ile otomatik silinir.
-- auth.users kaydını da admin API ile siler.

CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
DECLARE
  v_uid uuid;
BEGIN
  v_uid := auth.uid();

  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Oturum bulunamadı.';
  END IF;

  -- Profil var mı kontrol et
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_uid) THEN
    RAISE EXCEPTION 'Profil bulunamadı.';
  END IF;

  -- Profili sil (cascade ile bağlı veriler otomatik silinir)
  DELETE FROM public.profiles WHERE id = v_uid;
END;
$$;

ALTER FUNCTION public.delete_own_account() OWNER TO postgres;
