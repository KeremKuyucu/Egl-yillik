CREATE OR REPLACE FUNCTION public.get_admin_texts_export()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_items json;
BEGIN
  PERFORM public.require_permission('admin.texts.metadata');

  WITH unified AS (
    SELECT
      t.author_id,
      t.recipient_id,
      r.first_name || ' ' || r.last_name AS recipient_name,
      r.school_number AS recipient_school_number,
      r.class AS recipient_class,
      r.user_year AS recipient_year,
      a.first_name || ' ' || a.last_name AS author_name,
      a.school_number AS author_school_number,
      a.class AS author_class,
      a.user_year AS author_year,
      t.content,
      t.created_at,
      false AS is_anonymous
    FROM public.texts t
    JOIN public.profiles r ON t.recipient_id = r.id
    JOIN public.profiles a ON t.author_id = a.id
    WHERE t.is_active = true

    UNION ALL

    SELECT
      NULL::uuid AS author_id,
      at.recipient_id,
      r.first_name || ' ' || r.last_name AS recipient_name,
      r.school_number AS recipient_school_number,
      r.class AS recipient_class,
      r.user_year AS recipient_year,
      at.display_name AS author_name,
      NULL AS author_school_number,
      NULL AS author_class,
      NULL AS author_year,
      at.content,
      at.created_at,
      true AS is_anonymous
    FROM public.anonymous_texts at
    JOIN public.profiles r ON at.recipient_id = r.id
    WHERE at.is_active = true
  )
  SELECT COALESCE(json_agg(row_to_json(u)), '[]'::json)
  INTO v_items
  FROM (
    SELECT * FROM unified
    ORDER BY recipient_class, recipient_school_number, created_at ASC
  ) u;

  RETURN v_items;
END;
$$;
