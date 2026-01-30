import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { getFullName, getInitials } from "@/lib/utils"
import { getColorFromName, SurveyCategory } from "@/lib/survey-categories"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    FileText, Users, Heart, PenLine, Trophy, Gift, Lock, Clock, Quote, Sparkles
} from "lucide-react"
import CollapsibleCategories from "@/components/profile/collapsible-categories"
import { getBadge } from "@/lib/profile-utils"

interface ProfilePageProps {
    params: {
        schoolNumber: string
        year?: string
    }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
    const resolvedParams = await Promise.resolve(params)
    const { year, schoolNumber } = resolvedParams


    const targetSchoolNumber = schoolNumber
    const targetYear =
        year && !isNaN(Number(year)) ? Number(year) : null


    const supabase = await createClient()

    const user = await getCurrentUser();
    if (!user) {
        throw new Error("Invariant violated: user is null in protected page")
    }

    // Tek bir RPC çağrısı ile tüm verileri al
    const { data: pageData, error: pageError } = await supabase.rpc('get_profile_page_extended_data', {
        target_school_number: targetSchoolNumber,
        target_year: targetYear
    })

    // Profil bulunamazsa 404
    if (pageError || !pageData || !pageData.profile) {
        console.error("Profil yükleme hatası:", pageError)
        notFound()
    }

    // Tüm verileri RPC'den al
    const profile = pageData.profile
    const receivedCount = pageData.receivedCount || 0
    const writtenCount = pageData.writtenCount || 0
    const totalVotes = pageData.totalVotes || 0
    const isUnlocked = pageData.is_unlocked
    const daysUntilUnlock = pageData.days_until_unlock || 0
    const memories = pageData.memories || []
    const selfMemories = pageData.self_memories || []
    const allCategoriesWithVotes = pageData.categories || []

    const userBadge = getBadge(writtenCount)
    const isOwnProfile = user.id === profile.id

    // Statik tarih yerine bugünün tarihine kalan günü ekleyerek hesaplıyoruz
    const unlockDate = new Date()
    unlockDate.setDate(unlockDate.getDate() + daysUntilUnlock)

    const canViewMemories = isUnlocked

    // Toplam anket oyları
    const totalVotesForMemories = allCategoriesWithVotes.reduce((acc: number, curr: any) => acc + (curr.count || 0), 0)

    // Top 3 kategoriler (oy alanlar)
    const topCategories = allCategoriesWithVotes
        .filter((item: any) => item.count > 0)
        .slice(0, 3)

    return (
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Enhanced Profile Card */}
                <div className="relative overflow-hidden rounded-[2rem] border border-white/60 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/80 shadow-2xl shadow-indigo-500/10 dark:shadow-black/30 backdrop-blur-2xl">
                    {/* Animated Gradient Header */}
                    <div className="h-36 sm:h-48 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 animate-gradient-xy" />
                        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-30" />
                        <div className="absolute inset-0 bg-gradient-to-t from-white/95 dark:from-slate-900/95 via-transparent to-transparent" />

                        {/* Floating Particles Effect */}
                        <div className="absolute inset-0 overflow-hidden">
                            <div className="absolute top-8 left-1/4 w-2 h-2 bg-white/40 rounded-full animate-float" />
                            <div className="absolute top-16 right-1/3 w-1.5 h-1.5 bg-white/30 rounded-full animate-float animation-delay-2000" />
                            <div className="absolute top-12 right-1/4 w-1 h-1 bg-white/50 rounded-full animate-float animation-delay-4000" />
                        </div>
                    </div>

                    <div className="px-6 sm:px-10 pb-8 -mt-20 sm:-mt-24 relative z-10">
                        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 sm:gap-8">
                            {/* Avatar with Ring Effect */}
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
                                <div className={`relative h-32 w-32 sm:h-40 sm:w-40 rounded-2xl flex items-center justify-center text-4xl sm:text-5xl font-bold shadow-2xl ring-4 ring-white dark:ring-slate-900 ${getColorFromName(profile.first_name)} group-hover:scale-[1.02] transition-transform duration-300`}>
                                    {getInitials(profile.first_name, profile.last_name)}
                                </div>
                            </div>

                            <div className="flex-1 text-center sm:text-left pb-2 space-y-3">
                                <div className="flex flex-col sm:flex-row items-center sm:items-center gap-3">
                                    <h1 className="text-2xl sm:text-4xl font-bold font-serif text-slate-900 dark:text-white tracking-tight">
                                        {getFullName(profile.first_name, profile.last_name)}
                                    </h1>
                                    <Badge className={`${userBadge.color} flex items-center px-3 py-1.5 text-sm shadow-lg hover:scale-105 transition-transform`}>
                                        {userBadge.icon}{userBadge.label}
                                    </Badge>
                                </div>

                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-100/80 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-semibold text-sm backdrop-blur-sm border border-indigo-200/50 dark:border-indigo-700/30">
                                        <Users className="h-3.5 w-3.5" suppressHydrationWarning />{profile.class}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-medium text-sm backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/30">
                                        #{profile.school_number}
                                    </span>
                                </div>
                            </div>

