// lib/auth-client.ts
// Client-side auth fonksiyonları
"use client"

import { createClient } from "@/lib/supabase/client"
import { ROLES } from "@/lib/constants"
import { useRouter } from "next/navigation"
import { useState, useEffect, useCallback, useMemo } from "react"

// Ortak type ve utility'leri re-export et
export * from "@/lib/auth-utils"
import type { RoleInfo } from "@/lib/auth-utils"
import { getRoleInfo } from "@/lib/auth-utils"

// ============================================
// TYPES
// ============================================

export interface AuthUser {
    id: string
    email?: string
}

export interface AuthProfile {
    id: string
    first_name: string
    last_name: string
    class: string
    school_number: string
    user_year: number
    [key: string]: any
}

export interface AuthState {
    user: AuthUser | null
    level: number
    profile: AuthProfile | null
    isLoading: boolean
    isAuthenticated: boolean
    roleInfo: RoleInfo
}

export interface UseAuthOptions {
    redirectTo?: string
    redirectIfFound?: boolean
}

// ============================================
// CORE DATA FETCHING
// ============================================

/**
 * Client-side'da mevcut kullanıcıyı getirir
 */
export async function getClientUser(): Promise<AuthUser | null> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user ? { id: user.id, email: user.email } : null
}

/**
 * Client-side'da kullanıcı levelini getirir
 */
export async function getClientLevel(): Promise<number> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return 0

    const { data } = await supabase
        .from("user_levels")
        .select("level")
        .eq("id", user.id)
        .maybeSingle()

    return data?.level ?? 0
}

/**
 * Client-side'da kullanıcı profilini getirir
 */
export async function getClientProfile(): Promise<AuthProfile | null> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle()

    return data
}

/**
 * Client-side'da tüm auth bilgilerini getirir
 */
export async function getClientAuthContext(): Promise<{
    user: AuthUser | null
    level: number
    profile: AuthProfile | null
}> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { user: null, level: 0, profile: null }
    }

    const [levelResult, profileResult] = await Promise.all([
        supabase
            .from("user_levels")
            .select("level")
            .eq("id", user.id)
            .maybeSingle(),
        supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle()
    ])

    return {
        user: { id: user.id, email: user.email },
        level: levelResult.data?.level ?? 0,
        profile: profileResult.data
    }
}

// ============================================
// REACT HOOKS
// ============================================

/**
 * Client-side'da auth durumunu yöneten hook
 */
export function useAuth(options: UseAuthOptions = {}): AuthState & {
    refresh: () => Promise<void>
    signOut: () => Promise<void>
} {
    const router = useRouter()
    const { redirectTo, redirectIfFound = false } = options

    const [state, setState] = useState<Omit<AuthState, 'roleInfo'>>({
        user: null,
        level: 0,
        profile: null,
        isLoading: true,
        isAuthenticated: false
    })

    const fetchAuth = useCallback(async () => {
        setState(prev => ({ ...prev, isLoading: true }))

        try {
            const { user, level, profile } = await getClientAuthContext()

            setState({
                user,
                level,
                profile,
                isLoading: false,
                isAuthenticated: !!user
            })

            // Redirect logic
            if (redirectTo) {
                if (!user && !redirectIfFound) {
                    router.push(redirectTo)
                } else if (user && redirectIfFound) {
                    router.push(redirectTo)
                }
            }
        } catch (error) {
            console.error("Auth fetch error:", error)
            setState({
                user: null,
                level: 0,
                profile: null,
                isLoading: false,
                isAuthenticated: false
            })
        }
    }, [redirectTo, redirectIfFound, router])

    const signOut = useCallback(async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        setState({
            user: null,
            level: 0,
            profile: null,
            isLoading: false,
            isAuthenticated: false
        })
        router.push("/login")
    }, [router])

    useEffect(() => {
        fetchAuth()

        // Auth state değişikliklerini dinle
        const supabase = createClient()
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'SIGNED_OUT') {
                    setState({
                        user: null,
                        level: 0,
                        profile: null,
                        isLoading: false,
                        isAuthenticated: false
                    })
                } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                    fetchAuth()
                }
            }
        )

        return () => {
            subscription.unsubscribe()
        }
    }, [fetchAuth])

    const roleInfo = useMemo(() => getRoleInfo(state.level), [state.level])

    return {
        ...state,
        roleInfo,
        refresh: fetchAuth,
        signOut
    }
}

/**
 * Belirli bir level gerektiren hook
 * Yetki yoksa redirectTo'ya yönlendirir
 */
export function useRequireLevel(minLevel: number, redirectTo: string = "/home") {
    const auth = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!auth.isLoading) {
            if (!auth.isAuthenticated) {
                router.push("/login")
            } else if (auth.level < minLevel) {
                router.push(redirectTo)
            }
        }
    }, [auth.isLoading, auth.isAuthenticated, auth.level, minLevel, redirectTo, router])

    return {
        ...auth,
        isAuthorized: auth.isAuthenticated && auth.level >= minLevel
    }
}

/**
 * Admin yetkisi gerektiren hook
 */
export function useRequireAdmin(redirectTo: string = "/home") {
    return useRequireLevel(ROLES.ADMIN, redirectTo)
}

/**
 * Super Admin yetkisi gerektiren hook
 */
export function useRequireSuperAdmin(redirectTo: string = "/home") {
    return useRequireLevel(ROLES.SUPER_ADMIN, redirectTo)
}

/**
 * Owner yetkisi gerektiren hook
 */
export function useRequireOwner(redirectTo: string = "/home") {
    return useRequireLevel(ROLES.OWNER, redirectTo)
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Client-side'da yetki kontrolü yapar
 */
export async function checkClientLevel(minLevel: number): Promise<{
    success: boolean
    user: AuthUser | null
    level: number
    error?: string
}> {
    const { user, level } = await getClientAuthContext()

    if (!user) {
        return { success: false, user: null, level: 0, error: "Oturum açmanız gerekiyor" }
    }

    if (level < minLevel) {
        return { success: false, user, level, error: "Bu işlem için yetkiniz yok" }
    }

    return { success: true, user, level }
}

export const checkClientAdmin = () => checkClientLevel(ROLES.ADMIN)
export const checkClientSuperAdmin = () => checkClientLevel(ROLES.SUPER_ADMIN)
export const checkClientOwner = () => checkClientLevel(ROLES.OWNER)
