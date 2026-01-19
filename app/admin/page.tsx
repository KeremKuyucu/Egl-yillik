import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"
import { AdminOverviewCards } from "@/components/admin-overview-cards"

import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function AdminDashboardPage() {
    const supabase = await createClient()

    const { profile: currentProfile } = await requireAdmin();

    // Paralel veri çekme
    const [pendingSuggestionsResult] = await Promise.all([
        supabase
            .from("user_category_suggestions")
            .select("*", { count: "exact", head: true })
            .eq("status", "pending")
    ])

    const pendingSuggestionsCount = pendingSuggestionsResult.count || 0



    return (
        <div className="space-y-8 py-4 md:py-12">
            <div className="text-center max-w-2xl mx-auto space-y-4">
                <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-800 dark:text-slate-100 drop-shadow-sm">
                    Hoş Geldin, <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">{currentProfile?.first_name}</span>
                </h2>
                <p className="text-slate-500 dark:text-slate-400">
                    Sistem yönetimi ve istatistiklerine hızlı bakış
                </p>
            </div>

            <div className="w-full max-w-6xl mx-auto px-2 md:px-0">
                <AdminOverviewCards
                    pendingSuggestionsCount={pendingSuggestionsCount}
                    currentUserLevel={currentProfile.level}
                />
            </div>

            <div className="pt-8 text-center text-xs font-medium text-slate-400 dark:text-slate-600">
                <p>EGL Yıllık Yönetim Sistemi &copy; {new Date().getFullYear()} • v2.0</p>
            </div>
        </div>
    )
}
