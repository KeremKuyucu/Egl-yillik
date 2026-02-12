import type { LucideIcon } from "lucide-react"
import type { AdminGroup } from "@/lib/admin-nav"

export type { AdminGroup, AdminNavItem } from "@/lib/admin-nav"

export type HeaderMode = "user" | "admin"

export type NavItem = {
    href: string
    label: string
    icon: LucideIcon
    requiredPerm?: string
    group?: AdminGroup
}

export interface HeaderSharedProps {
    mode: HeaderMode
    userProfile: any
    navItems: NavItem[]
    adminNavItems: NavItem[]
    isActive: (path: string) => boolean
    isAdminItemActive: (href: string) => boolean
    profileLink: string
    hasAdminAccess: boolean
    computedShowNewButton: boolean
    signOut: () => Promise<void>
}
