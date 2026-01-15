import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { type SurveyCategory } from "@/lib/survey-categories"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import Footer from "@/components/footer"
import AddCustomOptionForm from "./client"
import {
    ArrowLeft,
    Sparkles,
    Lightbulb
} from "lucide-react"

export default async function AddCustomPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login")

    // Kullanıcı profilini al
    const { data: profile } = await supabase
        .from("profiles")
        .select("class")
        .eq("id", user.id)
        .single()

    // Aktif kategorileri çek
    const { data: categories } = await supabase
        .from("survey_categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })

    // Kullanıcının kendi sınıfı
    const userClass = profile?.class || ""

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-indigo-950 dark:to-purple-950 text-foreground transition-colors duration-300">

            {/* Animated Background */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" />
                <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000" />
                <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000" />
            </div>

            {/* Header */}
            <header className="border-b border-indigo-100/50 dark:border-indigo-900/30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl sticky top-0 z-50 shadow-sm">
                <div className="container mx-auto flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6">
                    <Link href="/surveys">
                        <Button variant="ghost" size="sm" className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            <span className="hidden sm:inline">Anketler</span>
                        </Button>
                    </Link>

                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg text-white">
                            <Sparkles className="h-5 w-5" />
                        </div>
                        <span className="text-lg font-bold font-serif bg-gradient-to-r from-purple-700 to-pink-700 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                            Özel Seçenek Ekle
                        </span>
                    </div>

                    <ModeToggle />
                </div>
            </header>

            <main className="container mx-auto px-4 sm:px-6 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                <div className="max-w-2xl mx-auto">
                    {/* Info Card */}
                    <div className="relative overflow-hidden rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 shadow-lg backdrop-blur-xl p-6 mb-8">
                        <div className="absolute -right-8 -bottom-8 text-amber-200/30 dark:text-amber-900/30">
                            <Lightbulb className="h-32 w-32" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-xl text-amber-600 dark:text-amber-400">
                                    <Lightbulb className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-amber-800 dark:text-amber-200 mb-1">
                                        Özel Seçenek Nasıl Çalışır?
                                    </h2>
                                    <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                                        <li>• Bir kategori seçin (örn: "En Komik")</li>
                                        <li>• Sınıf arkadaşlarınız listede yoksa yeni isim ekleyin</li>
                                        <li>• Eklediğiniz seçenek sadece sizin sınıfınızda görünür</li>
                                        <li>• Admin onayı gerekmez, hemen eklenır</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form Card */}
                    <div className="relative overflow-hidden rounded-2xl border border-white/50 dark:border-slate-700/50 bg-white/90 dark:bg-slate-900/90 shadow-2xl backdrop-blur-2xl p-6 sm:p-8">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 via-pink-50/30 to-orange-50/30 dark:from-purple-950/20 dark:via-pink-950/20 dark:to-orange-950/20 pointer-events-none" />

                        <div className="relative z-10">
                            <h1 className="text-2xl font-bold font-serif text-slate-900 dark:text-white mb-6">
                                Yeni Özel Seçenek Ekle
                            </h1>

                            <AddCustomOptionForm
                                categories={(categories || []) as SurveyCategory[]}
                                userClass={userClass}
                            />
                        </div>
                    </div>
                </div>

            </main>

            <Footer />
        </div>
    )
}
