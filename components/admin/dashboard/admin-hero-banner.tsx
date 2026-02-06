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
    ArrowRight
} from "lucide-react"
import Link from "next/link"

interface AdminHeroBannerProps {
    profile: { first_name: string } | null
    roleInfo: { label: string; badgeColor: string }
    stats: { users_count?: number; texts_count?: number; votes_count?: number } | null
}

export function AdminHeroBanner({ profile, roleInfo, stats }: AdminHeroBannerProps) {
    return (
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
    )
}
