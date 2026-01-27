-- Error loglamayı kaldır
DROP TABLE IF EXISTS "public"."error_logs";

-- Varsa ilgili indexleri kaldır (Tablo silinince otomatik silinir ama temizlik iyidir)
DROP INDEX IF EXISTS "idx_error_logs_created_at";
DROP INDEX IF EXISTS "idx_error_logs_is_resolved";
DROP INDEX IF EXISTS "idx_error_logs_user_id";
