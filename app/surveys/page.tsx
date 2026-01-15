import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { FALLBACK_CATEGORIES, type SurveyCategory } from "@/lib/survey-categories"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import Footer from "@/components/footer"
import {
    ArrowLeft,
    Vote,
    Trophy,
    CheckCircle2,
    Sparkles,
    PlusCircle
} from "lucide-react"

export default async function SurveysPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login")

    // Kategorileri Supabase'den çek
    const { data: dbCategories } = await supabase
        .from("survey_categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })

    // Supabase'den veri geldiyse onu kullan, yoksa fallback
    const categories: SurveyCategory[] = (dbCategories && dbCategories.length > 0)
        ? dbCategories
        : FALLBACK_CATEGORIES

    // Kullanıcının daha önce oy verdiği kategoriler
    const { data: myVotes } = await supabase
        .from("survey_votes")
        .select("category_id")
        .eq("voter_id", user.id)

    const votedCategories = new Set(myVotes?.map(v => v.category_id) || [])
    const totalCategories = categories.length
    const completedCount = votedCategories.size
    const progressPercentage = Math.round((completedCount / totalCategories) * 100)

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
                    <Link href="/dashboard">
                        <Button variant="ghost" size="sm" className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            <span className="hidden sm:inline">Dashboard</span>
                        </Button>
                    </Link>

                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg text-white">
                            <Vote className="h-5 w-5" />
                        </div>
                        <span className="text-lg font-bold font-serif bg-gradient-to-r from-purple-700 to-pink-700 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                            Anketler
                        </span>
                    </div>

                    <ModeToggle />
                </div>
            </header>

            <main className="container mx-auto px-4 sm:px-6 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                {/* Hero Section */}
                <div className="max-w-4xl mx-auto mb-10">
                    <div className="relative overflow-hidden rounded-3xl border border-white/50 dark:border-slate-700/50 bg-white/90 dark:bg-slate-900/90 shadow-2xl backdrop-blur-2xl p-6 sm:p-8">

                        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-pink-50/50 to-orange-50/50 dark:from-purple-950/30 dark:via-pink-950/30 dark:to-orange-950/30 pointer-events-none" />

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl text-white shadow-lg shadow-purple-500/30">
                                    <Trophy className="h-6 w-6" />
                                </div>
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 dark:text-white">
                                        Sınıf Anketleri
                                    </h1>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        Arkadaşlarına oy ver, yıllığı daha eğlenceli hale getir!
                                    </p>
                                </div>
                            </div>

                            {/* İlerleme */}
                            <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Anketi Tamamla</span>
                                    <span className="text-sm font-bold text-purple-600 dark:text-purple-400">{completedCount}/{totalCategories}</span>
                                </div>
                                <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                                        style={{ width: `${progressPercentage}%` }}
                                    />
                                </div>
                                {completedCount === totalCategories && (
                                    <p className="text-xs text-center text-emerald-600 dark:text-emerald-400 mt-2 font-medium flex items-center justify-center gap-1">
                                        <Sparkles className="h-3 w-3" />
                                        Tebrikler! Tüm anketleri tamamladın!
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Anket Kategorileri Grid */}
                <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((category) => {
                        const isVoted = votedCategories.has(category.id)

                        return (
                            <Link
                                key={category.id}
                                href={`/surveys/${category.id}`}
                                className="group"
                            >
                                <div className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${isVoted
                                    ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20'
                                    : 'border-white/50 dark:border-slate-700/50 bg-white/90 dark:bg-slate-900/90 hover:shadow-xl hover:scale-[1.02]'
                                    } shadow-lg backdrop-blur-xl p-5`}
                                >
                                    {/* Emoji Arka Plan */}
                                    <div className="absolute -right-4 -bottom-4 text-7xl opacity-10 group-hover:opacity-20 transition-opacity">
                                        {category.emoji}
                                    </div>

                                    <div className="relative z-10">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className={`text-4xl p-2 rounded-xl bg-gradient-to-br ${category.color} shadow-lg`}>
                                                {category.emoji}
                                            </div>
                                            {isVoted && (
                                                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400">
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                    <span className="text-xs font-medium">Oylandı</span>
                                                </div>
                                            )}
                                        </div>

                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                                            {category.title}
                                        </h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            {category.description}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        )
                    })}

                    {/* Kendin Ekle Kartı */}
                    <Link href="/surveys/add-custom" className="group">
                        <div className="relative overflow-hidden rounded-2xl border border-dashed border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-950/20 hover:bg-purple-100/50 dark:hover:bg-purple-950/40 hover:border-purple-400 dark:hover:border-purple-600 transition-all duration-300 shadow-lg backdrop-blur-xl p-5 h-full min-h-[160px] flex flex-col items-center justify-center text-center">

                            {/* Arka Plan Animasyonu */}
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-200/20 via-pink-200/20 to-orange-200/20 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-orange-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <div className="relative z-10 flex flex-col items-center">
                                <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30 mb-3 group-hover:scale-110 transition-transform duration-300">
                                    <PlusCircle className="h-7 w-7" />
                                </div>
                                <h3 className="text-lg font-bold text-purple-700 dark:text-purple-300 mb-1">
                                    Kendin Ekle
                                </h3>
                                <p className="text-sm text-purple-600/80 dark:text-purple-400/80">
                                    Yeni kategori öner veya özel seçenek ekle
                                </p>
                            </div>
                        </div>
                    </Link>
                </div>

            </main>

            <Footer />
        </div>
    )
}
