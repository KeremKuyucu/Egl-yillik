import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { getFullName, getInitials } from "@/lib/utils"
import { getColorFromName, getCategoryById } from "@/lib/survey-categories"
import { getLevelInfo, ROLES } from "@/lib/constants"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ModeToggle } from "@/components/mode-toggle"
import Footer from "@/components/footer"
import {
    ArrowLeft, FileText, Award, Users, Sparkles, Star, Zap, Heart, PenLine, Trophy, BarChart3, Gift, Shield, Lock, Clock, Quote
} from "lucide-react"
import CollapsibleCategories from "@/components/profile/collapsible-categories"

const getBadge = (count: number) => {
    if (count >= 30) return { label: "Yıllık Efsanesi", color: "bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 shadow-lg shadow-purple-500/40", icon: <Star className="h-3 w-3 mr-1" suppressHydrationWarning /> }
    if (count >= 15) return { label: "Hatıra Mimarı", color: "bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0 shadow-lg shadow-amber-500/40", icon: <Zap className="h-3 w-3 mr-1" suppressHydrationWarning /> }
    if (count >= 5) return { label: "Anı Yazarı", color: "bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-0 shadow-lg shadow-blue-500/40", icon: <Heart className="h-3 w-3 mr-1" suppressHydrationWarning /> }
    return { label: "Yeni Üye", color: "bg-gradient-to-r from-slate-500 to-slate-600 text-white border-0 shadow-md", icon: <Sparkles className="h-3 w-3 mr-1" suppressHydrationWarning /> }
}

interface ProfilePageProps {
    params: Promise<{ schoolNumber: string }>
}

