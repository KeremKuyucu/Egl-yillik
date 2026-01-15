import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { getFullName, getInitials } from "@/lib/utils"
import { getColorFromName } from "@/lib/survey-categories"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import Footer from "@/components/footer"
import { ArrowLeft, Lock, Gift, Clock, Heart, Quote, Trophy } from "lucide-react"
import CollapsibleCategories from "../../profile/[schoolNumber]/collapsible-categories"

interface MemoriesPageProps {
    params: Promise<{ schoolNumber: string }>
}

export default async function MemoriesPage({ params }: MemoriesPageProps) {
    const { schoolNumber } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login")

    // Profil sahibi
    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("school_number", schoolNumber)
        .single()

    if (!profile) notFound()

    if (user.id !== profile.id) {
        redirect(`/profile/${schoolNumber}`)
    }

    // Açılma tarihi kontrolü (26 Haziran 2026)
    const unlockDate = new Date(2026, 5, 26)
    const now = new Date()
    const isUnlocked = now >= unlockDate
    const daysUntilUnlock = Math.max(0, Math.ceil((unlockDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

    // Henüz açılmadıysa kilitli sayfayı göster
    if (!isUnlocked) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 text-white flex flex-col">
                <header className="border-b border-white/10 bg-black/30 backdrop-blur-2xl sticky top-0 z-50">
                    <div className="container mx-auto flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6">
                        <Link href={`/profile/${schoolNumber}`}>
                            <Button variant="ghost" size="sm" className="gap-2 text-white/80 hover:text-white hover:bg-white/10">
                                <ArrowLeft className="h-4 w-4" />
                                <span className="hidden sm:inline">Geri Dön</span>
                            </Button>
                        </Link>
                        <div className="flex items-center gap-2">
                            <Lock className="h-5 w-5 text-amber-400" />
                            <span className="text-lg font-bold">Kilitli</span>
                        </div>
                        <ModeToggle />
                    </div>
                </header>

                <main className="flex-1 flex items-center justify-center p-4">
                    <div className="max-w-md w-full text-center">
                        <div className="relative inline-block mb-8">
                            <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-3xl" />
                            <div className="relative bg-gradient-to-br from-amber-500/20 to-orange-500/20 p-8 rounded-3xl border border-amber-500/30">
                                <Lock className="h-20 w-20 mx-auto text-amber-400" />
                            </div>
                        </div>

                        <h1 className="text-3xl font-bold mb-4">Henüz Zamanı Gelmedi</h1>
                        <p className="text-white/60 mb-8">
                            Anıların mezuniyet gününde açılacak. Sabırlı ol, sürprizler yaklaşıyor!
                        </p>

                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 mb-8">
                            <p className="text-sm text-white/40 mb-2">Açılış Tarihi</p>
                            <p className="text-xl font-bold text-amber-400">
                                {unlockDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                            <div className="mt-4 flex items-center justify-center gap-2 text-white/60">
                                <Clock className="h-4 w-4" />
                                <span className="text-2xl font-bold text-white">{daysUntilUnlock}</span>
                                <span>gün kaldı</span>
                            </div>
                        </div>

                        <Link href={`/profile/${schoolNumber}`}>
                            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Profile Dön
                            </Button>
                        </Link>
                    </div>
                </main>
                <Footer />
            </div>
        )
    }

    // Açıldıysa anıları getir
    const { data: memories } = await supabase
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
        .eq("recipient_id", profile.id)
        .order("created_at", { ascending: false })

    // Anket oylamaları (View üzerinden optimize edilmiş sorgu)
    const { data: classVoteStats } = await supabase
        .from("profile_vote_summary")
        .select("category_id, vote_count")
        .eq("voted_for_id", profile.id)
        .eq("voter_class", profile.class)

    const totalVotes = classVoteStats?.reduce((acc, curr) => acc + (curr.vote_count || 0), 0) || 0

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
    const allCategoriesWithVotes = (dbCategories || [])
        .map(cat => ({
            category: cat,
            count: voteCounts[cat.id] || 0
        }))
        .sort((a, b) => b.count - a.count)

    // Top 3 (oy alanlar)
    const topCategories = allCategoriesWithVotes
        .filter(item => item.count > 0)
        .slice(0, 3)

    const isOwnProfile = user.id === profile.id

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-indigo-950 dark:to-purple-950 text-foreground">
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" />
                <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000" />
            </div>

            <header className="border-b border-indigo-100/50 dark:border-indigo-900/30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl sticky top-0 z-50 shadow-sm">
                <div className="container mx-auto flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6">
                    <Link href={`/profile/${schoolNumber}`}>
                        <Button variant="ghost" size="sm" className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            <span className="hidden sm:inline">Profile Dön</span>
                        </Button>
                    </Link>
                    <div className="flex items-center gap-2">
                        <Gift className="h-5 w-5 text-pink-500" />
                        <span className="text-lg font-bold font-serif bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                            Anılar ve Anketler
                        </span>
                    </div>
                    <ModeToggle />
                </div>
            </header>

            <main className="container mx-auto px-4 sm:px-6 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="max-w-3xl mx-auto">
                    {/* Başlık */}
                    <div className="text-center mb-10 print:mb-4">
                        <div className="inline-flex p-4 bg-gradient-to-br from-pink-500 to-purple-500 rounded-2xl text-white shadow-xl mb-4 print:hidden">
                            <Gift className="h-8 w-8" />
                        </div>
                        <h1 className="text-3xl font-bold font-serif text-slate-900 dark:text-white mb-2 print:text-2xl print:text-black">
                            🎉 Anılar ve Anketler
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 print:text-gray-600">
                            Arkadaşlarının senin için yazdığı {memories?.length || 0} anı
                        </p>
                        <p className="text-xs text-slate-400 mt-2 print:text-gray-500">
                            {getFullName(profile.first_name, profile.last_name)} • {profile.class} • #{profile.school_number}
                        </p>
                    </div>

                </div>

                {/* Anket Sonuçları Bölümü */}
                {allCategoriesWithVotes.length > 0 && (
                    <div className="relative overflow-hidden rounded-2xl border border-white/50 dark:border-slate-700/50 bg-white/90 dark:bg-slate-900/90 shadow-xl backdrop-blur-xl p-6 sm:p-8 mb-8 print:break-inside-avoid">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400"><Trophy className="h-5 w-5" /></div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Anket Durumu</h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {isOwnProfile ? "Sınıf arkadaşlarından aldığın oylar" : "Sınıf arkadaşlarından aldığı oylar"} ({profile.class}) •
                                    Toplam {totalVotes} oy
                                </p>
                            </div>
                        </div>

                        {/* Top 3 Büyük Kartlar */}
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

                        {/* Tüm Kategoriler - Collapsible */}
                        <CollapsibleCategories categories={allCategoriesWithVotes} />
                    </div>
                )}

                {/* Anılar Listesi */}
                {memories && memories.length > 0 ? (
                    <div className="space-y-6">
                        {memories.map((memory: any) => (
                            <div key={memory.id} className="relative overflow-hidden rounded-2xl border border-white/50 dark:border-slate-700/50 bg-white/90 dark:bg-slate-900/90 shadow-xl backdrop-blur-xl p-6">
                                {/* Yazar Bilgisi */}
                                <div className="flex items-center gap-4 mb-4">
                                    <Link href={`/profile/${memory.author.school_number}`}>
                                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-sm font-bold shadow-lg ${getColorFromName(memory.author.first_name)} hover:scale-105 transition-transform`}>
                                            {getInitials(memory.author.first_name, memory.author.last_name)}
                                        </div>
                                    </Link>
                                    <div>
                                        <Link href={`/profile/${memory.author.school_number}`} className="hover:text-indigo-600 transition-colors">
                                            <h3 className="font-bold text-slate-900 dark:text-white">
                                                {getFullName(memory.author.first_name, memory.author.last_name)}
                                            </h3>
                                        </Link>
                                        <p className="text-xs text-slate-500">{memory.author.class} • #{memory.author.school_number}</p>
                                    </div>
                                    <div className="ml-auto">
                                        <Heart className="h-5 w-5 text-pink-500 fill-pink-500" />
                                    </div>
                                </div>

                                {/* Anı İçeriği */}
                                <div className="relative pl-4 border-l-2 border-indigo-200 dark:border-indigo-800">
                                    <Quote className="absolute -left-3 -top-1 h-5 w-5 text-indigo-300 dark:text-indigo-700 bg-white dark:bg-slate-900" />
                                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                                        {memory.content}
                                    </p>
                                </div>

                                {/* Tarih */}
                                <div className="mt-4 text-right">
                                    <span className="text-xs text-slate-400">
                                        {new Date(memory.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <Heart className="h-16 w-16 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                        <h3 className="text-xl font-bold text-slate-600 dark:text-slate-400 mb-2">Henüz Anı Yok</h3>
                        <p className="text-slate-500">Henüz kimse sana anı yazmamış.</p>
                    </div>
                )}

            </main >
            <Footer />
        </div >
    )
}
