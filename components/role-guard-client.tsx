// components/role-guard-client.tsx
"use client"

import { createClient } from "@/lib/supabase/client"
import { checkPermission, getRoleInfo, type PermissionOptions, type RoleInfo } from "@/lib/auth-utils"
import { ROLES } from "@/lib/constants"
import { ReactNode, useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

interface ClientRoleGuardProps extends PermissionOptions {
    children: ReactNode
    /** Yetki yoksa gösterilecek içerik */
    fallback?: ReactNode
    /** Yüklenirken gösterilecek içerik */
    loadingFallback?: ReactNode
    /** Yükleme animasyonu gösterilsin mi */
    showLoader?: boolean
}

/**
 * Client-side rol/yetki kontrolü yapan bileşen.
 * JWT user_metadata'dan level bilgisi alır - DB sorgusu yapmaz.
 * 
 * @example
 * <ClientRoleGuard minLevel={ROLES.ADMIN} showLoader>
 *   <AdminPanel />
 * </ClientRoleGuard>
 * 
 * @example
 * // Ters mantık ile kullanım
 * <ClientRoleGuard minLevel={ROLES.ADMIN} inverse fallback={<AdminBadge />}>
 *   <UserContent />
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
        const check = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                setHasPermission(inverse)
                setIsLoading(false)
                return
            }

            const userLevel = user.user_metadata?.level ?? 0
            // Ortak permission check fonksiyonunu kullan
            setHasPermission(checkPermission(userLevel, { minLevel, maxLevel, exactLevel, inverse }))
            setIsLoading(false)
        }

        check()
    }, [minLevel, maxLevel, exactLevel, inverse])

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

export interface UseRoleGuardResult extends RoleInfo {
    isLoading: boolean
    isAuthenticated: boolean
}

/**
 * Client-side rol kontrolü için React hook.
 * JWT user_metadata'dan level bilgisi alır - DB sorgusu yapmaz.
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
        const fetchLevel = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                setState({ level: 0, isLoading: false, isAuthenticated: false })
                return
            }

            setState({
                level: user.user_metadata?.level ?? 0,
                isLoading: false,
                isAuthenticated: true
            })
        }

        fetchLevel()
    }, [])

    const { level, isLoading, isAuthenticated } = state
    // Ortak getRoleInfo fonksiyonunu kullan
    const roleInfo = getRoleInfo(level)

    return {
        ...roleInfo,
        isLoading,
        isAuthenticated
    }
}
