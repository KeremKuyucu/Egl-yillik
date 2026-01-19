// components/role-guard-client.tsx
"use client"

import { createClient } from "@/lib/supabase/client"
import { ROLES, getLevelInfo } from "@/lib/constants"
import { ReactNode, useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

interface ClientRoleGuardProps {
    children: ReactNode
    /** Minimum seviye (dahil) - varsayılan ADMIN */
    minLevel?: number
    /** Maksimum seviye (dahil) - belirtilmezse üst limit yok */
    maxLevel?: number
    /** Tam olarak bu seviyede olmalı */
    exactLevel?: number
    /** Ters mantık: koşul SAĞLANMAZSA göster */
    inverse?: boolean
    /** Yetki yoksa gösterilecek içerik */
    fallback?: ReactNode
    /** Yüklenirken gösterilecek içerik */
    loadingFallback?: ReactNode
    /** Yükleme animasyonu gösterilsin mi */
    showLoader?: boolean
}

/**
 * Client-side rol/yetki kontrolü yapan bileşen.
 * Real-time güncellemeler ve dinamik kontroller için kullanışlıdır.
 * 
 * @example
 * <ClientRoleGuard minLevel={ROLES.ADMIN} showLoader>
 *   <AdminPanel />
 * </ClientRoleGuard>
 */
export default function ClientRoleGuard({
    children,
    minLevel = ROLES.ADMIN,
    maxLevel,
    exactLevel,
    inverse = false,
    fallback,
    loadingFallback,
    showLoader = false
}: ClientRoleGuardProps) {
    const [hasPermission, setHasPermission] = useState<boolean | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const checkPermission = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                setHasPermission(inverse)
                setIsLoading(false)
                return
            }

            const { data: profile } = await supabase
                .from("user_levels")
                .select("level")
                .eq("id", user.id)
                .single()

            const userLevel = profile?.level ?? 0

            let permitted = false

            if (exactLevel !== undefined) {
                permitted = userLevel === exactLevel
            } else {
                const meetsMinLevel = userLevel >= minLevel
                const meetsMaxLevel = maxLevel === undefined || userLevel <= maxLevel
                permitted = meetsMinLevel && meetsMaxLevel
            }

            if (inverse) {
                permitted = !permitted
            }

            setHasPermission(permitted)
            setIsLoading(false)
        }

        checkPermission()
    }, [minLevel, maxLevel, exactLevel, inverse])

    // Yüklenme durumu
    if (isLoading) {
        if (loadingFallback) return <>{loadingFallback}</>
        if (showLoader) {
            return (
                <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
            )
        }
        return null
    }

    if (!hasPermission) {
        return fallback ? <>{fallback}</> : null
    }

    return <>{children}</>
}

// ============================================
// useRoleGuard HOOK
// ============================================

export interface UseRoleGuardResult {
    /** Kullanıcı seviyesi */
    level: number
    /** Rol etiketi (Admin, Moderatör, vb.) */
    label: string
    /** Yükleniyor mu */
    isLoading: boolean
    /** Giriş yapmış mı */
    isAuthenticated: boolean
    /** Admin mi */
    isAdmin: boolean
    /** Süper Admin mi */
    isSuperAdmin: boolean
    /** Owner mı */
    isOwner: boolean
    /** Belirtilen minimum seviyeye sahip mi */
    hasMinLevel: (minLevel: number) => boolean
    /** Belirtilen aralıkta mı */
    isInRange: (min: number, max: number) => boolean
    /** Tam olarak bu seviyede mi */
    isExactLevel: (level: number) => boolean
}

/**
 * Client-side rol kontrolü için React hook.
 * 
 * @example
 * const { isAdmin, isLoading, hasMinLevel } = useRoleGuard()
 * 
 * if (isLoading) return <Spinner />
 * if (!isAdmin) return <AccessDenied />
 * 
 * // veya
 * if (hasMinLevel(ROLES.MODERATOR)) {
 *   // moderatör ve üstü için içerik
 * }
 */
export function useRoleGuard(): UseRoleGuardResult {
    const [state, setState] = useState<{
        level: number
        isLoading: boolean
        isAuthenticated: boolean
    }>({
        level: 0,
        isLoading: true,
        isAuthenticated: false
    })

    useEffect(() => {
        const fetchUserLevel = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                setState({ level: 0, isLoading: false, isAuthenticated: false })
                return
            }

            const { data: profile } = await supabase
                .from("user_levels")
                .select("level")
                .eq("id", user.id)
                .single()

            setState({
                level: profile?.level ?? 0,
                isLoading: false,
                isAuthenticated: true
            })
        }

        fetchUserLevel()
    }, [])

    const { level, isLoading, isAuthenticated } = state
    const roleDetails = getLevelInfo(level)

    return {
        level,
        label: roleDetails.label,
        isLoading,
        isAuthenticated,
        isAdmin: level >= ROLES.ADMIN,
        isSuperAdmin: level >= ROLES.SUPER_ADMIN,
        isOwner: level >= ROLES.OWNER,
        hasMinLevel: (minLevel: number) => level >= minLevel,
        isInRange: (min: number, max: number) => level >= min && level <= max,
        isExactLevel: (targetLevel: number) => level === targetLevel
    }
}
