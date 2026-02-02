import { createClient } from "@/lib/supabase/server"
import { requireSuperAdmin } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Vote, Trophy, Users, BarChart3, TrendingUp, Medal, Award, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Profile {
    id: string
    first_name: string
    last_name: string
    school_number: string
    class: string
    user_year: number
}

interface Category {
    id: string
    title: string
    emoji: string
    color: string
}

interface CategorySummary {
    category_id: string
    title: string
    emoji: string
    color: string
    total_votes: number
}

interface TopVoted {
    profile: Profile
    category: Category
    vote_count: number
}

interface VotesData {
    summary: CategorySummary[]
    top_voted: TopVoted[]
    stats: {
        total_votes: number
        total_voters: number
        total_categories: number
    }
}

export default async function AdminVotesPage() {
    await requireSuperAdmin()
    const supabase = await createClient()


    const { data, error } = await supabase.rpc('get_admin_votes')

    if (error) {
        console.error("Votes fetch error:", error)
        return (
            <div className="flex items-center justify-center min-h-[400px] p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Hata Oluştu</CardTitle>
                        <CardDescription>
                            Veriler yüklenirken bir sorun oluştu. Lütfen sayfayı yenileyin.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    const votesData = data as VotesData

    // Kategorilere göre en çok oy alanları grupla
    const groupedByCategory: Record<string, TopVoted[]> = {}
    votesData.top_voted.forEach(item => {
        const catId = item.category.id
        if (!groupedByCategory[catId]) {
            groupedByCategory[catId] = []
        }
        groupedByCategory[catId].push(item)
    })

    // Her kategoriden en fazla 3 kişi al
    Object.keys(groupedByCategory).forEach(catId => {
        groupedByCategory[catId] = groupedByCategory[catId]
            .sort((a, b) => b.vote_count - a.vote_count)
            .slice(0, 3)
    })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600 p-6 sm:p-8 text-white shadow-2xl shadow-violet-500/25">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />

                <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                            <Vote className="h-7 w-7" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold">Anket Sonuçları</h1>
                            <p className="text-white/80 text-sm mt-1">
                                Tüm kategorilerdeki oy dağılımları
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats in Header */}
                <div className="relative grid grid-cols-3 gap-2 sm:gap-4 mt-6">
                    <div className="p-3 sm:p-4 rounded-xl bg-white/20 backdrop-blur-sm text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <BarChart3 className="h-4 w-4" />
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold">{votesData.stats.total_votes}</p>
                        <p className="text-[10px] sm:text-xs text-white/80">Toplam Oy</p>
                    </div>
                    <div className="p-3 sm:p-4 rounded-xl bg-white/20 backdrop-blur-sm text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <Users className="h-4 w-4" />
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold">{votesData.stats.total_voters}</p>
                        <p className="text-[10px] sm:text-xs text-white/80">Oy Kullanan</p>
                    </div>
                    <div className="p-3 sm:p-4 rounded-xl bg-white/20 backdrop-blur-sm text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <TrendingUp className="h-4 w-4" />
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold">{votesData.stats.total_categories}</p>
                        <p className="text-[10px] sm:text-xs text-white/80">Aktif Kategori</p>
                    </div>
                </div>
            </div>

            {/* Categories Overview */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {votesData.summary.map((category, index) => (
                    <Card
                        key={category.category_id}
                        className="border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group"
                    >
                        <div
                            className="h-1 w-full"
                            style={{ backgroundColor: category.color || '#6366f1' }}
                        />
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">{category.emoji}</span>
                                    <div>
                                        <h3 className="font-bold text-slate-800 dark:text-slate-200">
                                            {category.title}
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            {category.total_votes} oy
                                        </p>
                                    </div>
                                </div>
                                {index === 0 && category.total_votes > 0 && (
                                    <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-0">
                                        <Trophy className="h-3 w-3 mr-1" />
                                        En Popüler
                                    </Badge>
                                )}
                            </div>

                            {/* Top 3 for this category */}
                            {groupedByCategory[category.category_id]?.length > 0 ? (
                                <div className="space-y-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    {groupedByCategory[category.category_id].map((item, idx) => {
                                        const initials = `${item.profile.first_name[0]}${item.profile.last_name[0]}`.toUpperCase()
                                        const MedalIcon = idx === 0 ? Trophy : idx === 1 ? Medal : Award
                                        const medalColors = [
                                            'text-amber-500',
                                            'text-slate-400',
                                            'text-orange-600'
                                        ]

                                        return (
                                            <Link
                                                key={item.profile.id}
                                                href={`/profile/${item.profile.user_year}/${item.profile.school_number}`}
                                                className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group/item"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="relative">
                                                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                                            {initials}
                                                        </div>
                                                        <MedalIcon className={`absolute -top-1 -right-1 h-4 w-4 ${medalColors[idx]}`} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover/item:text-indigo-600 dark:group-hover/item:text-indigo-400 transition-colors">
                                                            {item.profile.first_name} {item.profile.last_name}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground">
                                                            {item.profile.class}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Badge variant="secondary" className="text-xs">
                                                    {item.vote_count} oy
                                                </Badge>
                                            </Link>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <p className="text-sm text-muted-foreground text-center py-2">
                                        Henüz oy yok
                                    </p>
                                </div>
                            )}

                            {/* View Details Button */}
                            <Link href={`/admin/votes/${category.category_id}`} className="block mt-4">
                                <Button
                                    variant="ghost"
                                    className="w-full justify-between text-xs h-9 hover:bg-slate-100 dark:hover:bg-slate-800"
                                    style={{ color: category.color || '#6366f1' }}
                                >
                                    Detayları Gör
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {votesData.summary.length === 0 && (
                <Card className="border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xl">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="h-20 w-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
                            <Vote className="h-10 w-10 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                            Henüz kategori yok
                        </h3>
                        <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                            Anket kategorileri oluşturulduktan sonra oy sonuçları burada görünecek.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
