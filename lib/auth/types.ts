// lib/auth/types.ts
import { createClient } from "@/lib/supabase/server";

type SupabaseClientT = Awaited<ReturnType<typeof createClient>>;
export type UserT = Awaited<ReturnType<SupabaseClientT["auth"]["getUser"]>>["data"]["user"];

/** Veri amaçlı: UI'da gösterim için */
export type UserData = {
    user: UserT | null;
    profile: any | null;
};

/** Yetki kontrolü amaçlı: güvenlik kararları için */
export type AuthContext = {
    user: UserT | null;
    roles: string[];
    permissions: string[];
};

export type AuthCheckResult =
    | { ok: true }
    | { ok: false; error: "UNAUTHENTICATED" | "FORBIDDEN" };
