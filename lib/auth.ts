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
  if (!user) redirect("/login")

  const level = await getAuthLevel()
  if (level < minLevel) redirect("/home")
}

export const requireAdmin = () => requireLevel(ROLES.ADMIN)
export const requireUser = () => requireLevel(ROLES.USER)
export const requireSuperAdmin = () => requireLevel(ROLES.SUPER_ADMIN)
export const requireOwner = () => requireLevel(ROLES.OWNER)

export async function hasMinRole(minRole: number): Promise<boolean> {
  const user = await getAuthUser()
  if (!user) return false

  const level = await getAuthLevel()
  return level >= minRole
}

// İstersen kısa wrapper’lar:
export const checkUser = () => hasMinRole(ROLES.USER)
export const checkAdmin = () => hasMinRole(ROLES.ADMIN)
export const checkSuperAdmin = () => hasMinRole(ROLES.SUPER_ADMIN)
export const checkOwner = () => hasMinRole(ROLES.OWNER)