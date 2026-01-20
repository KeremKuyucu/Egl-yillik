// lib/constants.ts

export const ROLES = {
    USER: 0,
    ADMIN: 50,
    SUPER_ADMIN: 100,
    OWNER: 1000,
} as const;

export const ROLE_DETAILS = {
    [ROLES.OWNER]: {
        label: "Owner",
        description: "Tam Yetki: Süper Admin atayabilir, tüm içerikleri ve kullanıcıları yönetebilir.",
        badgeColor: "bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/50 animate-pulse"
    },
    [ROLES.SUPER_ADMIN]: {
        label: "Süper Admin",
        description: "Yüksek Yetki: Admin atayabilir, tüm içerikleri ve kullanıcıları yönetebilir.",
        badgeColor: "bg-gradient-to-r from-red-600 to-orange-600 text-white border-0 hover:from-red-700 hover:to-orange-700 shadow-md shadow-red-500/50"
    },
    [ROLES.ADMIN]: {
        label: "Admin",
        description: "Yönetim: İçerikleri yönetebilir, kullanıcıları düzenleyebilir.",
        badgeColor: "bg-gradient-to-r from-amber-600 to-yellow-600 text-white border-0 hover:from-amber-700 hover:to-yellow-700 shadow-md shadow-amber-500/50"
    },
    [ROLES.USER]: {
        label: "Kullanıcı",
        description: "Standart: Sadece kendi profilini görebilir ve mesaj yazabilir.",
        badgeColor: "border-slate-300 hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-slate-600 dark:hover:bg-slate-900"
    }
} as const;

export function getLevelInfo(level: number) {
    if (level >= ROLES.OWNER) return ROLE_DETAILS[ROLES.OWNER];
    if (level >= ROLES.SUPER_ADMIN) return ROLE_DETAILS[ROLES.SUPER_ADMIN];
    if (level >= ROLES.ADMIN) return ROLE_DETAILS[ROLES.ADMIN];
    return ROLE_DETAILS[ROLES.USER];
}

// Tip güvenliği için (Opsiyonel ama önerilir)
export type RoleLevel = typeof ROLES[keyof typeof ROLES];

// Admin panelinde atanabilir seviyeler (OWNER hariç)
export const AVAILABLE_LEVELS = [
    { value: ROLES.USER, label: ROLE_DETAILS[ROLES.USER].label },
    { value: ROLES.ADMIN, label: ROLE_DETAILS[ROLES.ADMIN].label },
    { value: ROLES.SUPER_ADMIN, label: ROLE_DETAILS[ROLES.SUPER_ADMIN].label },
] as const;
