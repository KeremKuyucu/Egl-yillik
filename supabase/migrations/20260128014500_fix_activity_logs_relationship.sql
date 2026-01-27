DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'activity_logs_changed_by_fkey'
    ) THEN
        ALTER TABLE "public"."activity_logs"
        ADD CONSTRAINT "activity_logs_changed_by_fkey"
        FOREIGN KEY ("changed_by")
        REFERENCES "public"."profiles" ("id")
        ON DELETE SET NULL;
    END IF;
END $$;
