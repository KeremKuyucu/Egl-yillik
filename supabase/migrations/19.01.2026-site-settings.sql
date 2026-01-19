-- Site Settings Table
-- Bu tablo site genelindeki ayarları (deadline vb.) saklamak için kullanılır

-- Tablo oluştur
CREATE TABLE IF NOT EXISTS public.site_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS etkinleştir
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilir (deadline gibi bilgiler public olmalı)
CREATE POLICY "Site settings are viewable by everyone" 
ON public.site_settings 
FOR SELECT 
USING (true);

-- Sadece Super Admin ve üzeri yazabilir
CREATE POLICY "Only super admins can update site settings" 
ON public.site_settings 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.level >= 100
    )
);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_site_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER site_settings_updated_at
    BEFORE UPDATE ON public.site_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_site_settings_updated_at();

-- Default deadline ekleme (Şubat 9, 2026)
INSERT INTO public.site_settings (key, value, description)
VALUES ('deadline', '2026-02-09T23:59:59.000Z', 'Yıllık yazıları için son teslim tarihi')
ON CONFLICT (key) DO NOTHING;

-- Index
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON public.site_settings(key);
