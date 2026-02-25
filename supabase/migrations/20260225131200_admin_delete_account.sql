-- Admin tarafından kullanıcı hesabını silme (soft delete)
-- delete_own_account ile aynı mantık fakat admin izni ile çalışır
-- ve hedef kullanıcıyı parametre olarak alır.

CREATE OR REPLACE FUNCTION public.admin_delete_account(target_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  caller_level integer;
  target_level integer;
BEGIN
  -- İzin kontrolü
  PERFORM public.require_permission('admin.account.delete');

  -- Caller level (user_roles + roles join)
  SELECT COALESCE(MAX(r.level), 0)
  INTO caller_level
  FROM public.user_roles ur
  JOIN public.roles r ON r.key = ur.role_key
  WHERE ur.user_id = auth.uid();

  -- Target level (aynı pattern)
  SELECT COALESCE(MAX(r.level), 0)
  INTO target_level
  FROM public.user_roles ur
  JOIN public.roles r ON r.key = ur.role_key
  WHERE ur.user_id = target_user_id;

  -- Kendinden üst veya eşit seviyedeki kullanıcıyı silemez
  IF caller_level <= target_level THEN
    RAISE EXCEPTION 'Bu kullanıcıyı silme yetkiniz yok';
  END IF;

  -- Zaten silinmiş mi kontrol et
  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = target_user_id AND deleted_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Bu hesap zaten silinmiş';
  END IF;

  -- Profil soft delete
  UPDATE public.profiles
  SET deleted_at = now()
  WHERE id = target_user_id;

  -- Email opt-out
  INSERT INTO public.email_opt_outs (user_id)
  VALUES (target_user_id)
  ON CONFLICT (user_id)
  DO UPDATE SET updated_at = now();

  -- Auth ban
  UPDATE auth.users
  SET banned_until = 'infinity',
      updated_at = now()
  WHERE id = target_user_id;
END;
$function$;

ALTER FUNCTION public.admin_delete_account(uuid) OWNER TO postgres;

GRANT EXECUTE ON FUNCTION public.admin_delete_account(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_account(uuid) TO service_role;
