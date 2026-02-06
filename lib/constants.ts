export const ROLE_KEYS = {
    noAuth: "noAuth",
    USER: "user",
    ADMIN: "admin",
    SUPER_ADMIN: "super_admin",
    SYSTEM_ADMIN: "system_admin",
    OWNER: "owner",
} as const;

export type RoleKey = typeof ROLE_KEYS[keyof typeof ROLE_KEYS];
export type RealRoleKey = Exclude<RoleKey, "noAuth">;

export const ROLE_LEVELS: Record<RealRoleKey, number> = {
    user: 1,
    admin: 50,
    super_admin: 100,
    system_admin: 500,
    owner: 1000,
};

export const ROLE_DETAILS: Record<RoleKey, {
    label: string;
    description: string;
    badgeColor: string;
}> = {
    noAuth: {
        label: "Giriş Yapmamış",
        description: "Standart: Hiçbir şey yapamaz.",
        badgeColor:
            "border-slate-300 hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-slate-600 dark:hover:bg-slate-900",
    },
    owner: {
        label: "Owner",
        description: "Tam Yetki: System Admin atayabilir, tüm içerikleri ve kullanıcıları yönetebilir.",
        badgeColor:
            "bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/50 animate-pulse",
    },
    system_admin: {
        label: "System Admin",
        description: "Çok Yüksek Yetki: Süper Adminleri yönetebilir, sistem ayarlarına erişir. Owner hariç her şeye yetkisi vardır.",
        badgeColor:
            "bg-gradient-to-r from-indigo-600 to-blue-600 text-white border-0 hover:from-indigo-700 hover:to-blue-700 shadow-md shadow-indigo-500/50",
    },
    super_admin: {
        label: "Süper Admin",
        description: "Yüksek Yetki: Admin atayabilir, tüm içerikleri ve kullanıcıları yönetebilir.",
        badgeColor:
            "bg-gradient-to-r from-red-600 to-orange-600 text-white border-0 hover:from-red-700 hover:to-orange-700 shadow-md shadow-red-500/50",
    },
    admin: {
        label: "Admin",
        description: "Yönetim: İçerikleri yönetebilir, kullanıcıları düzenleyebilir.",
        badgeColor:
            "bg-gradient-to-r from-amber-600 to-yellow-600 text-white border-0 hover:from-amber-700 hover:to-yellow-700 shadow-md shadow-amber-500/50",
    },
    user: {
        label: "Kullanıcı",
        description: "Standart: Sadece kendi profilini görebilir ve mesaj yazabilir.",
        badgeColor:
            "border-slate-300 hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-slate-600 dark:hover:bg-slate-900",
    },
};

// Admin panelinde atanabilir roller (OWNER yok)
export const AVAILABLE_ROLES = [
    { value: ROLE_KEYS.USER, label: ROLE_DETAILS.user.label },
    { value: ROLE_KEYS.ADMIN, label: ROLE_DETAILS.admin.label },
    { value: ROLE_KEYS.SUPER_ADMIN, label: ROLE_DETAILS.super_admin.label },
    { value: ROLE_KEYS.SYSTEM_ADMIN, label: ROLE_DETAILS.system_admin.label },
] as const;

export function getHighestRoleKey(userRoles: string[] | null | undefined): RoleKey {
    if (!userRoles?.length) return ROLE_KEYS.noAuth;

    let best: RealRoleKey | null = null;
    let bestLevel = -1;

    for (const r of userRoles) {
        if (Object.prototype.hasOwnProperty.call(ROLE_LEVELS, r)) {
            const level = ROLE_LEVELS[r as RealRoleKey];
            if (level > bestLevel) {
                bestLevel = level;
                best = r as RealRoleKey;
            }
        }
    }

    return best ?? ROLE_KEYS.noAuth;
}

export function getRoleInfoFromRoles(userRoles: string[] | null | undefined) {
    return ROLE_DETAILS[getHighestRoleKey(userRoles)];
}

export function getRoleNameByLevel(level: number): string {
    // Find role key by level value
    const roleKey = Object.keys(ROLE_LEVELS).find(
        key => ROLE_LEVELS[key as RealRoleKey] === level
    ) as RealRoleKey | undefined

    if (roleKey && ROLE_DETAILS[roleKey]) {
        return ROLE_DETAILS[roleKey].label
    }
    return "Kullanıcı"
}
