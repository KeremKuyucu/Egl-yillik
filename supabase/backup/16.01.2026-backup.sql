-- =====================================================
-- EGL YILLIK - FULL BACKUP (16.01.2026) - SYNCED WITH dump.sql
-- =====================================================

-- 1. TABLOLAR
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID NOT NULL PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    school_number TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    class TEXT NOT NULL DEFAULT '12A',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_active TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_insert_self" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("id" = ( SELECT "auth"."uid"() AS "uid")));
CREATE POLICY "profiles_select_all" ON "public"."profiles" FOR SELECT TO "authenticated" USING (true);

CREATE TABLE IF NOT EXISTS public.survey_categories (
    id TEXT NOT NULL PRIMARY KEY,
    title TEXT NOT NULL,
    emoji TEXT NOT NULL,
    description TEXT NOT NULL,
    color TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_user_suggested BOOLEAN DEFAULT false,
    suggested_by UUID REFERENCES profiles(id)
);

ALTER TABLE public.survey_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "survey_categories_admin_delete" ON "public"."survey_categories" FOR DELETE TO "authenticated" USING (("public"."get_my_level"() >= 50));
CREATE POLICY "survey_categories_admin_insert" ON "public"."survey_categories" FOR INSERT TO "authenticated" WITH CHECK (("public"."get_my_level"() >= 50));
CREATE POLICY "survey_categories_admin_update" ON "public"."survey_categories" FOR UPDATE TO "authenticated" USING (("public"."get_my_level"() >= 50)) WITH CHECK (("public"."get_my_level"() >= 50));
CREATE POLICY "survey_categories_select_unified" ON "public"."survey_categories" FOR SELECT TO "authenticated" USING ((("is_active" = true) OR ("public"."get_my_level"() >= 50)));

CREATE TABLE IF NOT EXISTS public.survey_votes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    voter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    voted_for_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    category_id TEXT NOT NULL REFERENCES survey_categories(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(voter_id, category_id)
);

ALTER TABLE public.survey_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "survey_votes_insert_policy" ON "public"."survey_votes" FOR INSERT TO "authenticated" WITH CHECK ((("voter_id" = ( SELECT "auth"."uid"() AS "uid")) AND (( SELECT "s"."value"
   FROM "public"."site_settings" "s"
  WHERE ("s"."key" = 'voting_enabled'::"text")) = 'true'::"text")));
CREATE POLICY "survey_votes_select_policy" ON "public"."survey_votes" FOR SELECT TO "authenticated" USING ((("voter_id" = ( SELECT "auth"."uid"() AS "uid")) OR (( SELECT "public"."get_my_level"() AS "get_my_level") >= 50)));
CREATE POLICY "survey_votes_update_policy" ON "public"."survey_votes" FOR UPDATE TO "authenticated" USING (("voter_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ((("voter_id" = ( SELECT "auth"."uid"() AS "uid")) AND (( SELECT "s"."value"
   FROM "public"."site_settings" "s"
  WHERE ("s"."key" = 'voting_enabled'::"text")) = 'true'::"text")));

CREATE TABLE IF NOT EXISTS public.texts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE public.texts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "texts_insert_policy" ON "public"."texts" FOR INSERT TO "authenticated" WITH CHECK ((("author_id" = ( SELECT "auth"."uid"() AS "uid")) AND (( SELECT "s"."value"
   FROM "public"."site_settings" "s"
  WHERE ("s"."key" = 'messaging_enabled'::"text")) = 'true'::"text")));
CREATE POLICY "texts_select_policy" ON "public"."texts" FOR SELECT TO "authenticated" USING ((("is_active" = true) AND (("author_id" = ( SELECT "auth"."uid"() AS "uid")) OR (( SELECT "public"."get_my_level"() AS "get_my_level") >= 50))));
CREATE POLICY "texts_update_policy" ON "public"."texts" FOR UPDATE TO "authenticated" USING ((("is_active" = true) AND ("author_id" = ( SELECT "auth"."uid"() AS "uid")))) WITH CHECK ((("is_active" = true) AND ("author_id" = ( SELECT "auth"."uid"() AS "uid")) AND (( SELECT "s"."value"
   FROM "public"."site_settings" "s"
  WHERE ("s"."key" = 'messaging_enabled'::"text")) = 'true'::"text")));

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

ALTER TABLE public.user_category_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "suggestions_admin_select" ON "public"."user_category_suggestions" FOR SELECT TO "authenticated" USING ((( SELECT "public"."get_my_level"() AS "get_my_level") >= 50));
CREATE POLICY "suggestions_admin_update" ON "public"."user_category_suggestions" FOR UPDATE TO "authenticated" USING ((( SELECT "public"."get_my_level"() AS "get_my_level") >= 50)) WITH CHECK ((( SELECT "public"."get_my_level"() AS "get_my_level") >= 50));
CREATE POLICY "suggestions_insert" ON "public"."user_category_suggestions" FOR INSERT TO "authenticated" WITH CHECK (("suggested_by" = ( SELECT "auth"."uid"() AS "uid")));

CREATE TABLE IF NOT EXISTS public.user_levels (
    id UUID NOT NULL PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    level INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    set_by UUID REFERENCES profiles(id),
    set_at TIMESTAMPTZ DEFAULT NOW(),
    source TEXT
);

ALTER TABLE public.user_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_levels_select_self" ON "public"."user_levels" FOR SELECT TO "authenticated" USING (("public"."get_my_level"() >= 50));

-- 2. FONKSIYONLAR
CREATE OR REPLACE FUNCTION "public"."get_my_level"() RETURNS integer
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT level 
  FROM public.user_levels 
  WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- 3. TRIGGERS
CREATE OR REPLACE TRIGGER "texts_updated_at" BEFORE UPDATE ON "public"."texts" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();
