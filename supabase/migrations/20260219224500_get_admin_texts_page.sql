CREATE OR REPLACE FUNCTION public.get_admin_texts_page(
  p_limit   int  DEFAULT 50,
  p_offset  int  DEFAULT 0,
  p_search  text DEFAULT NULL,
  p_filter  text DEFAULT 'all',      -- all | self | others | anonymous
  p_class   text DEFAULT NULL,       -- örn '12A'
  p_sort    text DEFAULT 'newest',   -- newest | oldest
  p_user_id uuid DEFAULT NULL        -- uid filtresi
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_total   bigint;
  v_all     bigint;
  v_self    bigint;
  v_others  bigint;
  v_anon    bigint;
  v_classes json;
  v_items   json;
BEGIN
  PERFORM public.require_permission('admin.texts.metadata');

  -- ─── 1. Global stats (hafif, profile join yok) ───
  SELECT
    count(*),
    count(*) FILTER (WHERE NOT _anon AND _aid = _rid),
    count(*) FILTER (WHERE NOT _anon AND _aid IS DISTINCT FROM _rid AND _aid IS NOT NULL),
    count(*) FILTER (WHERE _anon)
  INTO v_all, v_self, v_others, v_anon
  FROM (
    SELECT false AS _anon, t.author_id AS _aid, t.recipient_id AS _rid
    FROM public.texts t
    WHERE t.is_active = true
      AND (p_user_id IS NULL OR t.author_id = p_user_id OR t.recipient_id = p_user_id)
    UNION ALL
    SELECT true AS _anon, NULL::uuid AS _aid, at.recipient_id AS _rid
    FROM public.anonymous_texts at
    WHERE at.is_active = true
      AND (p_user_id IS NULL OR at.recipient_id = p_user_id)
  ) s;

  -- ─── 2. Distinct sınıf listesi ───
  SELECT COALESCE(json_agg(c), '[]'::json) INTO v_classes
  FROM (SELECT DISTINCT class AS c FROM public.profiles WHERE class IS NOT NULL ORDER BY class) sub;

  -- ─── 3. Filtrelenmiş total + sayfalanmış items (TEK WITH BLOĞU) ───
  WITH unified AS (
    SELECT
      t.id::text           AS id,
      t.created_at,
      length(t.content)    AS content_length,
      false                AS is_anonymous,
      NULL::text           AS display_name,
      t.author_id,
      t.recipient_id,
      json_build_object(
        'id', a.id, 'first_name', a.first_name, 'last_name', a.last_name,
        'school_number', a.school_number, 'class', a.class, 'user_year', a.user_year
      ) AS author,
      json_build_object(
        'id', r.id, 'first_name', r.first_name, 'last_name', r.last_name,
        'school_number', r.school_number, 'class', r.class, 'user_year', r.user_year
      ) AS recipient
    FROM public.texts t
    LEFT JOIN public.profiles a ON t.author_id = a.id
    LEFT JOIN public.profiles r ON t.recipient_id = r.id
    WHERE t.is_active = true
      AND (p_user_id IS NULL OR t.author_id = p_user_id OR t.recipient_id = p_user_id)

    UNION ALL

    SELECT
      ('anon_' || at.id::text) AS id,
      at.created_at,
      length(at.content)       AS content_length,
      true                     AS is_anonymous,
      at.display_name,
      NULL::uuid               AS author_id,
      at.recipient_id,
      NULL::json               AS author,
      json_build_object(
        'id', r.id, 'first_name', r.first_name, 'last_name', r.last_name,
        'school_number', r.school_number, 'class', r.class, 'user_year', r.user_year
      ) AS recipient
    FROM public.anonymous_texts at
    LEFT JOIN public.profiles r ON at.recipient_id = r.id
    WHERE at.is_active = true
      AND (p_user_id IS NULL OR at.recipient_id = p_user_id)
  ),
  filtered AS (
    SELECT *
    FROM unified u
    WHERE
      (
        p_filter = 'all'
        OR (p_filter = 'anonymous' AND u.is_anonymous = true)
        OR (p_filter = 'self'      AND u.is_anonymous = false AND u.author_id = u.recipient_id)
        OR (p_filter = 'others'    AND u.is_anonymous = false AND u.author_id <> u.recipient_id)
      )
      AND (
        p_class IS NULL
        OR (u.is_anonymous = true  AND (u.recipient->>'class') = p_class)
        OR (u.is_anonymous = false AND ((u.author->>'class') = p_class OR (u.recipient->>'class') = p_class))
      )
      AND (
        p_search IS NULL OR p_search = ''
        OR (
          u.is_anonymous = true AND (
            lower(coalesce(u.display_name,'')) LIKE '%' || lower(p_search) || '%'
            OR lower(coalesce(u.recipient->>'first_name','') || ' ' || coalesce(u.recipient->>'last_name',''))
              LIKE '%' || lower(p_search) || '%'
            OR coalesce(u.recipient->>'school_number','') LIKE '%' || p_search || '%'
          )
        )
        OR (
          u.is_anonymous = false AND (
            lower(coalesce(u.author->>'first_name','') || ' ' || coalesce(u.author->>'last_name',''))
              LIKE '%' || lower(p_search) || '%'
            OR lower(coalesce(u.recipient->>'first_name','') || ' ' || coalesce(u.recipient->>'last_name',''))
              LIKE '%' || lower(p_search) || '%'
            OR coalesce(u.author->>'school_number','') LIKE '%' || p_search || '%'
            OR coalesce(u.recipient->>'school_number','') LIKE '%' || p_search || '%'
          )
        )
      )
  ),
  paged AS (
    SELECT
      json_build_object(
        'id',             f.id,
        'created_at',     f.created_at,
        'content_length', f.content_length,
        'isAnonymous',    f.is_anonymous,
        'display_name',   f.display_name,
        'author',         f.author,
        'recipient',      f.recipient
      ) AS x,
      f.created_at AS created_at_sort
    FROM filtered f
    ORDER BY
      CASE WHEN p_sort = 'oldest' THEN f.created_at END ASC,
      CASE WHEN p_sort <> 'oldest' THEN f.created_at END DESC
    LIMIT p_limit OFFSET p_offset
  )
  SELECT
    (SELECT count(*) FROM filtered),
    COALESCE((SELECT json_agg(p.x ORDER BY p.created_at_sort) FROM paged p), '[]'::json)
  INTO v_total, v_items;

  RETURN json_build_object(
    'total', v_total,
    'stats', json_build_object(
      'all',       v_all,
      'self',      v_self,
      'others',    v_others,
      'anonymous', v_anon
    ),
    'classes', v_classes,
    'items', v_items
  );
END;
$function$;
