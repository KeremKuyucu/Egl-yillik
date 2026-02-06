import { getCurrentProfile } from "@/lib/auth/data"
import { createClient } from "@/lib/supabase/server"
import {
    Users,
    Vote,
    MessageSquare,
    Bell,
    Settings,
    FileText,
    LayoutDashboard,
    Star,
    Zap,
    User
} from "lucide-react"
import { getRoleInfoFromRoles } from "@/lib/constants"
import { getCurrentRoles, getCurrentPermissions, PAGE_PERMS } from "@/lib/auth/permissions"
import {
    AdminHeroBanner,
    SystemStatusBar,
    QuickActionsCard,
    RecentFeedbackCard,
    RecentSuggestionsCard,
    DeadlineCard,
    SecurityNoteCard,
    SystemLogsCard,
    ActivityStatsChart
} from "@/components/admin/dashboard"

export default async function AdminPage() {
    // Paralel veri çekme
    const [profile, roles, permissions, supabase] = await Promise.all([
        getCurrentProfile(),
        getCurrentRoles(),
        getCurrentPermissions(),
        createClient()
    ])

    // Supabase sorguları paralel çalıştır
    const [
        { data: stats },
        { data: siteSettings },
        { data: recentFeedback },
        { data: recentSuggestions },
        { data: systemLogs },
        { data: activityStats }
    ] = await Promise.all([
        supabase.rpc('get_admin_overview_stats'),
        supabase
            .from('site_settings')
            .select('*')
            .in('key', ['deadline', 'maintenance_mode', 'messaging_enabled', 'voting_enabled', 'registration_enabled']),
        supabase
            .from('feedback')
            .select('*, profiles:user_id(first_name, last_name, class)')
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(5),
        supabase
            .from('user_category_suggestions')
            .select('*, profiles:suggested_by(first_name, last_name, class)')
            .order('created_at', { ascending: false })
            .limit(5),
        supabase
            .from('activity_logs')
            .select('*, profiles:changed_by(first_name, last_name)')
            .order('changed_at', { ascending: false })
            .limit(6),
        supabase.rpc('get_last_active_stats', {
            p_bucket: 'day',
            p_start: null,
            p_end: null,
            p_profile_id: null
        })
    ])

    // Settings işleme
    const settingsMap = siteSettings?.reduce((acc: Record<string, string>, curr) => {
        acc[curr.key] = curr.value
        return acc
    }, {}) || {}

    const deadline = settingsMap.deadline ? new Date(settingsMap.deadline) : null
    const isMaintenance = settingsMap.maintenance_mode === 'true'
    const isMessagingEnabled = settingsMap.messaging_enabled === 'true'
    const isVotingEnabled = settingsMap.voting_enabled === 'true'
    const isRegistrationEnabled = settingsMap.registration_enabled === 'true'

    const daysUntilDeadline = deadline
        ? Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null

    const roleInfo = getRoleInfoFromRoles(roles)

    // System status items
    const systemStatus = [
        { label: "Site Durumu", status: !isMaintenance, activeText: "Çevrimiçi", inactiveText: "Bakımda", icon: Zap },
        { label: "Mesajlaşma", status: isMessagingEnabled, activeText: "Açık", inactiveText: "Kapalı", icon: MessageSquare },
        { label: "Oylama", status: isVotingEnabled, activeText: "Açık", inactiveText: "Kapalı", icon: Vote },
        { label: "Yeni Kayıtlar", status: isRegistrationEnabled, activeText: "Açık", inactiveText: "Kapalı", icon: User }
    ]

    // Permission kontrolü için helper
    const hasPerm = (perm: string) => permissions.includes(perm)

    // Quick actions - permission tabanlı
    // İsimlendirmeleri permissions.ts'den değiştirebilirsin
    const quickActions = [
        { label: "Öğrenciler", description: "Profilleri yönet", href: "/admin/users", icon: Users, requiredPerm: PAGE_PERMS.PAGE_ADMIN_USERS, gradient: "from-blue-500 to-cyan-500" },
        { label: "Kategoriler", description: "Anket kategorileri", href: "/admin/categories", icon: LayoutDashboard, requiredPerm: PAGE_PERMS.PAGE_ADMIN_CATEGORIES, gradient: "from-indigo-500 to-purple-500" },
        { label: "Geri Bildirimler", description: "Kullanıcı mesajları", href: "/admin/feedback", icon: MessageSquare, requiredPerm: PAGE_PERMS.PAGE_ADMIN_FEEDBACK, gradient: "from-pink-500 to-rose-500" },
        { label: "Öneriler", description: "Kategori önerileri", href: "/admin/suggestions", icon: Star, requiredPerm: PAGE_PERMS.PAGE_ADMIN_SUGGESTIONS, gradient: "from-amber-500 to-orange-500" },
        { label: "Site Ayarları", description: "Sistem konfigürasyonu", href: "/admin/settings", icon: Settings, requiredPerm: PAGE_PERMS.PAGE_ADMIN_SETTINGS, gradient: "from-slate-500 to-gray-600" },
        { label: "Duyurular", description: "Bildirim gönder", href: "/admin/reminders", icon: Bell, requiredPerm: PAGE_PERMS.PAGE_ADMIN_REMINDERS, gradient: "from-green-500 to-emerald-500" },
        { label: "Yıllık Yazıları", description: "Yıllık yazılarını görüntüle", href: "/admin/texts", icon: FileText, requiredPerm: PAGE_PERMS.PAGE_ADMIN_TEXTS, gradient: "from-violet-500 to-purple-500" },
        { label: "Oylar", description: "Oyları görüntüle", href: "/admin/votes", icon: Vote, requiredPerm: PAGE_PERMS.PAGE_ADMIN_VOTES, gradient: "from-amber-500 to-orange-500" },
        { label: "Sistem Logları", description: "Sistem olaylarını görüntüle", href: "/admin/logs", icon: FileText, requiredPerm: PAGE_PERMS.PAGE_ADMIN_LOGS, gradient: "from-slate-500 to-gray-600" }
    ].filter(link => hasPerm(link.requiredPerm))

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Hero Welcome Banner */}
            <AdminHeroBanner
                profile={profile}
                roleInfo={roleInfo}
                stats={stats}
            />

            {/* System Status Bar */}
            <SystemStatusBar items={systemStatus} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Quick Actions & Activity */}
                <div className="lg:col-span-2 space-y-6">
                    <QuickActionsCard actions={quickActions} />

                    {/* Activity Stats Chart */}
                    {activityStats && activityStats.length > 0 && (
                        <ActivityStatsChart data={activityStats} />
                    )}

                    {/* Activity Feeds */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <RecentFeedbackCard feedback={recentFeedback || []} />
                        <RecentSuggestionsCard suggestions={recentSuggestions || []} />
                    </div>
                </div>

                {/* Right Column - System Info & Logs */}
                <div className="space-y-6">
                    <DeadlineCard
                        deadline={deadline}
                        daysUntilDeadline={daysUntilDeadline}
                    />
                    <SecurityNoteCard isMaintenance={isMaintenance} />
                    <SystemLogsCard logs={systemLogs || []} />
                </div>
            </div>
        </div>
    )
}
