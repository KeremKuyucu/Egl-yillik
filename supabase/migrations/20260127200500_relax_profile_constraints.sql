-- profiles tablosundaki kısıtlamaları kaldır
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_class_check;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_school_number_check;

-- Yeni, daha esnek bir school_number kontrolü ekle (regex ile ama uzunluk esnek olabilir, şimdilik sadece sayısal olması kalsın)
ALTER TABLE public.profiles ADD CONSTRAINT profiles_school_number_format_check CHECK (school_number ~ '^[0-9]+$');
