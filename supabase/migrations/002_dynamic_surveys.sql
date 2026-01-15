-- =====================================================
-- DİNAMİK ANKET SİSTEMİ
-- =====================================================
-- Anketler Supabase'den çekilecek
-- Kullanıcılar özel seçenek ekleyebilecek (sınıfa özel)
-- =====================================================

-- =====================================================
-- 1. SURVEY_CATEGORIES TABLOSU
-- =====================================================
-- Anket kategorileri artık veritabanında tutulacak

CREATE TABLE IF NOT EXISTS public.survey_categories (
    id TEXT NOT NULL PRIMARY KEY,
    title TEXT NOT NULL,
    emoji TEXT NOT NULL,
    description TEXT NOT NULL,
    color TEXT NOT NULL,  -- Tailwind gradient class
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Aktif Et
ALTER TABLE public.survey_categories ENABLE ROW LEVEL SECURITY;

-- OKUMA: Herkes aktif kategorileri okuyabilir
CREATE POLICY "survey_categories_select_active" ON public.survey_categories
    FOR SELECT
    TO authenticated
    USING (is_active = true OR get_my_level() >= 50);

-- EKLEME/GÜNCELLEME/SİLME: Sadece Admin (level >= 50)
CREATE POLICY "survey_categories_admin_all" ON public.survey_categories
    FOR ALL
    TO authenticated
    USING (get_my_level() >= 50)
    WITH CHECK (get_my_level() >= 50);

-- =====================================================
-- 2. SURVEY_CUSTOM_OPTIONS TABLOSU
-- =====================================================
-- Kullanıcıların eklediği özel seçenekler (sınıfa özel)

CREATE TABLE IF NOT EXISTS public.survey_custom_options (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id TEXT NOT NULL REFERENCES survey_categories(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    class TEXT NOT NULL,  -- Seçeneğin ait olduğu sınıf (12A, 12B, vb.)
    vote_count INTEGER NOT NULL DEFAULT 0,  -- Oy sayısı (performans için)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Aynı kişi aynı kategoride aynı metni tekrar ekleyemez
    UNIQUE(category_id, option_text, class),
    
    -- Sınıf kontrolü
    CONSTRAINT survey_custom_options_class_check CHECK (
        class = ANY(ARRAY['12A', '12B', '12C', '12D', '12E', '12F'])
    )
);

-- Indexler
CREATE INDEX IF NOT EXISTS idx_survey_custom_options_category ON public.survey_custom_options(category_id);
CREATE INDEX IF NOT EXISTS idx_survey_custom_options_class ON public.survey_custom_options(class);
CREATE INDEX IF NOT EXISTS idx_survey_custom_options_category_class ON public.survey_custom_options(category_id, class);

-- RLS Aktif Et
ALTER TABLE public.survey_custom_options ENABLE ROW LEVEL SECURITY;

-- OKUMA: Kullanıcılar sadece kendi sınıflarındaki seçenekleri görebilir
CREATE POLICY "survey_custom_options_select_class" ON public.survey_custom_options
    FOR SELECT
    TO authenticated
    USING (
        class = (SELECT p.class FROM public.profiles p WHERE p.id = auth.uid())
        OR get_my_level() >= 50
    );

-- EKLEME: Kullanıcılar kendi sınıfları için seçenek ekleyebilir
CREATE POLICY "survey_custom_options_insert_own_class" ON public.survey_custom_options
    FOR INSERT
    TO authenticated
    WITH CHECK (
        created_by = auth.uid()
        AND class = (SELECT p.class FROM public.profiles p WHERE p.id = auth.uid())
    );

-- GÜNCELLEME: Sadece kendi eklediğini güncelleyebilir
CREATE POLICY "survey_custom_options_update_own" ON public.survey_custom_options
    FOR UPDATE
    TO authenticated
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

-- SİLME: Sadece Admin silebilir
CREATE POLICY "survey_custom_options_delete_admin" ON public.survey_custom_options
    FOR DELETE
    TO authenticated
    USING (get_my_level() >= 50);

-- =====================================================
-- 3. SURVEY_VOTES TABLOSUNA CUSTOM_OPTION DESTEĞİ
-- =====================================================
-- Mevcut tabloya custom_option_id kolonu ekle

ALTER TABLE public.survey_votes 
ADD COLUMN IF NOT EXISTS custom_option_id UUID REFERENCES survey_custom_options(id) ON DELETE SET NULL;

-- voted_for_id nullable yapıyoruz çünkü custom option seçilebilir
ALTER TABLE public.survey_votes 
ALTER COLUMN voted_for_id DROP NOT NULL;

-- Constraint: Ya voted_for_id ya da custom_option_id dolu olmalı
ALTER TABLE public.survey_votes
ADD CONSTRAINT survey_votes_vote_target_check 
CHECK (voted_for_id IS NOT NULL OR custom_option_id IS NOT NULL);

-- Index
CREATE INDEX IF NOT EXISTS idx_survey_votes_custom_option ON public.survey_votes(custom_option_id);

-- =====================================================
-- 4. MEVCUT KATEGORİLERİ VERİTABANINA TAŞI
-- =====================================================

INSERT INTO public.survey_categories (id, title, emoji, description, color, sort_order) VALUES
    ('most_funny', 'En Komik', '😂', 'Sınıfı en çok güldüren kişi', 'from-yellow-500 to-orange-500', 1),
    ('most_hardworking', 'En Çalışkan', '📚', 'En azimli ve çalışkan öğrenci', 'from-blue-500 to-indigo-500', 2),
    ('most_helpful', 'En Yardımsever', '🤝', 'Her zaman yardıma koşan', 'from-green-500 to-emerald-500', 3),
    ('best_friend', 'En İyi Arkadaş', '💜', 'Herkesin güvendiği dost', 'from-purple-500 to-pink-500', 4),
    ('most_creative', 'En Yaratıcı', '🎨', 'Fikirler konusunda en özgün', 'from-pink-500 to-rose-500', 5),
    ('most_athletic', 'En Sporcu', '⚽', 'Spor konusunda en yetenekli', 'from-cyan-500 to-blue-500', 6),
    ('most_stylish', 'En Şık', '✨', 'Giyim konusunda en dikkat çekici', 'from-amber-500 to-yellow-500', 7),
    ('class_comedian', 'Sınıf Komedyeni', '🎭', 'Dersleri eğlenceli hale getiren', 'from-red-500 to-orange-500', 8),
    ('most_talkative', 'En Konuşkan', '💬', 'Sohbetin vazgeçilmezi', 'from-teal-500 to-cyan-500', 9),
    ('most_quiet', 'En Sessiz Güç', '🤫', 'Sessiz ama etkili', 'from-slate-500 to-gray-500', 10),
    ('future_ceo', 'Gelecekte CEO', '💼', 'Liderlik potansiyeli en yüksek', 'from-violet-500 to-purple-500', 11),
    ('most_likely_to_be_famous', 'Gelecekte Ünlü', '🌟', 'Ünlü olma ihtimali en yüksek', 'from-rose-500 to-pink-500', 12),
    ('most_adventurous', 'En Maceracı', '🧗', 'Her türlü çılgınlığa hazır olan', 'from-orange-600 to-red-600', 13),
    ('tech_guru', 'Teknoloji Gurusu', '💻', 'Tüm teknik sorunları çözen', 'from-slate-700 to-slate-900', 14),
    ('bookworm', 'Kitap Kurdu', '📖', 'Elinden kitap düşmeyen', 'from-emerald-700 to-teal-700', 15),
    ('best_gamer', 'En İyi Oyuncu', '🎮', 'Oyunlarda rakip tanımayan', 'from-indigo-600 to-purple-800', 16),
    ('sleeping_beauty', 'En Uykucu', '😴', 'Her fırsatta uyuklayan', 'from-blue-200 to-blue-400', 17),
    ('social_media_star', 'Sosyal Medya Starı', '📸', 'Paylaşımları en çok ilgi gören', 'from-fuchsia-500 to-purple-600', 18),
    ('most_optimistic', 'En Pozitif', '☀️', 'Her zaman bardağın dolu tarafını gören', 'from-yellow-300 to-yellow-500', 19),
    ('master_chef', 'Mutfak Ustası', '🍳', 'En lezzetli atıştırmalıkları getiren', 'from-orange-400 to-red-500', 20),
    ('animal_lover', 'Hayvan Dostu', '🐾', 'Tüm canlıları canı gönülden seven', 'from-green-400 to-lime-500', 21),
    ('most_mysterious', 'En Gizemli', '🕵️', 'Hakkında en az şey bilinen', 'from-gray-600 to-black', 22)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    emoji = EXCLUDED.emoji,
    description = EXCLUDED.description,
    color = EXCLUDED.color,
    sort_order = EXCLUDED.sort_order;

-- =====================================================
-- 5. YARDIMCI FONKSİYONLAR
-- =====================================================

-- Bir sınıfın belirli kategorideki özel seçeneklerini getir
CREATE OR REPLACE FUNCTION get_class_custom_options(p_category_id TEXT, p_class TEXT)
RETURNS TABLE (
    id UUID,
    option_text TEXT,
    vote_count INTEGER,
    created_by UUID,
    created_at TIMESTAMPTZ
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
    SELECT 
        sco.id,
        sco.option_text,
        sco.vote_count,
        sco.created_by,
        sco.created_at
    FROM public.survey_custom_options sco
    WHERE sco.category_id = p_category_id 
      AND sco.class = p_class
    ORDER BY sco.vote_count DESC, sco.created_at ASC;
$$;

-- Custom option oy sayısını güncelle (trigger için)
CREATE OR REPLACE FUNCTION update_custom_option_vote_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Eski seçeneğin oy sayısını azalt
    IF OLD.custom_option_id IS NOT NULL THEN
        UPDATE public.survey_custom_options
        SET vote_count = vote_count - 1
        WHERE id = OLD.custom_option_id;
    END IF;
    
    -- Yeni seçeneğin oy sayısını artır
    IF NEW.custom_option_id IS NOT NULL THEN
        UPDATE public.survey_custom_options
        SET vote_count = vote_count + 1
        WHERE id = NEW.custom_option_id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Insert trigger
CREATE OR REPLACE FUNCTION update_custom_option_vote_count_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.custom_option_id IS NOT NULL THEN
        UPDATE public.survey_custom_options
        SET vote_count = vote_count + 1
        WHERE id = NEW.custom_option_id;
    END IF;
    RETURN NEW;
END;
$$;

-- Delete trigger
CREATE OR REPLACE FUNCTION update_custom_option_vote_count_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.custom_option_id IS NOT NULL THEN
        UPDATE public.survey_custom_options
        SET vote_count = vote_count - 1
        WHERE id = OLD.custom_option_id;
    END IF;
    RETURN OLD;
END;
$$;

-- Trigger'ları oluştur
DROP TRIGGER IF EXISTS survey_votes_custom_option_update ON public.survey_votes;
CREATE TRIGGER survey_votes_custom_option_update
    AFTER UPDATE ON public.survey_votes
    FOR EACH ROW
    WHEN (OLD.custom_option_id IS DISTINCT FROM NEW.custom_option_id)
    EXECUTE FUNCTION update_custom_option_vote_count();

DROP TRIGGER IF EXISTS survey_votes_custom_option_insert ON public.survey_votes;
CREATE TRIGGER survey_votes_custom_option_insert
    AFTER INSERT ON public.survey_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_custom_option_vote_count_insert();

DROP TRIGGER IF EXISTS survey_votes_custom_option_delete ON public.survey_votes;
CREATE TRIGGER survey_votes_custom_option_delete
    AFTER DELETE ON public.survey_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_custom_option_vote_count_delete();

-- =====================================================
-- KURULUM TAMAMLANDI!
-- =====================================================
