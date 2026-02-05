// lib/auth.ts
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { cache } from "react";
import { ROLES } from "@/lib/constants"; // tek kaynak

type SupabaseClientT = Awaited<ReturnType<typeof createClient>>;
type UserT = Awaited<ReturnType<SupabaseClientT["auth"]["getUser"]>>["data"]["user"];

type AuthContext = {
    user: UserT | null;
    level: number | null;
    profile: any | null;
};

export const getAuthContext = cache(async (): Promise<AuthContext> => {

    const supabase = await createClient()
    const { data: { user }, error: userErr } = await supabase.auth.getUser()
    if (userErr) {
        // loglamak iyi fikir
        // console.error("auth.getUser error", userErr);
    }
    if (!user) return { user: null, level: null, profile: null };

    // paralel çek (aynı request içinde tek sefer)
    const [lvlRes, profRes] = await Promise.all([
        supabase.from("user_levels").select("level").eq("id", user.id).maybeSingle(),
        supabase.from("profiles").select("id, first_name, last_name, school_number, class, user_year").eq("id", user.id).maybeSingle(),
    ]);

    // console.error("level error", lvlRes.error);
    // console.error("profile error", profRes.error);

    return {
        user,
        level: lvlRes.data?.level ?? 0,
        profile: profRes.data ?? null,
    };
});

export async function getCurrentUser() {
    return (await getAuthContext()).user;
}

export async function getCurrentLevel() {
    return (await getAuthContext()).level ?? 0;
}

export async function getCurrentProfile() {
    return (await getAuthContext()).profile;
}

// Redirect’li guard
export async function requireLevel(minLevel: number) {
    const { user, level } = await getAuthContext();
    if (!user || level === null) redirect("/login");
    if (level < minLevel) redirect("/home");
}

// Boolean guard (action için)
export type AuthCheckResult =
    | { ok: true }
    | { ok: false; error: "UNAUTHENTICATED" | "FORBIDDEN" };

export async function hasMinLevel(
    minLevel: number
): Promise<AuthCheckResult> {
    const { user, level } = await getAuthContext();

    if (!user || level === null) {
        return { ok: false, error: "UNAUTHENTICATED" };
    }

    if (level < minLevel) {
        return { ok: false, error: "FORBIDDEN" };
    }

    return { ok: true };
}

// Shorthands
export const requireAdmin = () => requireLevel(ROLES.ADMIN);
export const requireSuperAdmin = () => requireLevel(ROLES.SUPER_ADMIN);
export const requireOwner = () => requireLevel(ROLES.OWNER);

export const checkAdmin = () => hasMinLevel(ROLES.ADMIN);
export const checkSuperAdmin = () => hasMinLevel(ROLES.SUPER_ADMIN);
export const checkOwner = () => hasMinLevel(ROLES.OWNER);