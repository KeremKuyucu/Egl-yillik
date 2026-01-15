-- =====================================================
-- FIX FOREIGN KEY CONSTRAINT
-- =====================================================
-- Onaylanan kategori silindiğinde, öneri kaydındaki referansın
-- hata vermemesi için constraint güncelleniyor.
-- =====================================================

-- Önce mevcut constraint'i kaldır
ALTER TABLE public.user_category_suggestions
DROP CONSTRAINT IF EXISTS user_category_suggestions_approved_category_id_fkey;

-- Yeni constraint ekle (ON DELETE SET NULL ile)
ALTER TABLE public.user_category_suggestions
ADD CONSTRAINT user_category_suggestions_approved_category_id_fkey
FOREIGN KEY (approved_category_id)
REFERENCES public.survey_categories(id)
ON DELETE SET NULL;
