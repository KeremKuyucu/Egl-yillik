// lib/auth.ts
// Server-side auth fonksiyonları
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ROLES } from "@/lib/constants"
import { cache } from "react"

// Ortak type ve utility'leri re-export et (checkPermission, getRoleInfo, types)
export * from "@/lib/auth-utils"
import type { JWTProfile } from "@/lib/auth-utils"

// ============================================
// CORE DATA FETCHING (CACHED)
// ============================================

/**
 * Request Memoization (React Cache) kullanarak
 * bir istek döngüsü içinde veriyi sadece 1 kez çeker.
 * 
 * Level bilgisi DB'den çekilir (JWT stale olabilir)
 */
export const getAuthUser = cache(async () => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user ?? null
})

export const getAuthLevel = cache(async () => {
    const user = await getAuthUser()
    if (!user) return 0

    const supabase = await createClient()
    const { data } = await supabase
        .from("user_levels")
        .select("level")
        .eq("id", user.id)
        .maybeSingle()

    return data?.level ?? 0
})

export const getAuthProfile = cache(async () => {
    const user = await getAuthUser()
    if (!user) return null

    const supabase = await createClient()
    const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle()

    return data
})

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Sadece user objesini döner (Cache mekanizmasından yararlanır).
 */
export async function getCurrentUser() {
    const user = await getAuthUser()
    return user
}
export async function getCurrentLevel() {
    const level = await getAuthLevel()
    return level
}
export async function getCurrentProfile() {
    const profile = await getAuthProfile()
    return profile
}


// ============================================
// PAGE/LAYOUT İÇİN (Redirect yapar)
// ============================================

export async function requireLevel(minLevel: number) {
    const user = await getAuthUser()
    const level = await getAuthLevel()
    const profile = await getAuthProfile()

    if (!user) {
        redirect("/login")
    }

    if (level < minLevel) {
        redirect("/home")
    }

    return { user, level, profile }
}

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
} | {
    success: false;
    error: string;
}

export async function checkLevel(minLevel: number): Promise<AuthResult> {
    const user = await getAuthUser()
    const level = await getAuthLevel()

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

