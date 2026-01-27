// components/role-guard.tsx
import { getAuthContext, checkPermission, type PermissionOptions } from "@/lib/auth"
import { ROLES } from "@/lib/constants"
import { ReactNode } from "react"

interface RoleGuardProps extends PermissionOptions {
    children: ReactNode
    /** Yetki yoksa gösterilecek içerik */
    fallback?: ReactNode
    /** Kullanıcı giriş yapmamışsa gösterilecek içerik */
    unauthenticatedFallback?: ReactNode
}

/**
 * Server-side rol/yetki kontrolü yapan bileşen.
 * JWT'den level bilgisi alır - DB sorgusu yapmaz.
 * 
 * @example
 * // Sadece ADMIN ve üstü görebilir
 * <RoleGuard minLevel={ROLES.ADMIN}>
 *   <AdminPanel />
 * </RoleGuard>
 * 
 * @example
 * // Sadece ADMIN'ler görebilir (SUPER_ADMIN ve üstü göremez)
 * <RoleGuard exactLevel={ROLES.ADMIN}>
 *   <AdminOnlyPanel />
 * </RoleGuard>
 * 
 * @example
 * // ADMIN'den düşük seviyedekiler görebilir
 * <RoleGuard maxLevel={ROLES.ADMIN - 1}>
 *   <UserOnlyContent />
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
    const { user, level } = await getAuthContext()

    // Kullanıcı giriş yapmamışsa
    if (!user) {
        if (inverse) return <>{children}</>
        return unauthenticatedFallback !== undefined
            ? <>{unauthenticatedFallback}</>
            : (fallback ? <>{fallback}</> : null)
    }

    // Ortak permission check fonksiyonunu kullan
    const hasPermission = checkPermission(level, { minLevel, maxLevel, exactLevel, inverse })

    if (!hasPermission) {
        return fallback ? <>{fallback}</> : null
    }

    return <>{children}</>
}

// ============================================
// PRE-BUILT GUARDS (Hazır Korumalar)
// ============================================

interface SimpleGuardProps {
    children: ReactNode
    fallback?: ReactNode
    inverse?: boolean
}

export async function AdminGuard({ children, fallback, inverse }: SimpleGuardProps) {
    return (
        <RoleGuard minLevel={ROLES.ADMIN} fallback={fallback} inverse={inverse}>
            {children}
        </RoleGuard>
    )
}

export async function SuperAdminGuard({ children, fallback, inverse }: SimpleGuardProps) {
    return (
        <RoleGuard minLevel={ROLES.SUPER_ADMIN} fallback={fallback} inverse={inverse}>
            {children}
        </RoleGuard>
    )
}

export async function OwnerGuard({ children, fallback, inverse }: SimpleGuardProps) {
    return (
        <RoleGuard minLevel={ROLES.OWNER} fallback={fallback} inverse={inverse}>
            {children}
        </RoleGuard>
    )
}

export async function StaffGuard({ children, fallback, inverse }: SimpleGuardProps) {
    return (
        <RoleGuard minLevel={ROLES.ADMIN} maxLevel={ROLES.SUPER_ADMIN} fallback={fallback} inverse={inverse}>
            {children}
        </RoleGuard>
    )
}
