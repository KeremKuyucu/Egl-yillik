// lib/constants.ts

export const ROLES = {
    USER: 0,
    MODERATOR: 10,
    ADMIN: 50,
    SUPER_ADMIN: 100,
    OWNER: 1000,
} as const;

// Tip güvenliği için (Opsiyonel ama önerilir)
export type RoleLevel = typeof ROLES[keyof typeof ROLES];