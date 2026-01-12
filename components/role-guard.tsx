// components/role-guard.tsx
import { createClient } from "@/lib/supabase/server"
import { ROLES, RoleLevel, getLevelInfo } from "@/lib/constants"
import { ReactNode } from "react"

interface RoleGuardProps {
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
    /** Kullanıcı giriş yapmamışsa gösterilecek içerik (fallback'ten farklı olabilir) */
    unauthenticatedFallback?: ReactNode
}

/**
 * Server-side rol/yetki kontrolü yapan bileşen.
 * 
 * @example
 * // Sadece ADMIN ve üstü görebilir
 * <RoleGuard minLevel={ROLES.ADMIN}>
 *   <AdminPanel />
 * </RoleGuard>
 * 
 * @example
 * // Sadece MODERATOR'lar görebilir (ADMIN ve üstü göremez)
 * <RoleGuard exactLevel={ROLES.MODERATOR}>
 *   <ModeratorPanel />
 * </RoleGuard>
 * 
 * @example
 * // ADMIN'den düşük seviyedekiler görebilir
 * <RoleGuard maxLevel={ROLES.ADMIN - 1}>
 *   <UserOnlyContent />
 * </RoleGuard>
 * 
 * @example
 * // MODERATOR ile ADMIN arasındakiler (dahil)
 * <RoleGuard minLevel={ROLES.MODERATOR} maxLevel={ROLES.ADMIN}>
 *   <StaffPanel />
 * </RoleGuard>
 * 
 * @example
 * // Ters mantık: ADMIN DEĞİLSE göster
 * <RoleGuard minLevel={ROLES.ADMIN} inverse>
 *   <NonAdminContent />
 * </RoleGuard>
 */
export default async function RoleGuard({
    children,
    minLevel = ROLES.ADMIN,
    maxLevel,
    exactLevel,
    inverse = false,
    fallback,
    unauthenticatedFallback
}: RoleGuardProps) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Kullanıcı giriş yapmamışsa
    if (!user) {
        if (inverse) return <>{children}</>
        return unauthenticatedFallback !== undefined
            ? <>{unauthenticatedFallback}</>
            : (fallback ? <>{fallback}</> : null)
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("level")
        .eq("id", user.id)
        .single()

    const userLevel = profile?.level ?? 0

    // Yetki kontrolü
    let hasPermission = false

    if (exactLevel !== undefined) {
        // Tam seviye eşleşmesi
        hasPermission = userLevel === exactLevel
    } else {
        // Min/Max aralık kontrolü
        const meetsMinLevel = userLevel >= minLevel
        const meetsMaxLevel = maxLevel === undefined || userLevel <= maxLevel
        hasPermission = meetsMinLevel && meetsMaxLevel
    }

    // Ters mantık
    if (inverse) {
        hasPermission = !hasPermission
    }

    if (!hasPermission) {
        return fallback ? <>{fallback}</> : null
    }

    return <>{children}</>
}

// ============================================
// YARDIMCI TİPLER VE FONKSİYONLAR
// ============================================

export interface UserRoleInfo {
    level: number
    label: string
    isAdmin: boolean
    isModerator: boolean
    isSuperAdmin: boolean
    isOwner: boolean
    hasMinLevel: (minLevel: number) => boolean
    isInRange: (min: number, max: number) => boolean
}

/**
 * Kullanıcı seviyesinden detaylı rol bilgisi üretir
 */
export function getUserRoleInfo(level: number): UserRoleInfo {
    const roleDetails = getLevelInfo(level)
    return {
        level,
        label: roleDetails.label,
        isAdmin: level >= ROLES.ADMIN,
        isModerator: level >= ROLES.MODERATOR,
        isSuperAdmin: level >= ROLES.SUPER_ADMIN,
        isOwner: level >= ROLES.OWNER,
        hasMinLevel: (minLevel: number) => level >= minLevel,
        isInRange: (min: number, max: number) => level >= min && level <= max
    }
}

// ============================================
// PRE-BUILT GUARDS (Hazır Korumalar)
// ============================================

interface SimpleGuardProps {
    children: ReactNode
    fallback?: ReactNode
    inverse?: boolean
}

/** Sadece Admin ve üstü */
export async function AdminGuard({ children, fallback, inverse }: SimpleGuardProps) {
    return (
        <RoleGuard minLevel={ROLES.ADMIN} fallback={fallback} inverse={inverse}>
            {children}
        </RoleGuard>
    )
}

/** Sadece Süper Admin ve üstü */
export async function SuperAdminGuard({ children, fallback, inverse }: SimpleGuardProps) {
    return (
        <RoleGuard minLevel={ROLES.SUPER_ADMIN} fallback={fallback} inverse={inverse}>
            {children}
        </RoleGuard>
    )
}

/** Sadece Moderatör ve üstü */
export async function ModeratorGuard({ children, fallback, inverse }: SimpleGuardProps) {
    return (
        <RoleGuard minLevel={ROLES.MODERATOR} fallback={fallback} inverse={inverse}>
            {children}
        </RoleGuard>
    )
}

/** Sadece Owner */
export async function OwnerGuard({ children, fallback, inverse }: SimpleGuardProps) {
    return (
        <RoleGuard minLevel={ROLES.OWNER} fallback={fallback} inverse={inverse}>
            {children}
        </RoleGuard>
    )
}

/** Sadece Staff (Moderatör ile Süper Admin arası, Owner hariç) */
export async function StaffGuard({ children, fallback, inverse }: SimpleGuardProps) {
    return (
        <RoleGuard
            minLevel={ROLES.MODERATOR}
            maxLevel={ROLES.SUPER_ADMIN}
            fallback={fallback}
            inverse={inverse}
        >
            {children}
        </RoleGuard>
    )
}