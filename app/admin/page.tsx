import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"
import { getLevelInfo } from "@/lib/constants"
import {
    Shield,
    Sparkles,
    LayoutDashboard
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AdminOverviewCards } from "@/components/admin-overview-cards"

export default async function AdminDashboardPage() {
    const supabase = await createClient()

    const { profile: currentProfile } = await requireAdmin();

    const { data: stats, error } = await supabase.rpc('get_admin_dashboard_stats')

    if (error) {
        console.error("İstatistik hatası:", error)
    }

    const usersCount = stats?.users || 0
    const textsCount = stats?.texts || 0

    // Bekleyen öneri sayısını çek
    const { count: pendingSuggestionsCount } = await supabase
        .from("user_category_suggestions")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending")

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex flex-col">
            {/* Animated Background */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-blob" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-blob animation-delay-2000" />
            </div>

            {/* Header */}
            <header className="border-b border-white/20 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl sticky top-0 z-50">
                <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 text-white shadow-lg shadow-slate-900/20">
                            <Shield className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent font-serif leading-none">
                                {currentProfile ? `${getLevelInfo(currentProfile.level).label} Paneli` : "Yönetim Paneli"}
                            </h1>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5 flex items-center gap-1">
                                <Sparkles className="h-2.5 w-2.5 text-amber-500" />
                                Merkezi Yönetim
                            </p>
                        </div>
                    </div>
                    <Link href="/dashboard">
                        <Button variant="outline" size="sm" className="gap-2">
                            <LayoutDashboard className="h-4 w-4" />
                            <span className="hidden sm:inline">Öğrenci Görünümü</span>
                        </Button>
                    </Link>
                </div>
            </header>

            <main className="flex-1 container mx-auto p-4 sm:p-8 flex flex-col items-center justify-center gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                <div className="text-center max-w-2xl mx-auto space-y-4">
                    <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-800 dark:text-slate-100">
                        Hoş Geldiniz, <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">{currentProfile?.first_name}</span>
                    </h2>
                    <p className="text-lg text-slate-600 dark:text-slate-400">
                        Bugün neyi yönetmek istersiniz? Aşağıdaki panellerden birini seçerek başlayın.
                    </p>
                </div>

                <AdminOverviewCards
                    usersCount={usersCount || 0}
                    textsCount={textsCount || 0}
                    pendingSuggestionsCount={pendingSuggestionsCount || 0}
                    currentUserLevel={currentProfile.level}
                />

                <div className="mt-8 text-center text-sm text-muted-foreground">
                    <p>EGL Yıllık Yönetim Sistemi &copy; {new Date().getFullYear()}</p>
                </div>

            </main>
        </div>
    )
}
