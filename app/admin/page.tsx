import { getCurrentLevel, getCurrentProfile, getCurrentUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Users,
    Vote,
    MessageSquare,
    Sparkles,
    Bell,
    Settings,
    ShieldAlert,
    FileText,
    LayoutDashboard,
    ShieldCheck,
    Calendar,
    Clock,
    Star,
    Activity,
    Zap,
    ChevronRight,
    CheckCircle2,
    AlertCircle,
    Wrench,
    Eye,
    ArrowRight,
    User
} from "lucide-react"
import Link from "next/link"
import { getLevelInfo, ROLES } from "@/lib/constants"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default async function AdminPage() {

    const profile = await getCurrentProfile()
    const level = await getCurrentLevel()

    const supabase = await createClient()

    // Fetch overview stats via RPC
    const { data: stats } = await supabase.rpc('get_admin_overview_stats')

    // Fetch settings
    const { data: siteSettings } = await supabase
        .from('site_settings')
        .select('*')
        .in('key', ['deadline', 'maintenance_mode', 'messaging_enabled', 'voting_enabled', 'registration_enabled'])

    const settingsMap = siteSettings?.reduce((acc: any, curr) => {
        acc[curr.key] = curr.value
        return acc
    }, {}) || {}

    const deadline = settingsMap.deadline ? new Date(settingsMap.deadline) : null
    const isMaintenance = settingsMap.maintenance_mode === 'true'
    const isMessagingEnabled = settingsMap.messaging_enabled === 'true'
    const isVotingEnabled = settingsMap.voting_enabled === 'true'
    const isRegistrationEnabled = settingsMap.registration_enabled === 'true'

    // Calculate days until deadline
    const daysUntilDeadline = deadline
        ? Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null

    // Fetch recent feedback as activity
    const { data: recentFeedback } = await supabase
        .from('feedback')
        .select('*, profiles:user_id(first_name, last_name, class)')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(5)

    // Fetch recent suggestions
    const { data: recentSuggestions } = await supabase
        .from('user_category_suggestions')
        .select('*, profiles:suggested_by(first_name, last_name, class)')
        .order('created_at', { ascending: false })
        .limit(5)

    // Fetch last 5 system logs
    const { data: systemLogs } = await supabase
        .from('activity_logs')
        .select('*, profiles:changed_by(first_name, last_name)')
        .order('changed_at', { ascending: false })
        .limit(6)

    const levelInfo = getLevelInfo(level)

    const systemStatus = [
        {
            label: "Site Durumu",
            status: !isMaintenance,
            activeText: "Çevrimiçi",
            inactiveText: "Bakımda",
            icon: Zap
        },
        {
            label: "Mesajlaşma",
            status: isMessagingEnabled,
            activeText: "Açık",
            inactiveText: "Kapalı",
            icon: MessageSquare
        },
        {
            label: "Oylama",
            status: isVotingEnabled,
            activeText: "Açık",
            inactiveText: "Kapalı",
            icon: Vote
        },
        {
            label: "Yeni Kayıtlar",
            status: isRegistrationEnabled,
            activeText: "Açık",
            inactiveText: "Kapalı",
            icon: User
        }
    ]

    const quickActions = [
        {
            label: "Öğrenciler",
            description: "Profilleri yönet",
            href: "/admin/users",
            icon: Users,
            role: ROLES.ADMIN,
            gradient: "from-blue-500 to-cyan-500"
        },
        {
            label: "Kategoriler",
            description: "Anket kategorileri",
            href: "/admin/categories",
            icon: LayoutDashboard,
            role: ROLES.ADMIN,
            gradient: "from-indigo-500 to-purple-500"
        },
        {
            label: "Geri Bildirimler",
            description: "Kullanıcı mesajları",
            href: "/admin/feedback",
            icon: MessageSquare,
            role: ROLES.ADMIN,
            gradient: "from-pink-500 to-rose-500"
        },
        {
            label: "Öneriler",
            description: "Kategori önerileri",
            href: "/admin/suggestions",
            icon: Star,
            role: ROLES.ADMIN,
            gradient: "from-amber-500 to-orange-500"
        },
        {
            label: "Site Ayarları",
            description: "Sistem konfigürasyonu",
            href: "/admin/settings",
            icon: Settings,
            role: ROLES.SUPER_ADMIN,
            gradient: "from-slate-500 to-gray-600"
        },
        {
            label: "Duyurular",
            description: "Bildirim gönder",
            href: "/admin/reminders",
            icon: Bell,
            role: ROLES.SUPER_ADMIN,
            gradient: "from-green-500 to-emerald-500"
        },
        {
            label: "Sistem Logları",
            description: "Sistem olaylarını görüntüle",
            href: "/admin/logs",
            icon: FileText,
            role: ROLES.SUPER_ADMIN,
            gradient: "from-slate-500 to-gray-600"
        },
        {
            label: "Yıllık Yazıları",
            description: "Yıllık yazılarını görüntüle",
            href: "/admin/texts",
            icon: FileText,
            role: ROLES.SUPER_ADMIN,
            gradient: "from-violet-500 to-purple-500"
        },
        {
            label: "Oylar",
            description: "Oyları görüntüle",
            href: "/admin/votes",
            icon: Vote,
            role: ROLES.SUPER_ADMIN,
            gradient: "from-amber-500 to-orange-500"
        }
    ].filter(link => (level ?? 0) >= link.role)

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Hero Welcome Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 md:p-10 text-white shadow-2xl">
                {/* Animated Background */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-0 -left-40 w-80 h-80 bg-indigo-500/30 rounded-full blur-[100px] animate-pulse" />
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[150px]" />
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02]" />
                </div>

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 flex-wrap">
                            <Badge className={`${levelInfo.badgeColor} backdrop-blur-xl border-white/10 px-3 py-1`}>
                                <ShieldCheck className="h-3 w-3 mr-1" />
                                {levelInfo.label}
                            </Badge>
                            <div className="flex items-center gap-2 text-white/50 text-sm">
                                <Clock className="h-3.5 w-3.5" />
                                <span>{new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                            </div>
                        </div>

                        <div>
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
                                Hoş geldin, <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">{profile?.first_name}</span> 👋
                            </h1>
                            <p className="text-white/60 mt-3 max-w-xl text-base md:text-lg">
                                EGL Yıllık yönetim panelinden sistemi kontrol edebilir, kullanıcıları yönetebilir ve içerikleri düzenleyebilirsin.
                            </p>
                        </div>

                        {/* Quick Stats in Banner */}
                        <div className="flex flex-wrap items-center gap-6 pt-2">
                            <div className="flex items-center gap-2">
                                <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                                    <Users className="h-5 w-5 text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stats?.users_count || 0}</p>
                                    <p className="text-[10px] text-white/50 uppercase tracking-wider">Öğrenci</p>
                                </div>
                            </div>
                            <div className="w-px h-10 bg-white/10" />
                            <div className="flex items-center gap-2">
                                <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                                    <FileText className="h-5 w-5 text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stats?.texts_count || 0}</p>
                                    <p className="text-[10px] text-white/50 uppercase tracking-wider">Yazı</p>
                                </div>
                            </div>
                            <div className="w-px h-10 bg-white/10" />
                            <div className="flex items-center gap-2">
                                <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                                    <Vote className="h-5 w-5 text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stats?.votes_count || 0}</p>
                                    <p className="text-[10px] text-white/50 uppercase tracking-wider">Oy</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3 min-w-[200px]">
                        <Button asChild size="lg" className="bg-white text-slate-900 hover:bg-white/90 shadow-xl shadow-white/10 font-semibold">
                            <Link href="/admin/settings" className="flex items-center gap-2">
                                <Settings className="h-4 w-4" />
                                Ayarları Yönet
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                        <Button asChild size="lg" variant="outline" className="border-white/20 bg-white/5 hover:bg-white/10 text-white backdrop-blur-sm">
                            <Link href="/home" className="flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                Siteyi Görüntüle
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Decorative */}
                <Sparkles className="absolute top-6 right-6 h-8 w-8 text-white/5" />
            </div>

            {/* System Status Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {systemStatus.map((item, idx) => (
                    <div
                        key={idx}
                        className={`flex items-center justify-between p-4 rounded-2xl border backdrop-blur-sm transition-all ${item.status
                            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-800/30'
                            : 'bg-red-50/50 dark:bg-red-950/20 border-red-200/50 dark:border-red-800/30'
                            }`}>
                        <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${item.status
                                ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400'
                                : 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400'
                                }`}>
                                <item.icon className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-bold">{item.label}</p>
                                <p className={`text-xs font-medium ${item.status ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                                    }`}>
                                    {item.status ? item.activeText : item.inactiveText}
                                </p>
                            </div>
                        </div>
                        <div className={`h-3 w-3 rounded-full ${item.status ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Quick Actions & Activity */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Quick Actions */}
                    <Card className="border-0 shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
                        <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                                        <Zap className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">Hızlı Erişim</CardTitle>
                                        <CardDescription>Yönetim araçlarına hızlı geçiş</CardDescription>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {quickActions.map((action, idx) => (
                                    <Link key={idx} href={action.href}>
                                        <div className="group relative p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all hover:shadow-lg">
                                            <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${action.gradient} text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg`}>
                                                <action.icon className="h-6 w-6" />
                                            </div>
                                            <h3 className="font-bold text-sm mb-0.5">{action.label}</h3>
                                            <p className="text-[11px] text-muted-foreground">{action.description}</p>
                                            <ChevronRight className="absolute top-4 right-4 h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Activity Feeds */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Recent Feedback */}
                        <Card className="border-0 shadow-xl bg-white dark:bg-slate-900">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base font-bold flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                                            <MessageSquare className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                                        </div>
                                        Geri Bildirimler
                                    </CardTitle>
                                    <Button variant="ghost" size="sm" asChild className="h-8 text-xs">
                                        <Link href="/admin/feedback" className="flex items-center gap-1">
                                            Tümü <ChevronRight className="h-3 w-3" />
                                        </Link>
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {recentFeedback && recentFeedback.length > 0 ? (
                                        recentFeedback.slice(0, 4).map((f: any) => (
                                            <div key={f.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                        {f.profiles?.first_name} {f.profiles?.last_name}
                                                    </span>
                                                    <Badge variant="outline" className="text-[9px] h-4 px-1.5">
                                                        {f.profiles?.class}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                                    {f.message}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground mt-2">
                                                    {new Date(f.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center">
                                            <MessageSquare className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                                            <p className="text-sm text-muted-foreground">Henüz geri bildirim yok</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent Suggestions */}
                        <Card className="border-0 shadow-xl bg-white dark:bg-slate-900">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base font-bold flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                            <Star className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                        </div>
                                        Kategori Önerileri
                                    </CardTitle>
                                    <Button variant="ghost" size="sm" asChild className="h-8 text-xs">
                                        <Link href="/admin/suggestions" className="flex items-center gap-1">
                                            Tümü <ChevronRight className="h-3 w-3" />
                                        </Link>
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {recentSuggestions && recentSuggestions.length > 0 ? (
                                        recentSuggestions.slice(0, 4).map((s: any) => (
                                            <div key={s.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl">{s.emoji}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold truncate">{s.title}</p>
                                                        <p className="text-[11px] text-muted-foreground">
                                                            {s.profiles?.first_name} {s.profiles?.last_name} • {s.profiles?.class}
                                                        </p>
                                                    </div>
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-[9px] h-5 ${s.status === 'pending'
                                                            ? 'border-amber-300 text-amber-600 bg-amber-50 dark:bg-amber-900/20'
                                                            : s.status === 'approved'
                                                                ? 'border-green-300 text-green-600 bg-green-50 dark:bg-green-900/20'
                                                                : 'border-red-300 text-red-600 bg-red-50 dark:bg-red-900/20'
                                                            }`}
                                                    >
                                                        {s.status === 'pending' ? 'Bekliyor' : s.status === 'approved' ? 'Onaylı' : 'Reddedildi'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center">
                                            <Star className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                                            <p className="text-sm text-muted-foreground">Henüz öneri yok</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Right Column - System Info & Logs */}
                <div className="space-y-6">
                    {/* Deadline Card */}
                    <Card className="border-0 shadow-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white overflow-hidden relative">
                        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                        <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-pink-500/20 rounded-full blur-2xl" />

                        <CardContent className="p-6 relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                    <Calendar className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-white/60 text-xs uppercase tracking-wider font-bold">Son Tarih</p>
                                    <p className="text-xl font-bold">
                                        {deadline
                                            ? deadline.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
                                            : 'Belirlenmedi'
                                        }
                                    </p>
                                </div>
                            </div>

                            {daysUntilDeadline !== null && (
                                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-white/80">Kalan Süre</span>
                                        <span className="text-2xl font-bold">
                                            {daysUntilDeadline > 0 ? `${daysUntilDeadline} gün` : 'Süre doldu!'}
                                        </span>
                                    </div>
                                    <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-white rounded-full transition-all duration-500"
                                            style={{
                                                width: `${Math.max(0, Math.min(100, ((30 - daysUntilDeadline) / 30) * 100))}%`
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            <Button asChild className="w-full mt-4 bg-white text-indigo-600 hover:bg-white/90 font-bold shadow-xl">
                                <Link href="/admin/settings" className="flex items-center justify-center gap-2">
                                    <Wrench className="h-4 w-4" />
                                    Tarihi Düzenle
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Security Note */}
                    <Card className="border-0 shadow-xl bg-white dark:bg-slate-900 border-l-4 border-l-indigo-500">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                    <ShieldAlert className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <h4 className="font-bold">Güvenlik Notu</h4>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                                Tüm admin işlemleri loglanmaktadır. Kritik değişiklikler sistem tarafından kaydedilir.
                            </p>
                            <div className={`p-3 rounded-xl flex items-center gap-3 ${isMaintenance
                                ? 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30'
                                : 'bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30'
                                }`}>
                                {isMaintenance ? (
                                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                                ) : (
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                                )}
                                <div>
                                    <p className={`text-xs font-bold ${isMaintenance ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                        {isMaintenance ? 'Bakım Modu Aktif' : 'Site Çevrimiçi'}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                        {isMaintenance ? 'Kullanıcılar siteye erişemiyor' : 'Her şey normal çalışıyor'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* System Logs */}
                    <Card className="border-0 shadow-xl bg-white dark:bg-slate-900">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                        <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    Aktivite Logları
                                </CardTitle>
                                <Button variant="ghost" size="sm" asChild className="h-8 text-xs">
                                    <Link href="/admin/logs" className="flex items-center gap-1">
                                        Tümü <ChevronRight className="h-3 w-3" />
                                    </Link>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[350px] overflow-y-auto">
                                {systemLogs && systemLogs.length > 0 ? (
                                    systemLogs.map((log: any) => (
                                        <div key={log.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${log.operation === 'INSERT'
                                                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                                                    : log.operation === 'UPDATE'
                                                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                                        : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                                    }`}>
                                                    <Activity className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold truncate">
                                                        {log.table_name} • {log.operation}
                                                    </p>
                                                    <p className="text-[11px] text-muted-foreground">
                                                        {log.profiles ? `${log.profiles.first_name} ${log.profiles.last_name}` : 'Sistem'}
                                                    </p>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <p className="text-[10px] text-muted-foreground">
                                                        {new Date(log.changed_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center">
                                        <Activity className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                                        <p className="text-sm text-muted-foreground">Henüz log kaydı yok</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
