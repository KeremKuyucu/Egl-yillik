import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"
import { AdminOverviewCards } from "@/components/admin-overview-cards"
import AdminHeader from "@/components/admin/admin-header"
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

    const handleSignOut = async () => {
        "use server"
        const supabase = await createClient()
        await supabase.auth.signOut()
        redirect("/login")
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex flex-col font-sans">
            {/* Animated Background */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-blob" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-blob animation-delay-2000" />
            </div>

            <AdminHeader currentProfile={currentProfile} signOut={handleSignOut} />

            <main className="flex-1 container mx-auto p-4 sm:p-8 flex flex-col items-center justify-center gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                <div className="text-center max-w-2xl mx-auto space-y-4">
                    <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-800 dark:text-slate-100 drop-shadow-sm">
                        Hoş Geldin, <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">{currentProfile?.first_name}</span>
                    </h2>
                </div>

                <div className="w-full max-w-5xl mx-auto">
                    <AdminOverviewCards
                        pendingSuggestionsCount={pendingSuggestionsCount}
                        currentUserLevel={currentProfile.level}
                    />
                </div>

                <div className="mt-auto pt-8 text-center text-xs font-medium text-slate-400 dark:text-slate-600">
                    <p>EGL Yıllık Yönetim Sistemi &copy; {new Date().getFullYear()} • v2.0</p>
                </div>

            </main>
        </div>
    )
}
