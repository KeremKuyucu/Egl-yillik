import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Users,
    Vote,
    MessageSquare,
    Sparkles,
    ArrowUpRight,
    Bell,
    Settings,
    ShieldAlert,
    FileText,
    MessageSquarePlus,
    LayoutDashboard,
    TrendingUp,
    ShieldCheck,
    Calendar,
    ChevronRight,
    Clock,
    Star,
    Activity
} from "lucide-react"
import Link from "next/link"
import { getLevelInfo, ROLES } from "@/lib/constants"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default async function AdminPage() {
    const { user, profile, level } = await requireAdmin()
    const supabase = await createClient()

    // Fetch overview stats via RPC
    const { data: stats } = await supabase.rpc('get_admin_overview_stats')

    // Fetch settings
    const { data: siteSettings } = await supabase
        .from('site_settings')
        .select('*')
        .in('key', ['deadline', 'graduation_date', 'maintenance_mode'])

    const settingsMap = siteSettings?.reduce((acc: any, curr) => {
        acc[curr.key] = curr.value
        return acc
    }, {}) || {}

    const deadline = settingsMap.deadline ? new Date(settingsMap.deadline) : null
    const isMaintenance = settingsMap.maintenance_mode === 'true'

    // Fetch recent feedback as activity
    const { data: recentFeedback } = await supabase
        .from('feedback')
        .select('*, profiles:user_id(first_name, last_name, class)')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(4)

    // Fetch recent suggestions
    const { data: recentSuggestions } = await supabase
        .from('user_category_suggestions')
        .select('*, profiles:suggested_by(first_name, last_name, class)')
        .order('created_at', { ascending: false })
        .limit(4)

    // Fetch last 5 system logs
    const { data: systemLogs } = await supabase
        .from('activity_logs')
        .select('*, profiles:changed_by(first_name, last_name)')
        .order('changed_at', { ascending: false })
        .limit(5)

    const levelInfo = getLevelInfo(level)

    const statCards = [
        {
            label: "Toplam Öğrenci",
            value: stats?.users_count || 0,
            icon: Users,
            color: "text-blue-600 dark:text-blue-400",
            bg: "bg-blue-100/50 dark:bg-blue-900/20",
            href: "/admin/users",
            description: "Kayıtlı tüm profiller"
        },
        {
            label: "Toplam Oy",
            value: stats?.votes_count || 0,
            icon: Vote,
            color: "text-amber-600 dark:text-amber-400",
            bg: "bg-amber-100/50 dark:bg-amber-900/20",
            href: "/admin/surveys",
            description: "Kullanılan toplam oy"
        },
        {
            label: "Yıllık Yazıları",
            value: stats?.texts_count || 0,
            icon: FileText,
            color: "text-indigo-600 dark:text-indigo-400",
            bg: "bg-indigo-100/50 dark:bg-indigo-900/20",
            href: "/admin/texts",
            description: "Aktif mesaj sayısı"
        },
        {
            label: "Bekleyen Öneriler",
            value: stats?.pending_suggestions_count || 0,
            icon: MessageSquarePlus,
            color: "text-purple-600 dark:text-purple-400",
            bg: "bg-purple-100/50 dark:bg-purple-900/20",
            href: "/admin/suggestions",
            description: "Onay bekleyen kategoriler"
        }
    ]

    const quickLinks = [
        { label: "Öğrencileri Yönet", href: "/admin/users", icon: Users, role: ROLES.ADMIN },
        { label: "Anketleri Düzenle", href: "/admin/surveys", icon: Vote, role: ROLES.ADMIN },
        { label: "Site Ayarları", href: "/admin/settings", icon: Settings, role: ROLES.SUPER_ADMIN },
        { label: "Geri Bildirimler", href: "/admin/feedback", icon: MessageSquare, role: ROLES.ADMIN },
        { label: "Kategorileri Yönet", href: "/admin/categories", icon: LayoutDashboard, role: ROLES.ADMIN },
        { label: "Duyuru Gönder", href: "/admin/reminders", icon: Bell, role: ROLES.SUPER_ADMIN },
    ].filter(link => level >= link.role)

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Welcome Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 text-white shadow-2xl shadow-indigo-500/20">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Badge className={`${levelInfo.badgeColor} border-white/20 backdrop-blur-md`}>
                                {levelInfo.label}
                            </Badge>
                            <span className="text-white/70 text-sm font-medium">Paneline Hoş Geldiniz</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold font-serif mb-2">
                            Merhaba, {profile?.first_name} 👋
                        </h1>
                        <p className="text-indigo-100/90 max-w-lg">
                            EGL Yıllık platformunun yönetim merkezindesiniz. Buradan kullanıcıları, içerikleri ve sistem ayarlarını kontrol edebilirsiniz.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button asChild variant="secondary" className="bg-white/10 hover:bg-white/20 border-white/20 text-white backdrop-blur-md">
                            <Link href="/dashboard" className="flex items-center gap-2">
                                <LayoutDashboard className="h-4 w-4" />
                                Siteye Dön
                            </Link>
                        </Button>
                        <Button asChild className="bg-white text-indigo-600 hover:bg-indigo-50">
                            <Link href="/admin/settings" className="flex items-center gap-2">
                                <Settings className="h-4 w-4" />
                                Ayarlar
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-64 w-64 rounded-full bg-pink-500/20 blur-3xl" />
                <Sparkles className="absolute top-8 right-8 h-12 w-12 text-white/10 animate-pulse" />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {statCards.map((stat, idx) => (
                    <Link key={idx} href={stat.href}>
                        <Card className="hover:shadow-xl transition-all duration-300 border-none bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm group overflow-hidden">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} transition-transform group-hover:scale-110 duration-300`}>
                                        <stat.icon className="h-6 w-6" />
                                    </div>
                                    <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="mt-4">
                                    <h3 className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">{stat.label}</h3>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-bold tracking-tight">{stat.value}</span>
                                        <span className="text-xs text-green-500 font-medium flex items-center gap-1">
                                            <TrendingUp className="h-3 w-3" />
                                            Aktif
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Quick Actions & Recent Activity */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Quick Links */}
                    <Card className="border-none shadow-lg bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden">
                        <CardHeader className="border-b border-indigo-50/50 dark:border-slate-800/50 pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                                        <ShieldCheck className="h-5 w-5 text-indigo-500" />
                                        Hızlı Erişim
                                    </CardTitle>
                                    <CardDescription>En çok kullanılan yönetim araçları</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {quickLinks.map((link, idx) => (
                                    <Link key={idx} href={link.href}>
                                        <div className="flex flex-col items-center justify-center p-4 rounded-2xl border border-indigo-100/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-800/20 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-200 transition-all group">
                                            <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                                <link.icon className="h-5 w-5" />
                                            </div>
                                            <span className="text-sm font-semibold text-center leading-tight">{link.label}</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Feedback & Suggestions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Recent Feedback */}
                        <Card className="border-none shadow-lg bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base font-bold flex items-center gap-2">
                                        <MessageSquare className="h-4 w-4 text-pink-500" />
                                        Son Geri Bildirimler
                                    </CardTitle>
                                    <Button variant="ghost" size="sm" asChild className="h-8 text-xs underline decoration-indigo-500/30 underline-offset-4">
                                        <Link href="/admin/feedback">Tümü</Link>
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-indigo-50/50 dark:divide-slate-800/50">
                                    {recentFeedback && recentFeedback.length > 0 ? (
                                        recentFeedback.map((f: any) => (
                                            <div key={f.id} className="p-4 hover:bg-white/80 dark:hover:bg-slate-800/50 transition-colors">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                                        {f.profiles?.first_name} {f.profiles?.last_name} ({f.profiles?.class})
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground italic">
                                                        {new Date(f.created_at).toLocaleDateString('tr-TR')}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                                    {f.message}
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center text-sm text-muted-foreground">
                                            Geri bildirim bulunamadı.
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent Suggestions */}
                        <Card className="border-none shadow-lg bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base font-bold flex items-center gap-2">
                                        <Star className="h-4 w-4 text-amber-500" />
                                        Son Kategori Önerileri
                                    </CardTitle>
                                    <Button variant="ghost" size="sm" asChild className="h-8 text-xs underline decoration-indigo-500/30 underline-offset-4">
                                        <Link href="/admin/suggestions">Tümü</Link>
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-indigo-50/50 dark:divide-slate-800/50">
                                    {recentSuggestions && recentSuggestions.length > 0 ? (
                                        recentSuggestions.map((s: any) => (
                                            <div key={s.id} className="p-4 hover:bg-white/80 dark:hover:bg-slate-800/50 transition-colors">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-lg">{s.emoji}</span>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold leading-none">{s.title}</span>
                                                        <span className="text-[10px] text-muted-foreground">
                                                            {s.profiles?.first_name} {s.profiles?.last_name} ({s.profiles?.class})
                                                        </span>
                                                    </div>
                                                    {s.status === 'pending' && (
                                                        <Badge variant="outline" className="ml-auto text-[9px] h-4 py-0 px-1 border-amber-200 text-amber-600 bg-amber-50">Bekliyor</Badge>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center text-sm text-muted-foreground">
                                            Öneri bulunamadı.
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* System Logs */}
                    <Card className="border-none shadow-lg bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-blue-500" />
                                    Sistem Logları
                                </CardTitle>
                                <Button variant="ghost" size="sm" asChild className="h-8 text-xs underline decoration-indigo-500/30 underline-offset-4">
                                    <Link href="/admin/logs">Tümü</Link>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-indigo-50/50 dark:divide-slate-800/50">
                                {systemLogs && systemLogs.length > 0 ? (
                                    systemLogs.map((log: any) => (
                                        <div key={log.id} className="p-4 hover:bg-white/80 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${log.operation === 'INSERT' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                                                    log.operation === 'UPDATE' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                                                        log.operation === 'DELETE' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                                                            'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    <Activity className="h-4 w-4" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                        {log.table_name} • {log.operation}
                                                    </span>
                                                    <span className="text-sm font-medium">
                                                        {log.profiles ? `${log.profiles.first_name} ${log.profiles.last_name}` : 'Sistem'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] text-muted-foreground block">
                                                    {new Date(log.changed_at).toLocaleDateString('tr-TR')}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground block">
                                                    {new Date(log.changed_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-sm text-muted-foreground">
                                        Henüz log kaydı yok.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    {/* System Info */}
                    <Card className="border-none shadow-lg bg-indigo-600 text-white overflow-hidden relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 group-hover:bg-white/20 transition-colors duration-500" />
                        <CardHeader className="relative z-10 pb-2">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Sistem Özeti
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="relative z-10 p-6 pt-2 space-y-4">
                            <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
                                <div className="flex items-center gap-3 mb-1">
                                    <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
                                        <Clock className="h-4 w-4" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-white/70 uppercase font-bold tracking-widest">Son Tarih</span>
                                        <span className="text-sm font-bold">
                                            {deadline ? deadline.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Belirlenmedi'}
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-4 flex flex-col gap-1">
                                    <div className="flex justify-between text-[10px] font-bold">
                                        <span>HAZIRLIK</span>
                                        <span>75%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                                        <div className="h-full bg-white rounded-full w-[75%]" />
                                    </div>
                                </div>
                            </div>

                            <Button asChild className="w-full bg-white text-indigo-600 hover:bg-white/90 font-bold">
                                <Link href="/admin/settings">Ayarları Yönet</Link>
                            </Button>
                        </CardContent>
                        <div className="absolute -bottom-12 -right-12 h-32 w-32 rounded-full bg-white/10 blur-2xl group-hover:scale-150 transition-transform duration-700" />
                    </Card>

                    {/* Developer Note/Security */}
                    <Card className="border-none shadow-lg bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden border-l-4 border-indigo-500">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                    <ShieldAlert className="h-5 w-5" />
                                </div>
                                <h4 className="font-bold">Güvenlik Notu</h4>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                                Admin panelindeki tüm işlemler loglanmaktadır. Yetkisiz erişim denemeleri ve kritik değişiklikler sistem tarafından kaydedilir. Lütfen işlem yapmadan önce dikkatli olunuz.
                            </p>
                            <div className={`p-3 rounded-xl border flex items-start gap-3 ${isMaintenance ? 'bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/50' : 'bg-green-50 dark:bg-green-950/20 border-green-100 dark:border-green-900/50'}`}>
                                <Bell className={`h-4 w-4 mt-0.5 ${isMaintenance ? 'text-red-500' : 'text-green-500'}`} />
                                <div className="flex flex-col">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isMaintenance ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                        Durum
                                    </span>
                                    <span className={`text-[11px] font-medium ${isMaintenance ? 'text-red-800 dark:text-red-200' : 'text-green-800 dark:text-green-200'}`}>
                                        Bakım modu şu anda {isMaintenance ? 'AKTİF' : 'kapalı'}.
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
