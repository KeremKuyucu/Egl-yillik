// lib/auth.ts
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ROLES } from "@/lib/constants"

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Mevcut kullanıcıyı güvenli bir şekilde getirir.
 * Login olmamışsa null döner (redirect yapmaz).
 */
export async function getCurrentUser() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user
}

// ============================================
// PAGE/LAYOUT İÇİN (Redirect yapar)
// ============================================

// Parametre olarak minimum gerekli seviyeyi alıyor
export async function requireLevel(minLevel: number) {
    const supabase = await createClient()
    const user = await getCurrentUser()

    if (!user) redirect("/login")

    // Level bilgisini user_levels tablosundan al
    const { data: userLevel } = await supabase
        .from("user_levels")
        .select("level")
        .eq("id", user.id)
        .single()

    const level = userLevel?.level ?? 0

    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    // Kullanıcının seviyesi, istenen seviyeden düşükse at
    if (level < minLevel) {
        redirect("/dashboard")
    }

    return { user, level, profile };
}

export const requireAdmin = () => requireLevel(ROLES.ADMIN);
export const requireUser = () => requireLevel(ROLES.USER);
export const requireSuperAdmin = () => requireLevel(ROLES.SUPER_ADMIN);
export const requireOwner = () => requireLevel(ROLES.OWNER);

// ============================================
// SERVER ACTION İÇİN (Hata döndürür, redirect yapmaz)
// ============================================

export type AuthResult = {
    success: true;
    user: { id: string; email?: string };
    level: number;
} | {
    success: false;
    error: string;
}

/**
 * Server action'lar için yetki kontrolü yapar.
 * Redirect yapmaz, hata döndürür.
 * 
 * @example
 * const auth = await checkLevel(ROLES.ADMIN)
 * if (!auth.success) return { error: auth.error }
 * // auth.user ve auth.level kullanılabilir
 */
export async function checkLevel(minLevel: number): Promise<AuthResult> {
    const supabase = await createClient()
    const user = await getCurrentUser()

    if (!user) {
        return { success: false, error: "Oturum açmanız gerekiyor" }
    }

    const { data: userLevel } = await supabase
        .from("user_levels")
        .select("level")
        .eq("id", user.id)
        .single()

    const level = userLevel?.level ?? 0

    if (level < minLevel) {
        return { success: false, error: "Bu işlem için yetkiniz yok" }
    }

    return { success: true, user, level }
}

// Hazır kontrol fonksiyonları
export const checkAdmin = () => checkLevel(ROLES.ADMIN);
export const checkSuperAdmin = () => checkLevel(ROLES.SUPER_ADMIN);
export const checkOwner = () => checkLevel(ROLES.OWNER);
