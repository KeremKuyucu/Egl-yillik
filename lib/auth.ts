// lib/auth.ts
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ROLES } from "@/lib/constants"
import { cache } from "react"

// ============================================
// CORE DATA FETCHING (CACHED)
// ============================================

/**
 * Request Memoization (React Cache) kullanarak
 * bir istek döngüsü içinde veriyi sadece 1 kez çeker.
 * * getUser ve DB sorgularını paralel (Promise.all) atarak
 * yanıt süresini (latency) düşürür.
 */
export const getAuthContext = cache(async () => {
    const supabase = await createClient()
    
    // 1. Adım: Kullanıcıyı çek
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { user: null, level: 0, profile: null }
    }

    // 2. Adım: Level ve Profile verisini PARALEL çek (Waterfall'u engelle)
    // İki ayrı await yerine Promise.all kullanarak aynı anda başlatıyoruz.
    const [levelResult, profileResult] = await Promise.all([
        supabase
            .from("user_levels")
            .select("level")
            .eq("id", user.id)
            .single(),
        supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single()
    ])

    return {
        user,
        level: levelResult.data?.level ?? 0,
        profile: profileResult.data
    }
})

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Sadece user objesini döner (Cache mekanizmasından yararlanır).
 */
export async function getCurrentUser() {
    const { user } = await getAuthContext()
    return user
}

// ============================================
// PAGE/LAYOUT İÇİN (Redirect yapar)
// ============================================

export async function requireLevel(minLevel: number) {
    // Merkezi cache fonksiyonunu kullanıyoruz
    const { user, level, profile } = await getAuthContext()

    if (!user) {
        redirect("/login")
    }

    if (level < minLevel) {
        // Yetkisiz giriş denemesi loglanabilir veya dashboard'a atılır
        redirect("/dashboard")
    }

    return { user, level, profile }
}

// Hazır fonksiyonlar (Higher Order Function kullanımına gerek yok, direkt çağırıyoruz)
export const requireAdmin = () => requireLevel(ROLES.ADMIN)
export const requireUser = () => requireLevel(ROLES.USER)
export const requireSuperAdmin = () => requireLevel(ROLES.SUPER_ADMIN)
export const requireOwner = () => requireLevel(ROLES.OWNER)

// ============================================
// SERVER ACTION İÇİN (Return Object)
// ============================================

export type AuthResult = {
    success: true;
    user: { id: string; email?: string };
    level: number;
    // Profile opsiyonel olarak eklenebilir, ihtiyaç varsa
} | {
    success: false;
    error: string;
}

/**
 * Server Action'larda redirect yerine hata objesi döner.
 * Yine aynı cached veriyi kullanır, veritabanını yormaz.
 */
export async function checkLevel(minLevel: number): Promise<AuthResult> {
    const { user, level } = await getAuthContext()

    if (!user) {
        return { success: false, error: "Oturum açmanız gerekiyor" }
    }

    if (level < minLevel) {
        return { success: false, error: "Bu işlem için yetkiniz yok" }
    }

    return { success: true, user, level }
}

export const checkAdmin = () => checkLevel(ROLES.ADMIN)
export const checkSuperAdmin = () => checkLevel(ROLES.SUPER_ADMIN)
export const checkOwner = () => checkLevel(ROLES.OWNER)
