CREATE OR REPLACE FUNCTION public.get_admin_users_list(
  class_filter text DEFAULT NULL::text,
  search_query text DEFAULT NULL::text,
  sort_by text DEFAULT 'role'::text
)
RETURNS TABLE(
  id uuid,
  first_name text,
  last_name text,
  school_number text,
  class text,
  user_year smallint,
  last_active timestamptz,
  role_level integer,
  highest_role_key text,
  is_deleted boolean,
  deleted_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  PERFORM public.require_permission('admin.users.read');

  RETURN QUERY
  WITH user_role_max AS (
    SELECT
      ur.user_id,
      MAX(r.level)::int AS role_level,
      (ARRAY_AGG(r.key ORDER BY r.level DESC))[1]::text AS highest_role_key
    FROM public.user_roles ur
    JOIN public.roles r ON r.key = ur.role_key
    GROUP BY ur.user_id
  )
  SELECT
    p.id,
    p.first_name,
    p.last_name,
    p.school_number,
    p.class,
    p.user_year,
    p.last_active,
    COALESCE(urm.role_level, 0) AS role_level,
    COALESCE(urm.highest_role_key, 'user') AS highest_role_key,
    (p.deleted_at IS NOT NULL) AS is_deleted,
    p.deleted_at
  FROM public.profiles p
  LEFT JOIN user_role_max urm ON urm.user_id = p.id
  WHERE
    (class_filter IS NULL OR class_filter = '' OR p.class = class_filter)
    AND (
      search_query IS NULL OR search_query = '' OR
      LOWER(p.first_name || ' ' || p.last_name) LIKE '%' || LOWER(search_query) || '%' OR
      p.school_number::TEXT LIKE '%' || search_query || '%'
    )
  ORDER BY
    CASE WHEN sort_by = 'last_active' THEN p.last_active END DESC NULLS LAST,
    CASE WHEN sort_by = 'role' THEN COALESCE(urm.role_level, 0) END DESC,
    p.last_name ASC;
END;
$function$;
