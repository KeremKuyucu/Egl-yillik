// lib/auth-utils.ts
// Bu dosya hem server hem client component'lerde kullanılabilir
// Server-only import yok!

import { ROLES, getLevelInfo } from "@/lib/constants"

// ============================================
// TYPES
// ============================================

// Profile tipi - JWT user_metadata'dan gelen veriler
export type JWTProfile = {
    sub: string
    email: string
    first_name: string
    last_name: string
    display_name: string
    class: string
    school_number: string
    level: number
    email_verified: boolean
    phone_verified: boolean
    user_year: number
}

// Ortak permission check seçenekleri
export interface PermissionOptions {
    minLevel?: number
    maxLevel?: number
    exactLevel?: number
    inverse?: boolean
}

// Rol bilgisi
export interface RoleInfo {
    level: number
    label: string
    isAdmin: boolean
    isSuperAdmin: boolean
    isOwner: boolean
    hasMinLevel: (minLevel: number) => boolean
    isInRange: (min: number, max: number) => boolean
    isExactLevel: (level: number) => boolean
}

// ============================================
// SHARED UTILITIES
// ============================================

/**
 * Verilen seviye ve seçeneklere göre yetki kontrolü yapar.
 * Server/Client guard'ları tarafından kullanılır.
 */
export function checkPermission(userLevel: number, options: PermissionOptions): boolean {
    const { minLevel = 0, maxLevel, exactLevel, inverse = false } = options

    let hasPermission = false

    if (exactLevel !== undefined) {
        hasPermission = userLevel === exactLevel
    } else {
        const meetsMin = userLevel >= minLevel
        const meetsMax = maxLevel === undefined || userLevel <= maxLevel
        hasPermission = meetsMin && meetsMax
    }

    return inverse ? !hasPermission : hasPermission
}

/**
 * Kullanıcı seviyesinden detaylı rol bilgisi üretir.
 * Server/Client guard'ları tarafından kullanılır.
 */
export function getRoleInfo(level: number): RoleInfo {
    const roleDetails = getLevelInfo(level)
    return {
        level,
        label: roleDetails.label,
        isAdmin: level >= ROLES.ADMIN,
        isSuperAdmin: level >= ROLES.SUPER_ADMIN,
        isOwner: level >= ROLES.OWNER,
        hasMinLevel: (minLevel: number) => level >= minLevel,
        isInRange: (min: number, max: number) => level >= min && level <= max,
        isExactLevel: (targetLevel: number) => level === targetLevel
    }
}