                            {!isOwnProfile && (
                                <Link href={`/new?recipientId=${profile.id}`} prefetch={false}>
                                    <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105 transition-all duration-300 px-6">
                                        <PenLine className="mr-2 h-4 w-4" suppressHydrationWarning />Anı Yaz
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* Enhanced Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Yazdığı Anı */}
                    <div className="group relative overflow-hidden rounded-2xl border border-emerald-200/50 dark:border-emerald-800/30 bg-gradient-to-br from-emerald-50/90 to-teal-50/90 dark:from-emerald-950/60 dark:to-teal-950/60 p-6 shadow-xl hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 hover:-translate-y-1 backdrop-blur-xl">
                        <div className="absolute -right-6 -bottom-6 text-emerald-200/40 dark:text-emerald-900/40 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">
                            <FileText size={100} strokeWidth={1} suppressHydrationWarning />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-2 bg-emerald-500/10 rounded-lg">
                                    <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" suppressHydrationWarning />
                                </div>
                                <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Yazdığı Anı</p>
                            </div>
                            <p className="text-4xl font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">{writtenCount}</p>
                        </div>
                    </div>

                    {/* Ona Yazılan Anı */}
                    <div className="group relative overflow-hidden rounded-2xl border border-purple-200/50 dark:border-purple-800/30 bg-gradient-to-br from-purple-50/90 to-pink-50/90 dark:from-purple-950/60 dark:to-pink-950/60 p-6 shadow-xl hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 hover:-translate-y-1 backdrop-blur-xl">
                        <div className="absolute -right-6 -bottom-6 text-purple-200/40 dark:text-purple-900/40 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">
                            <Heart size={100} strokeWidth={1} suppressHydrationWarning />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-2 bg-purple-500/10 rounded-lg">
                                    <Heart className="h-4 w-4 text-purple-600 dark:text-purple-400" suppressHydrationWarning />
                                </div>
                                <p className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">Ona Yazılan Anı</p>
                            </div>
                            <p className="text-4xl font-bold text-purple-700 dark:text-purple-300 tabular-nums">{receivedCount}</p>
                        </div>
                    </div>

                    {/* Aldığı Anket Oyu */}
                    <div className="group relative overflow-hidden rounded-2xl border border-amber-200/50 dark:border-amber-800/30 bg-gradient-to-br from-amber-50/90 to-orange-50/90 dark:from-amber-950/60 dark:to-orange-950/60 p-6 shadow-xl hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-300 hover:-translate-y-1 backdrop-blur-xl">
                        <div className="absolute -right-6 -bottom-6 text-amber-200/40 dark:text-amber-900/40 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">
                            <Trophy size={100} strokeWidth={1} suppressHydrationWarning />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-2 bg-amber-500/10 rounded-lg">
                                    <Trophy className="h-4 w-4 text-amber-600 dark:text-amber-400" suppressHydrationWarning />
                                </div>
                                <p className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Aldığı Anket Oyu</p>
                            </div>
                            <p className="text-4xl font-bold text-amber-700 dark:text-amber-300 tabular-nums">{totalVotes}</p>
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
                        <div className="space-y-6">
                            {/* Anket Bölümü */}
                            {allCategoriesWithVotes.length > 0 && (
                                <div className="relative overflow-hidden rounded-[1.5rem] border border-white/60 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/80 shadow-xl backdrop-blur-xl p-6 sm:p-8">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 dark:bg-amber-400/5 rounded-full blur-3xl -mr-32 -mt-32" />

                                    <div className="flex items-center gap-4 mb-8 relative">
                                        <div className="p-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl text-white shadow-lg shadow-amber-500/25">
                                            <Trophy className="h-6 w-6" suppressHydrationWarning />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Anket Sonuçları</h2>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                {isOwnProfile ? "Sınıf arkadaşlarından aldığın oylar" : "Sınıf arkadaşlarından aldığı oylar"} • <span className="font-semibold text-amber-600 dark:text-amber-400">{totalVotesForMemories} oy</span>
                                            </p>
                                        </div>
                                    </div>

                                    {/* Top 3 Kartlar - Premium Design */}
                                    {topCategories.length > 0 && (
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                                            {topCategories.map((item: { category: SurveyCategory, count: number }, index: number) => (
                                                <div key={item.category.id} className="group relative">
                                                    <div className={`absolute -inset-0.5 bg-gradient-to-br ${item.category.color} rounded-2xl blur opacity-50 group-hover:opacity-75 transition-opacity duration-300`} />
                                                    <div className={`relative overflow-hidden rounded-xl p-5 bg-gradient-to-br ${item.category.color} text-white shadow-xl`}>
                                                        <div className="absolute -right-4 -bottom-4 text-white/10 text-8xl transform group-hover:scale-110 transition-transform duration-500">{item.category.emoji}</div>
                                                        <div className="relative z-10">
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <span className="text-2xl">{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</span>
                                                                <span className="text-3xl group-hover:scale-110 transition-transform">{item.category.emoji}</span>
                                                            </div>
                                                            <p className="font-bold text-base mb-1">{item.category.title}</p>
                                                            <p className="text-sm text-white/80 font-medium">{item.count} oy</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <CollapsibleCategories categories={allCategoriesWithVotes} />
                                </div>
                            )}

                            {/* Anı Listesi - Premium Design */}
                            <div className="space-y-5">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl text-white shadow-lg shadow-indigo-500/25">
                                        <Gift className="h-6 w-6" suppressHydrationWarning />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                            Anı Defteri
                                        </h2>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            <span className="font-semibold text-indigo-600 dark:text-indigo-400">{memories.length + selfMemories.length} anı</span> paylaşıldı
                                        </p>
                                    </div>
                                </div>

                                {selfMemories.length > 0 && (
                                    <div className="space-y-4 mb-8">
                                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 pl-2 border-l-4 border-indigo-500">
                                            Geleceğe Notlar
                                        </h3>
                                        {selfMemories.map((memory: any, idx: number) => (
                                            <div
                                                key={memory.id}
                                                className="group relative overflow-hidden rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-lg"
                                            >
                                                <div className="p-6">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                                                            <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                                        </div>
                                                        <span className="font-semibold text-indigo-900 dark:text-indigo-200">Kendine Notun</span>
                                                        <span className="text-xs text-indigo-400 dark:text-indigo-500 ml-auto font-mono">
                                                            {new Date(memory.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                        </span>
                                                    </div>
                                                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-[15px] italic">
                                                        "{memory.content}"
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {memories.length > 0 ? (
                                    <div className="space-y-4">
                                        {memories.map((memory: any, idx: number) => (
                                            <div
                                                key={memory.id}
                                                className="group relative overflow-hidden rounded-2xl border border-white/60 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/80 shadow-lg hover:shadow-xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5"
                                                style={{ animationDelay: `${idx * 50}ms` }}
                                            >
                                                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                                <div className="p-6">
                                                    <div className="flex items-center gap-4 mb-5">
                                                        <Link href={`/profile/${memory.author.user_year}/${memory.author.school_number}`} prefetch={false}>
                                                            <div className="relative group/avatar">
                                                                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl blur opacity-0 group-hover/avatar:opacity-40 transition-opacity duration-300" />
                                                                <div className={`relative h-14 w-14 rounded-xl flex items-center justify-center text-base font-bold shadow-lg ${getColorFromName(memory.author.first_name)} group-hover/avatar:scale-105 transition-transform duration-300`}>
                                                                    {getInitials(memory.author.first_name, memory.author.last_name)}
                                                                </div>
                                                            </div>
                                                        </Link>
                                                        <div className="flex-1">
                                                            <Link href={`/profile/${memory.author.user_year}/${memory.author.school_number}`} prefetch={false} className="group/name">
                                                                <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover/name:text-indigo-600 dark:group-hover/name:text-indigo-400 transition-colors">
                                                                    {getFullName(memory.author.first_name, memory.author.last_name)}
                                                                </h3>
                                                            </Link>
                                                            <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-xs font-medium">{memory.author.class}</span>
                                                                <span className="text-slate-400">#{memory.author.school_number}</span>
                                                            </p>
                                                        </div>
                                                        <div className="p-2 bg-pink-50 dark:bg-pink-900/20 rounded-xl">
                                                            <Heart className="h-5 w-5 text-pink-500 fill-pink-500" suppressHydrationWarning />
                                                        </div>
                                                    </div>

                                                    <div className="relative pl-5 border-l-2 border-gradient-to-b from-indigo-300 to-purple-300 dark:from-indigo-700 dark:to-purple-700 ml-2">
                                                        <div className="absolute -left-[11px] top-0">
                                                            <Quote className="h-5 w-5 text-indigo-400 dark:text-indigo-600 bg-white dark:bg-slate-900 rounded" suppressHydrationWarning />
                                                        </div>
                                                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-[15px]">
                                                            {memory.content}
                                                        </p>
                                                    </div>

                                                    <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                                        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                                                            {new Date(memory.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="relative overflow-hidden text-center py-20 bg-white/60 dark:bg-slate-900/60 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-xl">
                                        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 opacity-50" />
                                        <div className="relative z-10">
                                            <div className="inline-flex p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-4">
                                                <Heart className="h-12 w-12 text-slate-300 dark:text-slate-600" suppressHydrationWarning />
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-600 dark:text-slate-400 mb-2">Henüz Anı Yok</h3>
                                            <p className="text-slate-500 dark:text-slate-500 max-w-xs mx-auto">Bu profilde henüz görüntülenecek anı paylaşılmamış.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
