// lib/auth.ts
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ROLES } from "@/lib/constants"

// Parametre olarak minimum gerekli seviyeyi alıyor
export async function requireLevel(minLevel: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect("/login")

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

    // Kullanıcının seviyesi, istenen seviyeden düşükse at
    if (!profile || profile.level < minLevel) {
        redirect("/dashboard")
    }

    return { user, profile };
}

export const requireAdmin = () => requireLevel(ROLES.ADMIN);
export const requireMod = () => requireLevel(ROLES.MODERATOR);
export const requireUser = () => requireLevel(ROLES.USER);
export const requireKamil = () => requireLevel(ROLES.KAMIL);
export const requireSuperAdmin = () => requireLevel(ROLES.SUPER_ADMIN);
export const requireOwner = () => requireLevel(ROLES.OWNER);

