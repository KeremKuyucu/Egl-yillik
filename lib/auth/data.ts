// lib/auth/data.ts (server-only)
import { createClient } from "@/lib/supabase/server";
import { cache } from "react";

/**
 * Supabase auth user — request cycle başına tek çağrı.
 * Hem getUserWithProfile hem getAuthContext (permissions.ts) bu fonksiyonu kullanır.
 */
export const getCachedUser = cache(async () => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
});

/**
 * Profil verisini cache'li getirir — request cycle başına tek sorgu.
 * UI için kullanılır, permission RPC'leri çağrılmaz.
 */
export const getCachedProfile = cache(async () => {
    const user = await getCachedUser();
    if (!user) return null;

    const supabase = await createClient();
    const { data } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, school_number, class, user_year")
        .eq("id", user.id)
        .is("deleted_at", null)
        .maybeSingle()

    return data ?? null;
});

// -------------------- Legacy Getters --------------------

export async function getCurrentUser() {
    return await getCachedUser();
}

export async function getCurrentProfile() {
    return await getCachedProfile();
}