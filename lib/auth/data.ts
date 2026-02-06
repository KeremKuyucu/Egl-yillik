// lib/auth/data.ts (server-only)
import { createClient } from "@/lib/supabase/server";
import { cache } from "react";
import type { UserData } from "@/types/auth";

/**
 * Kullanıcı verisini getirir: user, profile, level
 * UI'da gösterim amaçlı kullanılır, permission RPC'leri çağrılmaz.
 */
export const getUserData = cache(async (): Promise<UserData> => {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { user: null, profile: null };

    const [profRes] = await Promise.all([
        supabase
            .from("profiles")
            .select("id, first_name, last_name, school_number, class, user_year")
            .eq("id", user.id)
            .maybeSingle(),
    ]);

    return {
        user,
        profile: profRes.data ?? null,
    };
});

// -------------------- Legacy Getters --------------------

export async function getCurrentUser() {
    return (await getUserData()).user;
}

export async function getCurrentProfile() {
    return (await getUserData()).profile;
}