import { getCurrentProfile } from "@/lib/auth/data"
import { createClient } from "@/lib/supabase/server"
import { MessageSquare, Vote, Zap, User } from "lucide-react"
import { getRoleInfoFromRoles } from "@/lib/roles"
import { getCurrentRoles, getCurrentPermissions } from "@/lib/auth/permissions"
import { getPermittedAdminNavItems } from "@/lib/admin-nav"
import {
    AdminHeroBanner,
    SystemStatusBar,
    QuickActionsCard,
    RecentFeedbackCard,
    RecentSuggestionsCard,
    DeadlineCard,
    SystemLogsCard,
    ActivityStatsChart,
    PlatformOverviewCard,
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
            .in('key', ['deadline', 'messaging_enabled', 'voting_enabled', 'registration_enabled']),
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
    const isMessagingEnabled = settingsMap.messaging_enabled === 'true'
    const isVotingEnabled = settingsMap.voting_enabled === 'true'
    const isRegistrationEnabled = settingsMap.registration_enabled === 'true'

    const daysUntilDeadline = deadline
        ? Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null

    const roleInfo = await getRoleInfoFromRoles(roles)

    // System status items
    const systemStatus = [
        { label: "Mesajlaşma", status: isMessagingEnabled, activeText: "Açık", inactiveText: "Kapalı", icon: MessageSquare },
        { label: "Oylama", status: isVotingEnabled, activeText: "Açık", inactiveText: "Kapalı", icon: Vote },
        { label: "Yeni Kayıtlar", status: isRegistrationEnabled, activeText: "Açık", inactiveText: "Kapalı", icon: User }
    ]

    // Quick actions — ortak admin navigasyonundan üret, "Genel Bakış" hariç
    const quickActions = getPermittedAdminNavItems(permissions)
        .filter(item => item.href !== "/admin")

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Hero Welcome Banner */}
            <AdminHeroBanner
                profile={profile}
                roleInfo={roleInfo || { label: 'Kullanıcı', badgeColor: 'bg-slate-100' }}
                stats={stats}
            />

            {/* System Status Bar */}
            <SystemStatusBar items={systemStatus} />

            {/* Quick Actions — tam genişlik */}
            <QuickActionsCard actions={quickActions} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Activity Chart & Feeds */}
                <div className="lg:col-span-2 space-y-6">
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

                {/* Right Column - Deadline, Overview, Security & Logs */}
                <div className="space-y-6">
                    <DeadlineCard
                        deadline={deadline}
                        daysUntilDeadline={daysUntilDeadline}
                    />
                    <PlatformOverviewCard stats={stats} />
                    <SystemLogsCard logs={systemLogs || []} />
                </div>
            </div>
        </div>
    )
}
