-- Feedback tablosu
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('bug', 'suggestion', 'complaint', 'other')),
    message TEXT NOT NULL,
    page_url TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON public.feedback(type);

-- RLS Policies
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Herkes feedback ekleyebilir (authenticated users)
CREATE POLICY "Authenticated users can insert feedback"
ON public.feedback FOR INSERT
TO authenticated
WITH CHECK (true);

-- Sadece adminler feedback okuyabilir
CREATE POLICY "Admins can view all feedback"
ON public.feedback FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_levels
        WHERE id = auth.uid() AND level >= 50
    )
);

-- Sadece super adminler feedback silebilir
CREATE POLICY "Super admins can delete feedback"
ON public.feedback FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_levels
        WHERE id = auth.uid() AND level >= 100
    )
);

COMMENT ON TABLE public.feedback IS 'Kullanıcı geri bildirimleri';