export default async function ProfilePage({ params }: ProfilePageProps) {
    const { schoolNumber } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login")

    // Tek bir RPC çağrısı ile tüm profil verilerini ve istatistikleri al
    const { data: stats, error: statsError } = await supabase.rpc('get_profile_page_data', {
        target_school_number: schoolNumber
    })

    // Profil bulunamazsa 404
    if (statsError || !stats || !stats.profile) {
        console.error("Profil yükleme hatası:", statsError)
        notFound()
    }

    const { profile, receivedCount = 0, writtenCount = 0, totalVotes = 0 } = stats
    const userBadge = getBadge(writtenCount)

    const isOwnProfile = user.id === profile.id

    // Açılma tarihi kontrolü (26 Haziran 2026)
    const unlockDate = new Date(2026, 5, 26)
    const now = new Date()
    const isUnlocked = now >= unlockDate
    const daysUntilUnlock = Math.max(0, Math.ceil((unlockDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    const canViewMemories = isUnlocked

    let memories = []
    let allCategoriesWithVotes: any[] = []
    let topCategories: any[] = []
    let totalVotesForMemories = 0

    if (canViewMemories) {
        // Anıları getir
        const { data: fetchedMemories } = await supabase
            .from("texts")
            .select(`
                *,
                author:author_id (
                    first_name,
                    last_name,
                    school_number,
                    class
                )
            `)
            .eq("recipient_id", profile.id)
            .order("created_at", { ascending: false })

        memories = fetchedMemories || []

        // Anket oylamaları
        const { data: classVoteStats } = await supabase
            .from("profile_vote_summary")
            .select("category_id, vote_count")
            .eq("voted_for_id", profile.id)
            .eq("voter_class", profile.class)

        totalVotesForMemories = classVoteStats?.reduce((acc, curr) => acc + (curr.vote_count || 0), 0) || 0

        // Tüm aktif kategorileri al
        const { data: dbCategories } = await supabase
            .from("survey_categories")
            .select("*")
            .eq("is_active", true)
            .order("sort_order", { ascending: true })

        // Anket sonuçlarını grupla
        const voteCounts: Record<string, number> = {}
        classVoteStats?.forEach((stat: any) => {
            voteCounts[stat.category_id] = stat.vote_count
        })

        // TÜM kategorileri göster (oy alanları sırala)
        allCategoriesWithVotes = (dbCategories || [])
            .map(cat => ({
                category: cat,
                count: voteCounts[cat.id] || 0
            }))
            .sort((a, b) => b.count - a.count)

        // Top 3 (oy alanlar)
        topCategories = allCategoriesWithVotes
            .filter(item => item.count > 0)
            .slice(0, 3)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-indigo-950 dark:to-purple-950 text-foreground transition-colors duration-300">
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" />
                <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000" />
            </div>

            <header className="border-b border-indigo-100/50 dark:border-indigo-900/30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl sticky top-0 z-50 shadow-sm">
                <div className="container mx-auto flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6">
                    <Link href="/dashboard" prefetch={false}><Button variant="ghost" size="sm" className="gap-2"><ArrowLeft className="h-4 w-4" suppressHydrationWarning /><span className="hidden sm:inline">Geri Dön</span></Button></Link>
                    <div className="flex items-center gap-2">
                        <img src="/image.png" className="h-7 w-7 sm:h-9 sm:w-9" alt="Logo" />
                        <span className="text-lg font-bold font-serif bg-gradient-to-r from-indigo-700 to-purple-700 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">Profil</span>
                    </div>
                    <ModeToggle />
                </div>
            </header>

            <main className="container mx-auto px-4 sm:px-6 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="max-w-4xl mx-auto">
                    {/* Profil Kartı */}
                    <div className="relative overflow-hidden rounded-3xl border border-white/50 dark:border-slate-700/50 bg-white/90 dark:bg-slate-900/90 shadow-2xl backdrop-blur-2xl mb-8">
                        <div className="h-32 sm:h-40 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 relative">
                            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
                            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white/90 dark:from-slate-900/90 to-transparent" />
                        </div>

                        <div className="px-6 sm:px-8 pb-8 -mt-16 sm:-mt-20 relative z-10">
                            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6">
                                <div className={`h-28 w-28 sm:h-36 sm:w-36 rounded-2xl flex items-center justify-center text-4xl sm:text-5xl font-bold shadow-2xl ring-4 ring-white dark:ring-slate-900 ${getColorFromName(profile.first_name)}`}>
                                    {getInitials(profile.first_name, profile.last_name)}
                                </div>

                                <div className="flex-1 text-center sm:text-left pb-2">
                                    <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4 mb-2">
                                        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 dark:text-white">
                                            {getFullName(profile.first_name, profile.last_name)}
                                        </h1>
                                        <Badge className={`${userBadge.color} flex items-center px-3 py-1 text-sm shadow-md`}>
                                            {userBadge.icon}{userBadge.label}
                                        </Badge>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium">
                                            <Users className="h-3.5 w-3.5" suppressHydrationWarning />{profile.class}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                                            #{profile.school_number}
                                        </span>
                                        {profile.level > 0 && (
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${getLevelInfo(profile.level).badgeColor}`}>
                                                <Shield className="h-3 w-3" suppressHydrationWarning />
                                                {getLevelInfo(profile.level).label}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {!isOwnProfile && (
                                    <Link href={`/new?recipientId=${profile.id}`} prefetch={false}>
                                        <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-purple-500/20">
                                            <PenLine className="mr-2 h-4 w-4" suppressHydrationWarning />Anı Yaz
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* İstatistikler - Sadece 3 Tane */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                        <div className="relative overflow-hidden rounded-2xl border border-emerald-200/50 dark:border-emerald-900/30 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 p-5 shadow-lg">
                            <div className="absolute -right-4 -bottom-4 text-emerald-200/50 dark:text-emerald-900/30"><FileText size={80} suppressHydrationWarning /></div>
                            <div className="relative z-10">
                                <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">Yazdığı Anı</p>
                                <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">{writtenCount}</p>
                            </div>
                        </div>
                        <div className="relative overflow-hidden rounded-2xl border border-purple-200/50 dark:border-purple-900/30 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/40 p-5 shadow-lg">
                            <div className="absolute -right-4 -bottom-4 text-purple-200/50 dark:text-purple-900/30"><Heart size={80} suppressHydrationWarning /></div>
                            <div className="relative z-10">
                                <p className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-1">Ona Yazılan Anı</p>
                                <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">{receivedCount}</p>
                            </div>
                        </div>
                        <div className="relative overflow-hidden rounded-2xl border border-amber-200/50 dark:border-amber-900/30 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 p-5 shadow-lg">
                            <div className="absolute -right-4 -bottom-4 text-amber-200/50 dark:text-amber-900/30"><Trophy size={80} suppressHydrationWarning /></div>
                            <div className="relative z-10">
                                <p className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">Aldığı Anket Oyu</p>
                                <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">{totalVotes}</p>
                            </div>
                        </div>
                    </div>

                    {/* Anılar ve Sonuçlar Alanı */}
                    <div className="mt-8">
                        {!canViewMemories ? (
                            <div className="relative overflow-hidden rounded-3xl border border-amber-200/50 dark:border-amber-700/30 bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-slate-900 dark:via-[#1e1b4b] dark:to-slate-900 p-10 text-center shadow-2xl group">
                                {/* Ambient Background Effects */}
                                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-amber-400/10 dark:bg-amber-500/10 blur-[80px] rounded-full pointer-events-none" />
                                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-orange-400/10 dark:bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />

                                <div className="relative z-10 flex flex-col items-center">
                                    <div className="mb-6 relative">
                                        <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full animate-pulse" />
                                        <Lock className="h-20 w-20 text-amber-500 dark:text-amber-400 relative z-10 drop-shadow-lg" suppressHydrationWarning />
                                    </div>

                                    <h3 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-200 dark:to-orange-200 bg-clip-text text-transparent mb-3 font-serif">
                                        Anılar Kilitli
                                    </h3>

                                    <p className="text-slate-600 dark:text-slate-300 mb-8 max-w-md mx-auto text-lg leading-relaxed font-medium">
                                        Bu hazine sandığı <span className="text-amber-600 dark:text-amber-400 font-bold">mezuniyet gününe</span> kadar kapalı kalacak.
                                    </p>

                                    <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/80 dark:bg-black/40 text-slate-900 dark:text-white font-bold border border-amber-200 dark:border-amber-500/30 shadow-lg backdrop-blur-sm group-hover:scale-105 transition-transform duration-300">
                                        <Clock className="h-5 w-5 text-amber-500" suppressHydrationWarning />
                                        <div className="flex flex-col items-start leading-none">
                                            <span className="text-xs text-slate-500 dark:text-slate-400 font-normal uppercase tracking-wider mb-1">Açılmasına</span>
                                            <span className="text-xl tabular-nums">{daysUntilUnlock} gün kaldı</span>
                                        </div>
                                    </div>

                                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-6 font-mono">
                                        {unlockDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {/* Anket Bölümü */}
                                {allCategoriesWithVotes.length > 0 && (
                                    <div className="relative overflow-hidden rounded-2xl border border-white/50 dark:border-slate-700/50 bg-white/90 dark:bg-slate-900/90 shadow-xl backdrop-blur-xl p-6 sm:p-8">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400">
                                                <Trophy className="h-5 w-5" suppressHydrationWarning />
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Anket Durumu</h2>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    {isOwnProfile ? "Sınıf arkadaşlarından aldığın oylar" : "Sınıf arkadaşlarından aldığı oylar"} • Toplam {totalVotesForMemories} oy
                                                </p>
                                            </div>
                                        </div>

                                        {/* Top 3 Kartlar */}
                                        {topCategories.length > 0 && (
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                                                {topCategories.map((item, index) => (
                                                    <div key={item.category.id} className={`relative overflow-hidden rounded-xl p-4 bg-gradient-to-br ${item.category.color} text-white shadow-lg`}>
                                                        <div className="absolute -right-2 -bottom-2 text-white/20 text-6xl">{item.category.emoji}</div>
                                                        <div className="relative z-10">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                {index === 0 && <span className="text-lg">🥇</span>}
                                                                {index === 1 && <span className="text-lg">🥈</span>}
                                                                {index === 2 && <span className="text-lg">🥉</span>}
                                                                <span className="text-2xl">{item.category.emoji}</span>
                                                            </div>
                                                            <p className="font-bold text-sm">{item.category.title}</p>
                                                            <p className="text-xs text-white/80 mt-1">{item.count} oy</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <CollapsibleCategories categories={allCategoriesWithVotes} />
                                    </div>
                                )}

                                {/* Anı Listesi */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
                                            <Gift className="h-5 w-5" suppressHydrationWarning />
                                        </div>
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                            Anı Defteri ({memories.length})
                                        </h2>
                                    </div>

                                    {memories.length > 0 ? (
                                        memories.map((memory: any) => (
                                            <div key={memory.id} className="relative overflow-hidden rounded-2xl border border-white/50 dark:border-slate-700/50 bg-white/90 dark:bg-slate-900/90 shadow-xl backdrop-blur-xl p-6">
                                                <div className="flex items-center gap-4 mb-4">
                                                    <Link href={`/profile/${memory.author.school_number}`} prefetch={false}>
                                                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-sm font-bold shadow-lg ${getColorFromName(memory.author.first_name)} hover:scale-105 transition-transform`}>
                                                            {getInitials(memory.author.first_name, memory.author.last_name)}
                                                        </div>
                                                    </Link>
                                                    <div>
                                                        <Link href={`/profile/${memory.author.school_number}`} prefetch={false} className="hover:text-indigo-600 transition-colors">
                                                            <h3 className="font-bold text-slate-900 dark:text-white">
                                                                {getFullName(memory.author.first_name, memory.author.last_name)}
                                                            </h3>
                                                        </Link>
                                                        <p className="text-xs text-slate-500">{memory.author.class} • #{memory.author.school_number}</p>
                                                    </div>
                                                    <div className="ml-auto">
                                                        <Heart className="h-5 w-5 text-pink-500 fill-pink-500" suppressHydrationWarning />
                                                    </div>
                                                </div>

                                                <div className="relative pl-4 border-l-2 border-indigo-200 dark:border-indigo-800">
                                                    <Quote className="absolute -left-3 -top-1 h-5 w-5 text-indigo-300 dark:text-indigo-700 bg-white dark:bg-slate-900" suppressHydrationWarning />
                                                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                                                        {memory.content}
                                                    </p>
                                                </div>

                                                <div className="mt-4 text-right">
                                                    <span className="text-xs text-slate-400">
                                                        {new Date(memory.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-16 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                                            <Heart className="h-16 w-16 mx-auto text-slate-300 dark:text-slate-700 mb-4" suppressHydrationWarning />
                                            <h3 className="text-xl font-bold text-slate-600 dark:text-slate-400 mb-2">Henüz Anı Yok</h3>
                                            <p className="text-slate-500">Bu profilde henüz görüntülenecek anı yok.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}
