import { createClient } from "@/lib/supabase/server"

// ---- Rol Tipi Tanımları ----
export interface Role {
    key: string
    label: string
    level: number
    description: string
    badge_color: string
}

export interface RoleDetails {
    label: string
    description: string
    badgeColor: string
}

// ---- Server-side Cache ----
let cachedRoles: Role[] | null = null
let cachedRolesMap: Map<string, Role> | null = null
let lastFetchTime = 0
const CACHE_TTL = 60 * 1000 // 1 dakika

// ---- Veri Çekme Fonksiyonları (Server-Side) ----

/**
 * Rolleri veritabanından çeker (Server Components için)
 * Cache'li, 1 dakika geçerli
 */
export async function getRoles(): Promise<Role[]> {
    const now = Date.now()

    // Cache geçerliyse kullan
    if (cachedRoles && (now - lastFetchTime) < CACHE_TTL) {
        return cachedRoles
    }

    try {
        const supabase = await createClient()
        const { data, error } = await supabase.rpc('admin_list_roles')

        if (error) {
            console.error("Roller çekilemedi:", error)
            return cachedRoles || []
        }

        // RPC'den gelen veriyi Role interface'ine map'le
        const newRoles: Role[] = (data || []).map((r: any) => ({
            key: r.role_key,
            label: r.label,
            level: r.level,
            description: r.description,
            badge_color: r.badge_color
        }))

        cachedRoles = newRoles
        cachedRolesMap = new Map(newRoles.map(r => [r.key, r]))
        lastFetchTime = now

        return newRoles
    } catch (err) {
        console.error("Roller çekilirken hata:", err)
        return cachedRoles || []
    }
}

/**
 * Tek bir rolü key ile getirir
 */
export async function getRoleByKey(key: string): Promise<Role | null> {
    const roles = await getRoles()
    return roles.find(r => r.key === key) || null
}

/**
 * Rol seviyesini key ile getirir
 */
export async function getRoleLevelByKey(key: string): Promise<number | null> {
    const role = await getRoleByKey(key)
    return role?.level ?? null
}

/**
 * Kullanıcının en yüksek rolünü belirler
 */
export async function getHighestRole(userRoles: string[] | null | undefined): Promise<Role | null> {
    if (!userRoles?.length) return null

    const roles = await getRoles()
    const rolesMap = new Map(roles.map(r => [r.key, r]))

    let highestRole: Role | null = null
    let highestLevel = -1

    for (const roleKey of userRoles) {
        const role = rolesMap.get(roleKey)
        if (role && role.level > highestLevel) {
            highestLevel = role.level
            highestRole = role
        }
    }

    return highestRole
}

/**
 * Kullanıcının en yüksek rol key'ini döndürür
 */
export async function getHighestRoleKey(userRoles: string[] | null | undefined): Promise<string | null> {
    const role = await getHighestRole(userRoles)
    return role?.key ?? null
}

/**
 * Rol detaylarını döndürür (Role nesnesinden)
 */
export function getRoleDetails(role: Role): RoleDetails {
    return {
        label: role.label,
        description: role.description,
        badgeColor: role.badge_color
    }
}

/**
 * Kullanıcı rollerine göre en yüksek rolün detaylarını döndürür
 */
export async function getRoleInfoFromRoles(userRoles: string[] | null | undefined): Promise<RoleDetails | null> {
    const role = await getHighestRole(userRoles)
    if (!role) return null
    return getRoleDetails(role)
}

/**
 * Admin panelinde atanabilir rolleri döndürür
 * Kullanıcının kendi seviyesinden düşük roller
 */
export async function getAssignableRoles(userLevel: number): Promise<Role[]> {
    const roles = await getRoles()
    return roles.filter(r => r.level < userLevel)
}

// ---- Cache'i Temizleme ----
export function clearRolesCache() {
    cachedRoles = null
    cachedRolesMap = null
    lastFetchTime = 0
}
