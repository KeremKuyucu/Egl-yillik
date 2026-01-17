import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"
import { getColorFromName, FALLBACK_CATEGORIES, type SurveyCategory } from "@/lib/survey-categories"
import { getFullName, getInitials } from "@/lib/utils"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
    ArrowLeft,
    Trophy,
    Users,
    Vote,
    BarChart3,
    Crown,
    Medal
} from "lucide-react"

export default async function AdminSurveysPage() {
    await requireAdmin()

    const supabase = await createClient()

    // Kategorileri Supabase'den çek
    const { data: dbCategories } = await supabase
        .from("survey_categories")
        .select("*")
        .order("sort_order", { ascending: true })

    const categories: SurveyCategory[] = (dbCategories && dbCategories.length > 0)
        ? dbCategories
        : FALLBACK_CATEGORIES

    // Tüm oyları getir
    const { data: allVotes } = await supabase
        .from("survey_votes")
        .select(`
            id,
            category_id,
            voter:voter_id (
                id,
                first_name,
                last_name,
                class,
                school_number
            ),
            voted_for:voted_for_id (
                id,
                first_name,
                last_name,
                class,
                school_number
            )
        `)
        .order("category_id")

    // Tüm sınıfları getir
    const { data: allProfiles } = await supabase
        .from("profiles")
        .select("class")
        .order("class")

    const classes = [...new Set(allProfiles?.map(p => p.class) || [])]

    // Her kategori için sonuçları hesapla
    const categoryResults = categories.map(category => {
        const categoryVotes = allVotes?.filter(v => v.category_id === category.id) || []

        // Kişi bazında oy sayıları
        const personVoteCounts: Record<string, { profile: any, count: number }> = {}
        categoryVotes.forEach((vote: any) => {
            if (vote.voted_for) {
                const id = vote.voted_for.id
                if (!personVoteCounts[id]) {
                    personVoteCounts[id] = { profile: vote.voted_for, count: 0 }
                }
                personVoteCounts[id].count++
            }
        })

        // Sırala ve tüm sonuçları göster
        const topVoted = Object.values(personVoteCounts)
            .sort((a, b) => b.count - a.count)

        return {
            category,
            totalVotes: categoryVotes.length,
            topVoted
        }
    })

    // Genel istatistikler
    const totalVotes = allVotes?.length || 0
    const uniqueVoters = new Set(allVotes?.map((v: any) => v.voter?.id)).size
    const uniqueVotedFor = new Set(allVotes?.filter((v: any) => v.voted_for).map((v: any) => v.voted_for?.id)).size

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
            {/* Header */}
            <header className="border-b border-white/20 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl sticky top-0 z-50">
                <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
                    <div className="flex items-center gap-4">
                        <Link href="/admin" prefetch={false}>
                            <Button variant="ghost" size="sm" className="gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                <span className="hidden sm:inline">Admin Panel</span>
                            </Button>
                        </Link>
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg text-white">
                                <Vote className="h-5 w-5" />
                            </div>
                            <h1 className="text-lg font-bold text-slate-800 dark:text-white">Anket Sonuçları</h1>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 sm:px-6 py-8">
                {/* Genel İstatistikler */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-lg">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400">
                                <BarChart3 className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Toplam Oy</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalVotes}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-lg">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                                <Users className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Oy Kullanan</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{uniqueVoters}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-lg">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400">
                                <Trophy className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Oy Alan</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{uniqueVotedFor}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Kategori Sonuçları */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {categoryResults.map(({ category, totalVotes, topVoted }) => (
                        <div
                            key={category.id}
                            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden"
                        >
                            {/* Kategori Header */}
                            <div className={`p-4 bg-gradient-to-r ${category.color} text-white`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl">{category.emoji}</span>
                                        <div>
                                            <h3 className="font-bold text-lg">{category.title}</h3>
                                            <p className="text-white/80 text-sm">{category.description}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold">{totalVotes}</p>
                                        <p className="text-xs text-white/80">oy</p>
                                    </div>
                                </div>
                            </div>

                            {/* Lider Tablosu */}
                            <div className="p-4 space-y-4">
                                {topVoted.length > 0 ? (
                                    <div>
                                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
                                            <Users className="h-3 w-3" />
                                            En Çok Oy Alan Kişiler
                                        </p>
                                        <div className="space-y-2">
                                            {topVoted.map((item, index) => (
                                                <div
                                                    key={item.profile.id}
                                                    className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                                >
                                                    {/* Sıralama */}
                                                    <div className="w-6 text-center">
                                                        {index === 0 && <Crown className="h-5 w-5 text-amber-500 mx-auto" />}
                                                        {index === 1 && <Medal className="h-4 w-4 text-slate-400 mx-auto" />}
                                                        {index === 2 && <Medal className="h-4 w-4 text-amber-700 mx-auto" />}
                                                        {index > 2 && <span className="text-xs font-bold text-slate-400">{index + 1}</span>}
                                                    </div>

                                                    {/* Avatar */}
                                                    <Link href={`/profile/${item.profile.school_number}`} prefetch={false}>
                                                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold shadow-sm ${getColorFromName(item.profile.first_name)} hover:scale-105 transition-transform`}>
                                                            {getInitials(item.profile.first_name, item.profile.last_name)}
                                                        </div>
                                                    </Link>

                                                    {/* İsim */}
                                                    <div className="flex-1 min-w-0">
                                                        <Link href={`/profile/${item.profile.school_number}`} prefetch={false} className="hover:text-purple-600 transition-colors">
                                                            <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                                                                {getFullName(item.profile.first_name, item.profile.last_name)}
                                                            </p>
                                                        </Link>
                                                        <p className="text-xs text-slate-500">{item.profile.class}</p>
                                                    </div>

                                                    {/* Oy Sayısı */}
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r ${category.color} text-white`}>
                                                        {item.count} oy
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-6 text-slate-400">
                                        <Vote className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">Henüz oy yok</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    )
}
