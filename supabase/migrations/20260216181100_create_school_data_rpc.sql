CREATE OR REPLACE FUNCTION public.get_school_data(target_year smallint DEFAULT NULL::smallint)
 RETURNS TABLE(id uuid, first_name text, last_name text, school_number text, class text, user_year smallint, total_texts_received bigint, total_texts_written bigint, total_words_received bigint, total_words_written bigint, total_votes numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    v.id,
    v.first_name,
    v.last_name,
    v.school_number,
    v.class,
    v.user_year,
    v.total_texts_received::bigint,
    v.total_texts_written::bigint,
    v.total_words_received::bigint,
    v.total_words_written::bigint,
    v.total_votes::numeric
  FROM public.school_data_view v
  WHERE (target_year IS NULL OR v.user_year = target_year)
  ORDER BY v.class ASC, v.first_name ASC;
$function$
