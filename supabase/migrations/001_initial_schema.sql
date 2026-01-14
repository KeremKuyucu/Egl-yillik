-- =====================================================
-- EGL YILLIK - TAM VERİTABANI ŞEMASI
-- =====================================================
-- Bu SQL'i Supabase Dashboard > SQL Editor'de çalıştırın
-- =====================================================

-- =====================================================
-- 1. YARDIMCI FONKSİYONLAR
-- =====================================================

-- Kullanıcının kendi seviyesini döndüren fonksiyon
CREATE OR REPLACE FUNCTION get_my_level()
RETURNS INTEGER
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
    SELECT COALESCE(
        (SELECT level FROM public.profiles WHERE id = auth.uid()),
        0
    );
$$;

-- Updated_at trigger fonksiyonu
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- =====================================================
-- 2. PROFILES TABLOSU
-- =====================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    school_number TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    class TEXT NOT NULL DEFAULT '12A',
    level INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_active TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT profiles_pkey PRIMARY KEY (id),
    CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT profiles_class_check CHECK (
        class = ANY(ARRAY['12A', '12B', '12C', '12D', '12E', '12F'])
    ),
    CONSTRAINT profiles_school_number_check CHECK (
        length(school_number) = 3 AND school_number ~ '^[0-9]{3}$'
    )
);

-- Indexler
CREATE INDEX IF NOT EXISTS profiles_school_number_idx ON public.profiles(school_number);
CREATE INDEX IF NOT EXISTS profiles_class_idx ON public.profiles(class);

-- RLS Aktif Et
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Politikaları

-- OKUMA: Herkes tüm profilleri okuyabilir
CREATE POLICY "profiles_select_all" ON public.profiles
    FOR SELECT
    TO authenticated
    USING (true);

-- EKLEME: Sadece kendi profilini ekleyebilir
CREATE POLICY "profiles_insert_self" ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid());

-- GÜNCELLEME: Kendi profilini veya admin ise alt seviyedekileri güncelleyebilir
CREATE POLICY "profiles_update_self_or_admin" ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (
        (id = auth.uid()) 
        OR 
        (get_my_level() >= 10 AND level < get_my_level())
    )
    WITH CHECK (
        (
            id = auth.uid() AND 
            level = (SELECT p.level FROM public.profiles p WHERE p.id = auth.uid())
        ) 
        OR 
        (
            get_my_level() >= 10 AND 
            level < get_my_level()
        )
    );

-- SİLME: Kimse profil silemez
-- (Policy yok = silme izni yok)

-- =====================================================
-- 3. TEXTS TABLOSU
-- =====================================================

CREATE TABLE IF NOT EXISTS public.texts (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    recipient_id UUID NOT NULL,
    
    CONSTRAINT texts_pkey PRIMARY KEY (id),
    CONSTRAINT texts_author_id_fkey FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE CASCADE,
    CONSTRAINT texts_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Indexler
CREATE INDEX IF NOT EXISTS texts_author_id_idx ON public.texts(author_id);
CREATE INDEX IF NOT EXISTS texts_recipient_id_idx ON public.texts(recipient_id);
CREATE UNIQUE INDEX IF NOT EXISTS texts_author_recipient_unique ON public.texts(author_id, recipient_id);

-- Updated_at Trigger
DROP TRIGGER IF EXISTS texts_updated_at ON public.texts;
CREATE TRIGGER texts_updated_at
    BEFORE UPDATE ON public.texts
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- RLS Aktif Et
ALTER TABLE public.texts ENABLE ROW LEVEL SECURITY;

-- Texts RLS Politikaları

-- OKUMA: Kendi yazdıkları veya Admin (level >= 50) tümünü okuyabilir
CREATE POLICY "texts_select_own_or_admin" ON public.texts
    FOR SELECT
    TO authenticated
    USING (
        author_id = auth.uid()
        OR
        get_my_level() >= 50
    );

-- EKLEME: Herkes kendi adına text ekleyebilir
CREATE POLICY "texts_insert_own" ON public.texts
    FOR INSERT
    TO authenticated
    WITH CHECK (author_id = auth.uid());

-- GÜNCELLEME: Sadece kendi yazdıklarını güncelleyebilir
CREATE POLICY "texts_update_own" ON public.texts
    FOR UPDATE
    TO authenticated
    USING (author_id = auth.uid())
    WITH CHECK (author_id = auth.uid());

-- SİLME: Sadece Admin (level >= 50) silebilir
CREATE POLICY "texts_delete_admin" ON public.texts
    FOR DELETE
    TO authenticated
    USING (get_my_level() >= 50);

-- =====================================================
-- 4. SURVEY_VOTES TABLOSU (ANKET OY)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.survey_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    voter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    voted_for_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    category_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Her kullanıcı her kategoride sadece 1 kez oy verebilir
    UNIQUE(voter_id, category_id)
);

-- Indexler
CREATE INDEX IF NOT EXISTS idx_survey_votes_voter_id ON public.survey_votes(voter_id);
CREATE INDEX IF NOT EXISTS idx_survey_votes_voted_for_id ON public.survey_votes(voted_for_id);
CREATE INDEX IF NOT EXISTS idx_survey_votes_category_id ON public.survey_votes(category_id);

-- RLS Aktif Et
ALTER TABLE public.survey_votes ENABLE ROW LEVEL SECURITY;

-- Survey Votes RLS Politikaları

-- OKUMA: Herkes oy sonuçlarını görebilir
CREATE POLICY "survey_votes_select_all" ON public.survey_votes
    FOR SELECT
    TO authenticated
    USING (true);

-- EKLEME: Kullanıcılar sadece kendi oylarını ekleyebilir
CREATE POLICY "survey_votes_insert_own" ON public.survey_votes
    FOR INSERT
    TO authenticated
    WITH CHECK (voter_id = auth.uid());

-- GÜNCELLEME: Kullanıcılar sadece kendi oylarını güncelleyebilir
CREATE POLICY "survey_votes_update_own" ON public.survey_votes
    FOR UPDATE
    TO authenticated
    USING (voter_id = auth.uid())
    WITH CHECK (voter_id = auth.uid());

-- SİLME: Kullanıcılar sadece kendi oylarını silebilir
CREATE POLICY "survey_votes_delete_own" ON public.survey_votes
    FOR DELETE
    TO authenticated
    USING (voter_id = auth.uid());

-- =====================================================
-- 5. YARDIMCI RPC FONKSİYONLARI
-- =====================================================

-- Kullanıcının aldığı anı sayısını döndürür (gizlilik için RPC)
CREATE OR REPLACE FUNCTION get_my_received_count()
RETURNS INTEGER
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
    SELECT COUNT(*)::INTEGER
    FROM public.texts
    WHERE recipient_id = auth.uid();
$$;

-- Admin dashboard istatistikleri
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS JSON
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
    SELECT json_build_object(
        'users', (SELECT COUNT(*) FROM public.profiles),
        'texts', (SELECT COUNT(*) FROM public.texts)
    );
$$;

-- =====================================================
-- KURULUM TAMAMLANDI!
-- =====================================================
