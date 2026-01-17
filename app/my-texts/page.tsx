import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getFullName } from "@/lib/utils"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import Footer from "@/components/footer"
import DashboardGrid from "@/components/dashboard-grid"
import { ArrowLeft, PenLine, FileText, Plus } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function MyTextsPage() {
    const supabase = await createClient()

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
        redirect("/login")
    }

    const { data: userProfile } = await supabase
        .from("profiles")
        .select("first_name, last_name, class, school_number")
        .eq("id", user.id)
        .single()

    if (!userProfile) {
        redirect("/complete-profile")
    }

    // Tüm yazdığı anıları getir
    const { data: texts, error: textsError } = await supabase
        .from("texts")
        .select(`
      *,
      recipient_profile:recipient_id (
        first_name,
        last_name,
        class,
        school_number
      )
    `)
        .eq("author_id", user.id)
        .order("updated_at", { ascending: false })

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-indigo-950 dark:to-purple-950 text-foreground transition-colors duration-300">
            {/* Background */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" />
                <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000" />
            </div>

            {/* Header */}
            <header className="border-b border-indigo-100/50 dark:border-indigo-900/30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl sticky top-0 z-50 shadow-sm">
                <div className="container mx-auto flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6">
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard" prefetch={false}>
                            <Button variant="ghost" size="sm" className="gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                <span className="hidden sm:inline">Geri Dön</span>
                            </Button>
                        </Link>
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg text-white">
                                <PenLine className="h-5 w-5" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-slate-800 dark:text-white">Yazdığım Anılar</h1>
                                <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                                    {texts?.length || 0} anı yazdın
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href="/new" prefetch={false}>
                            <Button size="sm" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-purple-500/30">
                                <Plus className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">Yeni Anı</span>
                            </Button>
                        </Link>
                        <ModeToggle />
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 sm:px-6 py-8">
                {/* @ts-ignore */}
                <DashboardGrid texts={texts || []} />
            </main>

            <Footer />
        </div>
    )
}
