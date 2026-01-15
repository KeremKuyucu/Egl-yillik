-- =====================================================
-- REMOVE CUSTOM OPTIONS
-- =====================================================
-- Özel seçenek özelliği kaldırıldı.
-- İlgili tablolar ve kolonlar temizleniyor.
-- =====================================================

-- 1. Önce survey_votes tablosundaki bağımlılığı kaldır
ALTER TABLE public.survey_votes
DROP CONSTRAINT IF EXISTS survey_votes_vote_target_check;

ALTER TABLE public.survey_votes
DROP COLUMN IF EXISTS custom_option_id;

-- voted_for_id artık zorunlu olmalı (eski verileri temizlemek gerekebilir)
-- Ancak şimdilik güvenli olması için nullable bırakıyoruz veya
-- custom option'a oy verilen satırları silebiliriz:
DELETE FROM public.survey_votes WHERE voted_for_id IS NULL;

ALTER TABLE public.survey_votes
ALTER COLUMN voted_for_id SET NOT NULL;

-- 2. survey_custom_options tablosunu sil
DROP TABLE IF EXISTS public.survey_custom_options CASCADE;

-- 3. Trigger ve fonksiyonları temizle
DROP FUNCTION IF EXISTS update_custom_option_vote_count() CASCADE;
DROP FUNCTION IF EXISTS update_custom_option_vote_count_insert() CASCADE;
DROP FUNCTION IF EXISTS update_custom_option_vote_count_delete() CASCADE;
DROP FUNCTION IF EXISTS get_class_custom_options(text, text) CASCADE;

-- =====================================================
-- TEMİZLİK TAMAMLANDI
-- =====================================================
