-- 1. Kullanıcının kendi aktif oturumlarını (session) getiren RPC
CREATE OR REPLACE FUNCTION public.get_user_sessions()
RETURNS TABLE(
    id uuid,
    created_at timestamptz,
    updated_at timestamptz,
    user_agent text,
    ip text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.created_at,
        s.updated_at,
        s.user_agent,
        s.ip::text
    FROM auth.sessions s
    WHERE s.user_id = auth.uid()
    ORDER BY s.updated_at DESC;
END;
$$;

-- 2. Belirli bir oturumu sonlandıran (silen) RPC
CREATE OR REPLACE FUNCTION public.delete_user_session(p_session_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    DELETE FROM auth.sessions
    WHERE auth.sessions.id = p_session_id 
      AND auth.sessions.user_id = auth.uid();
      
    RETURN FOUND;
END;
$$;

-- Ek güvenlik: RPC'leri sadece yetkili kullanıcıların (authenticated) çalıştırabilmesini sağlama
REVOKE EXECUTE ON FUNCTION public.get_user_sessions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_sessions() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.delete_user_session(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_user_session(uuid) TO authenticated;
