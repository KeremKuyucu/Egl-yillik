// ---- Dinamik Rol Sistemi ----
// Tüm rol verileri Supabase'den admin_list_roles() ile geliyor
// Bu dosya artık sadece tip tanımlamaları için kullanılır
// Fallback değerleri yok - tüm veriler veritabanından gelir

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

/**
 * Role nesnesinden RoleDetails oluşturur
 */
export function getRoleDetails(role: Role): RoleDetails {
    return {
        label: role.label,
        description: role.description,
        badgeColor: role.badge_color
    }
}
