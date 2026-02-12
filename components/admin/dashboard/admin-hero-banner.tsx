import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    ShieldCheck,
    Clock,
    Users,
    FileText,
    Vote,
    Settings,
    Sparkles,
    Eye,
    ArrowRight,
    Star,
    MessageSquarePlus,
    LayoutDashboard
} from "lucide-react"
import Link from "next/link"

interface AdminHeroBannerProps {
    profile: { first_name: string } | null
    roleInfo: { label: string; badgeColor: string }
    stats: {
        users_count?: number
        texts_count?: number
        votes_count?: number
        pending_suggestions_count?: number
        active_categories_count?: number
        total_feedback_count?: number
    } | null
}

function getGreeting(): string {
    const hour = new Date().getHours()
    if (hour < 6) return "İyi geceler"
    if (hour < 12) return "Günaydın"
    if (hour < 18) return "İyi günler"
    return "İyi akşamlar"
}

const statItems = [
    { key: "users_count" as const, label: "Öğrenci", icon: Users, color: "text-blue-400", bg: "bg-blue-500/20" },
    { key: "texts_count" as const, label: "Yazı", icon: FileText, color: "text-purple-400", bg: "bg-purple-500/20" },
    { key: "votes_count" as const, label: "Oy", icon: Vote, color: "text-amber-400", bg: "bg-amber-500/20" },
    { key: "active_categories_count" as const, label: "Kategori", icon: LayoutDashboard, color: "text-emerald-400", bg: "bg-emerald-500/20" },
    { key: "pending_suggestions_count" as const, label: "Bekleyen Öneri", icon: Star, color: "text-orange-400", bg: "bg-orange-500/20" },
    { key: "total_feedback_count" as const, label: "Geri Bildirim", icon: MessageSquarePlus, color: "text-pink-400", bg: "bg-pink-500/20" },
]

export function AdminHeroBanner({ profile, roleInfo, stats }: AdminHeroBannerProps) {
    const greeting = getGreeting()

    return (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 md:p-10 text-white shadow-2xl">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 -left-40 w-80 h-80 bg-indigo-500/30 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[150px]" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02]" />
            </div>

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-start justify-between gap-8">
                <div className="space-y-5 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                        <Badge className={`${roleInfo.badgeColor} backdrop-blur-xl border-white/10 px-3 py-1`}>
                            <ShieldCheck className="h-3 w-3 mr-1" />
                            {roleInfo.label}
                        </Badge>
                        <div className="flex items-center gap-2 text-white/50 text-sm">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                        </div>
                    </div>

                    <div>
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
                            {greeting}, <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">{profile?.first_name}</span> 👋
                        </h1>
                        <p className="text-white/60 mt-3 max-w-xl text-base md:text-lg">
                            EGL Yıllık yönetim panelinden sistemi kontrol edebilir, kullanıcıları yönetebilir ve içerikleri düzenleyebilirsin.
                        </p>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 pt-1">
                        {statItems.map((item) => {
                            const Icon = item.icon
                            const value = stats?.[item.key] ?? 0
                            return (
                                <div key={item.key} className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/5 hover:bg-white/10 transition-colors">
                                    <div className={`h-9 w-9 rounded-xl ${item.bg} flex items-center justify-center`}>
                                        <Icon className={`h-4 w-4 ${item.color}`} />
                                    </div>
                                    <p className="text-xl font-bold leading-none">{value}</p>
                                    <p className="text-[9px] text-white/50 uppercase tracking-wider text-center leading-tight">{item.label}</p>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 min-w-[200px] lg:pt-8">
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
    )
}
