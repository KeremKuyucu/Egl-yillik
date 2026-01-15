-- =====================================================
-- KULLANICI KATEGORİ ÖNERİ SİSTEMİ
-- =====================================================
-- Kullanıcılar yeni kategori önerebilir
-- Adminler onaylayabilir, düzenleyebilir veya silebilir
-- =====================================================

-- =====================================================
-- 1. USER_CATEGORY_SUGGESTIONS TABLOSU
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_category_suggestions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    emoji TEXT NOT NULL,
    description TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT 'from-purple-500 to-pink-500',
    
    -- Öneri durumu
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    
    -- Kim önerdi
    suggested_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Admin notları
    admin_note TEXT,
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMPTZ,
    
    -- Onaylandığında oluşturulan kategori ID'si
    approved_category_id TEXT REFERENCES survey_categories(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexler
CREATE INDEX IF NOT EXISTS idx_user_category_suggestions_status ON public.user_category_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_user_category_suggestions_suggested_by ON public.user_category_suggestions(suggested_by);

-- RLS Aktif Et
ALTER TABLE public.user_category_suggestions ENABLE ROW LEVEL SECURITY;

-- OKUMA: Kullanıcılar kendi önerilerini görebilir, Admin hepsini görebilir
CREATE POLICY "user_category_suggestions_select" ON public.user_category_suggestions
    FOR SELECT
    TO authenticated
    USING (
        suggested_by = auth.uid()
        OR get_my_level() >= 50
    );

-- EKLEME: Herkes öneri yapabilir (kendi adına)
CREATE POLICY "user_category_suggestions_insert" ON public.user_category_suggestions
    FOR INSERT
    TO authenticated
    WITH CHECK (suggested_by = auth.uid());

-- GÜNCELLEME: Sadece Admin (level >= 50)
CREATE POLICY "user_category_suggestions_update" ON public.user_category_suggestions
    FOR UPDATE
    TO authenticated
    USING (get_my_level() >= 50)
    WITH CHECK (get_my_level() >= 50);

-- SİLME: Sadece Admin (level >= 50)
CREATE POLICY "user_category_suggestions_delete" ON public.user_category_suggestions
    FOR DELETE
    TO authenticated
    USING (get_my_level() >= 50);

-- =====================================================
-- 2. SURVEY_CATEGORIES TABLOSUNA ALAN EKLE
-- =====================================================
-- Kategorinin kullanıcı tarafından mı önerildiğini takip et

ALTER TABLE public.survey_categories
ADD COLUMN IF NOT EXISTS is_user_suggested BOOLEAN DEFAULT false;

ALTER TABLE public.survey_categories
ADD COLUMN IF NOT EXISTS suggested_by UUID REFERENCES profiles(id);

-- =====================================================
-- KURULUM TAMAMLANDI!
-- =====================================================
