-- Otomatik Hata Raporları Tablosu
CREATE TABLE IF NOT EXISTS public.error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    page_url TEXT,
    user_agent TEXT,
    severity TEXT DEFAULT 'error', -- 'error', 'warning', 'critical'
    is_resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexler
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON public.error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON public.error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_is_resolved ON public.error_logs(is_resolved);

-- RLS Politikaları
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Herkes hata kaydı ekleyebilir (Anonim dahil - uygulamanın her durumunda hata yakalamak için)
CREATE POLICY "Anyone can insert error logs"
ON public.error_logs FOR INSERT
TO public
WITH CHECK (true);

-- Sadece adminler hataları görebilir (Level >= 1000)
CREATE POLICY "Admins can view error logs"
ON public.error_logs FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_levels
        WHERE id = auth.uid() AND level >= 1000
    )
);

-- Sadece adminler hataları güncelleyebilir (çözüldü olarak işaretleme vb)
CREATE POLICY "Admins can update error logs"
ON public.error_logs FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_levels
        WHERE id = auth.uid() AND level >= 1000
    )
);

COMMENT ON TABLE public.error_logs IS 'Sistem tarafından otomatik yakalanan hata kayıtları';
