-- Feedback tablosuna soft delete için deleted_at kolonu ekle
ALTER TABLE public.feedback 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Soft delete index
CREATE INDEX IF NOT EXISTS idx_feedback_deleted_at ON public.feedback(deleted_at);

-- RPC: Feedback soft delete
CREATE OR REPLACE FUNCTION public.soft_delete_feedback(feedback_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Kullanıcı level kontrolü (Super Admin >= 100)
    IF get_my_level() < 100 THEN
        RAISE EXCEPTION 'Yetkiniz yok';
    END IF;

    -- Soft delete işlemi
    UPDATE public.feedback
    SET deleted_at = NOW()
    WHERE id = feedback_id AND deleted_at IS NULL;

    RETURN FOUND;
END;
$$;

-- RLS policy güncelle - silinen feedbackları gösterme
DROP POLICY IF EXISTS "Admins can view all feedback" ON public.feedback;
DROP POLICY IF EXISTS "Admins can view active feedback" ON public.feedback;

CREATE POLICY "Admins can view active feedback"
ON public.feedback FOR SELECT
TO authenticated
USING (
    deleted_at IS NULL AND get_my_level() >= 50
);
