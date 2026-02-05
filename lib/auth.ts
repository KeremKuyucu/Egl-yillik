// lib/auth.ts
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { cache } from "react";
import { ROLES } from "@/lib/constants";

type SupabaseClientT = Awaited<ReturnType<typeof createClient>>;
type UserT = Awaited<ReturnType<SupabaseClientT["auth"]["getUser"]>>["data"]["user"];

type AuthContext = {
    user: UserT | null;
    level: number | null;
    profile: any | null;
};

export type AuthCheckResult =
    | { ok: true }
    | { ok: false; error: "UNAUTHENTICATED" | "FORBIDDEN" };

export const getAuthContext = cache(async (): Promise<AuthContext> => {
    const supabase = await createClient();

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr) {
        // console.error("auth.getUser error", userErr);
    }
    if (!user) return { user: null, level: null, profile: null };

    const [lvlRes, profRes] = await Promise.all([
        supabase.from("user_levels").select("level").eq("id", user.id).maybeSingle(),
        supabase.from("profiles")
            .select("id, first_name, last_name, school_number, class, user_year")
            .eq("id", user.id)
            .maybeSingle(),
    ]);

    return {
        user,
        level: lvlRes.data?.level ?? null,
        profile: profRes.data ?? null,
    };
});

export async function hasMinLevel(minLevel: number): Promise<AuthCheckResult> {
    const { user, level } = await getAuthContext();

    if (!user) return { ok: false, error: "UNAUTHENTICATED" };
    if (level === null) return { ok: false, error: "FORBIDDEN" };
    if (level < minLevel) return { ok: false, error: "FORBIDDEN" };

    return { ok: true };
}

// Redirect guard (layout/page için)
export async function requireLevel(minLevel: number) {
    const auth = await hasMinLevel(minLevel);
    if (!auth.ok) {
        if (auth.error === "UNAUTHENTICATED") redirect("/login");
        redirect("/home"); // FORBIDDEN
    }
}

//-------------------------------------------------------

export async function getCurrentUser() {
    return (await getAuthContext()).user;
}

// Burada ?? 0 KULLANMA. Null'ı saklama.
export async function getCurrentLevel() {
    return (await getAuthContext()).level;
}

export async function getCurrentProfile() {
    return (await getAuthContext()).profile;
}

export const requireAdmin = () => requireLevel(ROLES.ADMIN);
export const requireSuperAdmin = () => requireLevel(ROLES.SUPER_ADMIN);
export const requireOwner = () => requireLevel(ROLES.OWNER);

export const checkAdmin = () => hasMinLevel(ROLES.ADMIN);
export const checkSuperAdmin = () => hasMinLevel(ROLES.SUPER_ADMIN);
export const checkOwner = () => hasMinLevel(ROLES.OWNER);
