import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
    Vote,
    Trophy,
    Users,
    BarChart3,
    TrendingUp,
    Medal,
    Award,
    ArrowLeft,
    Clock,
    ChevronRight,
    Percent,
    Crown,
    Target,
    List,
    ArrowRight
} from "lucide-react"
import { notFound } from "next/navigation"

interface Profile {
    id: string
    first_name: string
    last_name: string
    school_number: string
    class: string
    user_year?: number
}

interface Category {
    id: string
    title: string
    emoji: string
    color: string
    is_active: boolean
}

interface RankingItem {
    rank: number
    profile: Profile & { user_year: number }
    vote_count: number
    percentage: number
}

interface ClassBreakdown {
    class: string
    vote_count: number
}

interface VoteDetail {
    voter: Profile
    voted_for: Profile
    created_at: string
}

interface CategoryVotesData {
    category: Category
    stats: {
        total_votes: number
        unique_voters: number
        unique_voted_for: number
    }
    rankings: RankingItem[]
    class_breakdown: ClassBreakdown[]
    all_votes: VoteDetail[]
}

export default async function AdminCategoryVotesPage({
    params
}: {
    params: Promise<{ categoryId: string }>
}) {
    const { categoryId } = await params
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('get_admin_category_votes', {
        p_category_id: categoryId
    })

    if (error) {
        console.error("Category votes fetch error:", error)
        if (error.message.includes('bulunamadı')) {
            notFound()
        }
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

    const votesData = data as CategoryVotesData
    const { category, stats, rankings, class_breakdown, all_votes } = votesData

    // En yüksek oyu hesapla (progress bar için)
    const maxVotes = rankings.length > 0 ? rankings[0].vote_count : 1

    return (
        <div className="space-y-6">
            {/* Back Button & Header */}
            <div className="flex items-center gap-4 mb-2">
                <Button variant="ghost" size="sm" asChild className="gap-2">
                    <Link href="/admin/votes">
                        <ArrowLeft className="h-4 w-4" />
                        Geri
                    </Link>
                </Button>
            </div>

            {/* Header */}
            <div
                className="relative overflow-hidden rounded-2xl p-6 sm:p-8 text-white shadow-2xl"
                style={{
                    background: `linear-gradient(135deg, ${category.color || '#6366f1'} 0%, ${category.color || '#6366f1'}dd 50%, ${category.color || '#6366f1'}aa 100%)`
                }}
            >
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-black/10 rounded-full blur-3xl" />

                <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg text-4xl">
                            {category.emoji}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-2xl sm:text-3xl font-bold">{category.title}</h1>
                                {!category.is_active && (
                                    <Badge variant="secondary" className="bg-white/20 text-white border-0">
                                        Pasif
                                    </Badge>
                                )}
                            </div>
                            <p className="text-white/80 text-sm">
                                Bu kategorideki tüm oyların detaylı analizi
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="relative grid grid-cols-3 gap-2 sm:gap-4 mt-6">
                    <div className="p-3 sm:p-4 rounded-xl bg-white/20 backdrop-blur-sm text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <BarChart3 className="h-4 w-4" />
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold">{stats.total_votes}</p>
                        <p className="text-[10px] sm:text-xs text-white/80">Toplam Oy</p>
                    </div>
                    <div className="p-3 sm:p-4 rounded-xl bg-white/20 backdrop-blur-sm text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <Users className="h-4 w-4" />
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold">{stats.unique_voters}</p>
                        <p className="text-[10px] sm:text-xs text-white/80">Oy Kullanan</p>
                    </div>
                    <div className="p-3 sm:p-4 rounded-xl bg-white/20 backdrop-blur-sm text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <Target className="h-4 w-4" />
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold">{stats.unique_voted_for}</p>
                        <p className="text-[10px] sm:text-xs text-white/80">Oy Alan Kişi</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Rankings - Full List */}
                <div className="lg:col-span-2">
                    <Card className="border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xl">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <Crown className="h-5 w-5 text-amber-500" />
                                    Sıralama
                                </CardTitle>
                                <Badge variant="outline" className="text-xs">
                                    {rankings.length} kişi
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {rankings.length > 0 ? (
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {rankings.map((item, idx) => {
                                        const initials = `${item.profile.first_name[0]}${item.profile.last_name[0]}`.toUpperCase()
                                        const MedalIcon = idx === 0 ? Trophy : idx === 1 ? Medal : idx === 2 ? Award : null
                                        const medalColors = ['text-amber-500', 'text-slate-400', 'text-orange-600']
                                        const bgColors = [
                                            'bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30',
                                            'bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-950/30 dark:to-gray-950/30',
                                            'bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30'
                                        ]
                                        const progressWidth = (item.vote_count / maxVotes) * 100

                                        return (
                                            <div
                                                key={item.profile.id}
                                                className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${idx < 3 ? bgColors[idx] : ''}`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    {/* Rank */}
                                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-sm">
                                                        {MedalIcon ? (
                                                            <MedalIcon className={`h-5 w-5 ${medalColors[idx]}`} />
                                                        ) : (
                                                            <span className="text-muted-foreground">{item.rank}</span>
                                                        )}
                                                    </div>

                                                    {/* Avatar */}
                                                    <Link
                                                        href={`/profile/${item.profile.user_year}/${item.profile.school_number}`}
                                                        className="flex-shrink-0"
                                                    >
                                                        <div
                                                            className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                                                            style={{ backgroundColor: category.color || '#6366f1' }}
                                                        >
                                                            {initials}
                                                        </div>
                                                    </Link>

                                                    {/* Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <Link
                                                            href={`/profile/${item.profile.user_year}/${item.profile.school_number}`}
                                                            className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                                        >
                                                            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                                                {item.profile.first_name} {item.profile.last_name}
                                                            </p>
                                                        </Link>
                                                        <p className="text-xs text-muted-foreground">
                                                            {item.profile.class}
                                                        </p>
                                                        {/* Progress Bar */}
                                                        <div className="mt-2 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full rounded-full transition-all duration-500"
                                                                style={{
                                                                    width: `${progressWidth}%`,
                                                                    backgroundColor: category.color || '#6366f1'
                                                                }}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Vote Count */}
                                                    <div className="flex-shrink-0 text-right">
                                                        <p className="font-bold text-lg" style={{ color: category.color || '#6366f1' }}>
                                                            {item.vote_count}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground flex items-center justify-end gap-1">
                                                            <Percent className="h-3 w-3" />
                                                            {item.percentage}%
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="p-12 text-center">
                                    <Vote className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                                    <p className="text-muted-foreground">Bu kategoride henüz oy yok</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Class Breakdown */}
                    <Card className="border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xl">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-blue-500" />
                                Sınıf Dağılımı
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {class_breakdown.length > 0 ? (
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {class_breakdown.map((item, idx) => {
                                        const maxClassVotes = class_breakdown[0]?.vote_count || 1
                                        const progressWidth = (item.vote_count / maxClassVotes) * 100

                                        return (
                                            <div key={item.class} className="p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-semibold text-sm">{item.class}</span>
                                                    <Badge variant="secondary" className="text-xs">
                                                        {item.vote_count} oy
                                                    </Badge>
                                                </div>
                                                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full transition-all duration-500"
                                                        style={{
                                                            width: `${progressWidth}%`,
                                                            backgroundColor: category.color || '#6366f1'
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-sm text-muted-foreground">
                                    Veri yok
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Votes Preview */}
                    <Card className="border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xl">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <Clock className="h-4 w-4 text-green-500" />
                                Son Oylar
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {all_votes.length > 0 ? (
                                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[300px] overflow-y-auto">
                                    {all_votes.slice(0, 10).map((vote, idx) => (
                                        <div key={idx} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <div className="flex items-center gap-2 text-xs">
                                                <span className="font-medium text-slate-600 dark:text-slate-400">
                                                    {vote.voter.first_name} {vote.voter.last_name[0]}.
                                                </span>
                                                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                                <span className="font-semibold" style={{ color: category.color || '#6366f1' }}>
                                                    {vote.voted_for.first_name} {vote.voted_for.last_name}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground mt-1">
                                                {new Date(vote.created_at).toLocaleString('tr-TR', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-sm text-muted-foreground">
                                    Henüz oy yok
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* All Votes Detail Table */}
            <Card className="border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xl">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <List className="h-5 w-5" style={{ color: category.color || '#6366f1' }} />
                            Tüm Oylar (Detaylı)
                        </CardTitle>
                        <Badge variant="outline" className="text-xs">
                            {all_votes.length} oy
                        </Badge>
                    </div>
                    <CardDescription>
                        Kim kime oy verdi - tüm detaylar
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {all_votes.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                                        <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">#</th>
                                        <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Oy Veren</th>
                                        <th className="text-center p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground"></th>
                                        <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Oy Alan</th>
                                        <th className="text-right p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Tarih</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {all_votes.map((vote, idx) => {
                                        const voterInitials = `${vote.voter.first_name[0]}${vote.voter.last_name[0]}`.toUpperCase()
                                        const votedForInitials = `${vote.voted_for.first_name[0]}${vote.voted_for.last_name[0]}`.toUpperCase()

                                        return (
                                            <tr
                                                key={idx}
                                                className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                            >
                                                <td className="p-4 text-sm text-muted-foreground font-mono">
                                                    {idx + 1}
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                                                            {voterInitials}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-sm text-slate-700 dark:text-slate-300">
                                                                {vote.voter.first_name} {vote.voter.last_name}
                                                            </p>
                                                            <p className="text-[10px] text-muted-foreground">
                                                                {vote.voter.class}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <div
                                                        className="inline-flex items-center justify-center h-8 w-8 rounded-full"
                                                        style={{ backgroundColor: `${category.color}20` || '#6366f120' }}
                                                    >
                                                        <ArrowRight
                                                            className="h-4 w-4"
                                                            style={{ color: category.color || '#6366f1' }}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                                            style={{ backgroundColor: category.color || '#6366f1' }}
                                                        >
                                                            {votedForInitials}
                                                        </div>
                                                        <div>
                                                            <p
                                                                className="font-semibold text-sm"
                                                                style={{ color: category.color || '#6366f1' }}
                                                            >
                                                                {vote.voted_for.first_name} {vote.voted_for.last_name}
                                                            </p>
                                                            <p className="text-[10px] text-muted-foreground">
                                                                {vote.voted_for.class}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(vote.created_at).toLocaleDateString('tr-TR', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric'
                                                        })}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground">
                                                        {new Date(vote.created_at).toLocaleTimeString('tr-TR', {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-12 text-center">
                            <Vote className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                            <p className="text-muted-foreground">Bu kategoride henüz oy yok</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
