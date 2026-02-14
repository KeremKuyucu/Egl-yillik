import {
    Users,
    Vote,
    MessageSquare,
    MessageSquarePlus,
    Bell,
    Settings,
    FileText,
    LayoutDashboard,
    Star,
    ShieldAlert,
    ChartNoAxesCombined,
    Eye,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { PAGE_PERMS } from "@/lib/auth/permission-constants"

export type AdminGroup = "general" | "content" | "users" | "advanced" | "system"

export interface AdminNavItem {
    href: string
    label: string
    icon: LucideIcon
    requiredPerm: string
    group: AdminGroup
    /** Kısa açıklama — admin dashboard quick-actions'da kullanılır */
    description: string
    /** Gradient sınıfı — admin dashboard kartlarında kullanılır */
    gradient: string
}

/**
 * Tüm admin sayfalarının tek kaynağı.
 * Header, mobil menü ve dashboard quick-actions bu listeyi kullanır.
 */
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
    { href: "/admin", label: "Genel Bakış", description: "İstatistikler ve özet", icon: ChartNoAxesCombined, requiredPerm: PAGE_PERMS.PAGE_ADMIN_OVERVIEW, group: "general", gradient: "from-emerald-500 to-teal-500" },
    { href: "/admin/categories", label: "Kategoriler", description: "Anket kategorileri", icon: LayoutDashboard, requiredPerm: PAGE_PERMS.PAGE_ADMIN_CATEGORIES, group: "content", gradient: "from-indigo-500 to-purple-500" },
    { href: "/admin/suggestions", label: "Kategori Önerileri", description: "Kategori önerileri", icon: Star, requiredPerm: PAGE_PERMS.PAGE_ADMIN_SUGGESTIONS, group: "content", gradient: "from-amber-500 to-orange-500" },
    { href: "/admin/users", label: "Öğrenciler", description: "Profilleri yönet", icon: Users, requiredPerm: PAGE_PERMS.PAGE_ADMIN_USERS, group: "users", gradient: "from-blue-500 to-cyan-500" },
    { href: "/admin/feedback", label: "Geri Bildirimler", description: "Kullanıcı mesajları", icon: MessageSquarePlus, requiredPerm: PAGE_PERMS.PAGE_ADMIN_FEEDBACK, group: "users", gradient: "from-pink-500 to-rose-500" },
    { href: "/admin/roles", label: "Roller", description: "Rolleri yönet", icon: Users, requiredPerm: PAGE_PERMS.PAGE_ADMIN_ROLES, group: "users", gradient: "from-indigo-500 to-purple-500" },
    { href: "/admin/texts", label: "Yazılar", description: "Yıllık yazılarını görüntüle", icon: FileText, requiredPerm: PAGE_PERMS.PAGE_ADMIN_TEXTS, group: "advanced", gradient: "from-violet-500 to-purple-500" },
    { href: "/admin/votes", label: "Anket Sonuçları", description: "Oyları görüntüle", icon: Vote, requiredPerm: PAGE_PERMS.PAGE_ADMIN_VOTES, group: "advanced", gradient: "from-amber-500 to-orange-500" },
    { href: "/admin/reminders", label: "Hatırlatıcılar", description: "Bildirim gönder", icon: Bell, requiredPerm: PAGE_PERMS.PAGE_ADMIN_REMINDERS, group: "advanced", gradient: "from-green-500 to-emerald-500" },
    { href: "/admin/settings", label: "Site Ayarları", description: "Sistem konfigürasyonu", icon: Settings, requiredPerm: PAGE_PERMS.PAGE_ADMIN_SETTINGS, group: "system", gradient: "from-slate-500 to-gray-600" },
    { href: "/admin/logs", label: "Aktivite Logları", description: "Sistem olaylarını görüntüle", icon: ShieldAlert, requiredPerm: PAGE_PERMS.PAGE_ADMIN_LOGS, group: "system", gradient: "from-slate-500 to-gray-600" },
    { href: "/admin/text-access-log", label: "Metin Erişim Logları", description: "Mesaj okuma kayıtları", icon: Eye, requiredPerm: PAGE_PERMS.PAGE_ADMIN_TEXT_ACCESS_LOG, group: "system", gradient: "from-cyan-500 to-blue-600" },
    { href: "/admin/vote-access-log", label: "Oy Erişim Logları", description: "Oylama verisi görüntüleme kayıtları", icon: Eye, requiredPerm: PAGE_PERMS.PAGE_ADMIN_VOTE_ACCESS_LOG, group: "system", gradient: "from-orange-500 to-red-600" },
]

/** İzni olan öğeleri filtrele */
export function getPermittedAdminNavItems(permissions: string[]): AdminNavItem[] {
    return ADMIN_NAV_ITEMS.filter((item) => permissions.includes(item.requiredPerm))
}
