-- =====================================================
-- EGL YILLIK - FULL BACKUP (16.01.2026)
-- =====================================================
-- Bu dosya tüm aktif fonksiyon, tablo ve viewleri içerir.
-- NOT: get_user_class_stats fonksiyonu migration dosyalarında bulunamadığı için
-- veritabanından alınan parametrelere göre yeniden oluşturulmuştur.
-- =====================================================

-- =====================================================
-- 1. TABLOLAR VE INDEXLER
-- =====================================================

-- 1.1 PROFILES TABLOSU
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

CREATE INDEX IF NOT EXISTS profiles_school_number_idx ON public.profiles(school_number);
CREATE INDEX IF NOT EXISTS profiles_class_idx ON public.profiles(class);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 1.2 SURVEY_CATEGORIES TABLOSU
CREATE TABLE IF NOT EXISTS public.survey_categories (
    id TEXT NOT NULL PRIMARY KEY,
    title TEXT NOT NULL,
    emoji TEXT NOT NULL,
    description TEXT NOT NULL,
    color TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_user_suggested BOOLEAN DEFAULT false,
    suggested_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.survey_categories ENABLE ROW LEVEL SECURITY;

-- 1.3 SURVEY_CUSTOM_OPTIONS TABLOSU
CREATE TABLE IF NOT EXISTS public.survey_custom_options (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id TEXT NOT NULL REFERENCES survey_categories(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    class TEXT NOT NULL,
    vote_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(category_id, option_text, class),
    CONSTRAINT survey_custom_options_class_check CHECK (
        class = ANY(ARRAY['12A', '12B', '12C', '12D', '12E', '12F'])
    )
);

CREATE INDEX IF NOT EXISTS idx_survey_custom_options_category ON public.survey_custom_options(category_id);
CREATE INDEX IF NOT EXISTS idx_survey_custom_options_class ON public.survey_custom_options(class);
ALTER TABLE public.survey_custom_options ENABLE ROW LEVEL SECURITY;

-- 1.4 SURVEY_VOTES TABLOSU
CREATE TABLE IF NOT EXISTS public.survey_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    voter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    voted_for_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    custom_option_id UUID REFERENCES survey_custom_options(id) ON DELETE SET NULL,
    category_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(voter_id, category_id),
    CONSTRAINT survey_votes_vote_target_check 
    CHECK (voted_for_id IS NOT NULL OR custom_option_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_survey_votes_voter_id ON public.survey_votes(voter_id);
CREATE INDEX IF NOT EXISTS idx_survey_votes_voted_for_id ON public.survey_votes(voted_for_id);
CREATE INDEX IF NOT EXISTS idx_survey_votes_category_id ON public.survey_votes(category_id);
CREATE INDEX IF NOT EXISTS idx_survey_votes_custom_option ON public.survey_votes(custom_option_id);
ALTER TABLE public.survey_votes ENABLE ROW LEVEL SECURITY;

-- 1.5 TEXTS TABLOSU
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

CREATE INDEX IF NOT EXISTS texts_author_id_idx ON public.texts(author_id);
CREATE INDEX IF NOT EXISTS texts_recipient_id_idx ON public.texts(recipient_id);
CREATE UNIQUE INDEX IF NOT EXISTS texts_author_recipient_unique ON public.texts(author_id, recipient_id);
ALTER TABLE public.texts ENABLE ROW LEVEL SECURITY;

-- 1.6 USER_CATEGORY_SUGGESTIONS TABLOSU
CREATE TABLE IF NOT EXISTS public.user_category_suggestions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    emoji TEXT NOT NULL,
    description TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT 'from-purple-500 to-pink-500',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    suggested_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    admin_note TEXT,
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMPTZ,
    approved_category_id TEXT REFERENCES survey_categories(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_category_suggestions_status ON public.user_category_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_user_category_suggestions_suggested_by ON public.user_category_suggestions(suggested_by);
ALTER TABLE public.user_category_suggestions ENABLE ROW LEVEL SECURITY;


-- =====================================================
-- 2. VIEWS
-- =====================================================

CREATE OR REPLACE VIEW public.profile_vote_summary AS
SELECT 
    voted_for_id as user_id,
    category_id,
    COUNT(*) as vote_count
FROM survey_votes
WHERE voted_for_id IS NOT NULL
GROUP BY voted_for_id, category_id
UNION ALL
SELECT 
    sco.created_by as user_id,
    sco.category_id,
    sco.vote_count
FROM survey_custom_options sco;


-- =====================================================
-- 3. FONKSIYONLAR
-- =====================================================

-- 3.1 get_my_level
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

-- 3.2 handle_updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- 3.3 get_my_received_count
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

-- 3.4 get_admin_dashboard_stats
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

-- 3.5 get_all_school_stats
CREATE OR REPLACE FUNCTION get_all_school_stats()
RETURNS TABLE (
    user_id UUID,
    first_name TEXT,
    last_name TEXT,
    class TEXT,
    school_number TEXT,
    total_texts_written INTEGER,
    total_texts_received INTEGER,
    school_completion_percentage NUMERIC
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_total_students INTEGER;
BEGIN
    SELECT COUNT(*)::INTEGER INTO v_total_students FROM profiles;

    RETURN QUERY
    WITH written_stats AS (
        SELECT 
            t.author_id,
            COUNT(t.id)::INTEGER as total_texts
        FROM texts t
        GROUP BY t.author_id
    ),
    received_stats AS (
        SELECT 
            t.recipient_id,
            COUNT(t.id)::INTEGER as total_received
        FROM texts t
        GROUP BY t.recipient_id
    )
    SELECT 
        p.id,
        p.first_name,
        p.last_name,
        p.class,
        p.school_number,
        COALESCE(ws.total_texts, 0) as total_texts_written,
        COALESCE(rs.total_received, 0) as total_texts_received,
        0::NUMERIC 
    FROM profiles p
    LEFT JOIN written_stats ws ON p.id = ws.author_id
    LEFT JOIN received_stats rs ON p.id = rs.recipient_id
    ORDER BY p.class, p.first_name;
END;
$$;

-- 3.6 get_user_class_stats
-- Bu fonksiyon migrationlarda bulunmadığı için mantıksal olarak yeniden oluşturuldu.
-- Amacı: Bir kullanıcının sınıfındaki toplam öğrenci sayısını ve
-- kaçına yazı yazdığını istatistik olarak döndürmek.
CREATE OR REPLACE FUNCTION get_user_class_stats(target_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_class TEXT;
    v_class_count INTEGER;
    v_written_count INTEGER;
    v_received_count INTEGER;
BEGIN
    -- Kullanıcının sınıfını al
    SELECT class INTO v_class FROM profiles WHERE id = target_user_id;
    
    -- Sınıf mevcudunu al (kendisi dahil)
    SELECT COUNT(*)::INTEGER INTO v_class_count 
    FROM profiles 
    WHERE class = v_class;

    -- Sınıf içi yazdığı yazı sayısını al (target_user -> sınıf arkadaşları)
    -- Kendisine yazı yazamadığı için total_classmates - 1 kişi arasından seçim yapar
    SELECT COUNT(*)::INTEGER INTO v_written_count
    FROM texts t
    JOIN profiles recipient ON t.recipient_id = recipient.id
    WHERE t.author_id = target_user_id 
    AND recipient.class = v_class;

    -- Toplam aldığı yazı sayısı
    SELECT COUNT(*)::INTEGER INTO v_received_count
    FROM texts
    WHERE recipient_id = target_user_id;

    RETURN json_build_object(
        'class_name', v_class,
        'class_size', v_class_count,
        'written_in_class', v_written_count,
        'total_received', v_received_count
    );
END;
$$;

-- =====================================================
-- 4. TRIGGERS
-- =====================================================
DROP TRIGGER IF EXISTS texts_updated_at ON public.texts;
CREATE TRIGGER texts_updated_at
    BEFORE UPDATE ON public.texts
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- Custom Option Triggers (Özetlenen)
CREATE OR REPLACE FUNCTION update_custom_option_vote_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.custom_option_id IS NOT NULL THEN
        UPDATE public.survey_custom_options
        SET vote_count = vote_count - 1
        WHERE id = OLD.custom_option_id;
    END IF;
    IF NEW.custom_option_id IS NOT NULL THEN
        UPDATE public.survey_custom_options
        SET vote_count = vote_count + 1
        WHERE id = NEW.custom_option_id;
    END IF;
    RETURN NEW;
END;
$$;

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
