-- Admin tarafından silinmiş kullanıcı hesabını geri getirme
-- admin_delete_account'ın tersini yapar:
-- deleted_at'ı temizler, email opt-out'u kaldırır, auth ban'ı kaldırır.

CREATE OR REPLACE FUNCTION public.admin_restore_account(target_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
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
$function$;

ALTER FUNCTION public.admin_restore_account(uuid) OWNER TO postgres;

GRANT EXECUTE ON FUNCTION public.admin_restore_account(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_restore_account(uuid) TO service_role;
