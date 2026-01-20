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
export const getAuthContext = cache(async () => {
    const supabase = await createClient()

    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
        return { user: null, level: 0, profile: null }
    }

    const user = session.user
    const metadata = user.user_metadata as JWTProfile | undefined

    return {
        user,
        level: metadata.level,
        profile: metadata ? {
            id: user.id,
            email: metadata.email,
            first_name: metadata.first_name,
            last_name: metadata.last_name,
            display_name: metadata.display_name,
            class: metadata.class,
            school_number: metadata.school_number,
            level: metadata.level,
        } : null
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
    const { user, level, profile } = await getAuthContext()

    if (!user) {
        redirect("/login")
    }

    if (level < minLevel) {
        redirect("/dashboard")
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

