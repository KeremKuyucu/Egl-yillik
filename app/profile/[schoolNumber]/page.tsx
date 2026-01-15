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
    ArrowLeft, FileText, Award, Users, Sparkles, Clock, Star, Zap, Heart, PenLine, Trophy, BarChart3, Lock, Gift, Shield
} from "lucide-react"
import CollapsibleCategories from "./collapsible-categories"

const getBadge = (count: number) => {
    if (count >= 30) return { label: "Yıllık Efsanesi", color: "bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 shadow-lg shadow-purple-500/40", icon: <Star className="h-3 w-3 mr-1" /> }
    if (count >= 15) return { label: "Hatıra Mimarı", color: "bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0 shadow-lg shadow-amber-500/40", icon: <Zap className="h-3 w-3 mr-1" /> }
    if (count >= 5) return { label: "Anı Yazarı", color: "bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-0 shadow-lg shadow-blue-500/40", icon: <Heart className="h-3 w-3 mr-1" /> }
    return { label: "Yeni Üye", color: "bg-gradient-to-r from-slate-500 to-slate-600 text-white border-0 shadow-md", icon: <Sparkles className="h-3 w-3 mr-1" /> }
}

interface ProfilePageProps {
    params: Promise<{ schoolNumber: string }>
}

export default async function ProfilePage({ params }: ProfilePageProps) {
    const { schoolNumber } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login")

    // Okul numarasına göre profil bul
    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("school_number", schoolNumber)
        .single()

    if (!profile) notFound()

    // Bu kişinin yazdığı anılar
    const { data: writtenTexts } = await supabase.from("texts").select("id, content").eq("author_id", profile.id)

    // Ona yazılan anı sayısı
    let receivedCount = 0
    if (user.id === profile.id) {
        try {
            const { data, error } = await supabase.rpc('get_my_received_count')
            if (!error) receivedCount = data || 0
        } catch (e) {
            console.error("Sayaç hatası:", e)
        }
    } else {
        const { count } = await supabase.from("texts").select("id", { count: 'exact', head: true }).eq("recipient_id", profile.id)
        receivedCount = count || 0
    }

    // Sınıf arkadaşları (detaylı bilgilerle)
    const { data: classmates } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, school_number")
        .eq("class", profile.class)
        .neq("id", profile.id)
        .order("first_name")

    // Anket oylamaları (sadece kendi sınıfından)
    const { data: surveyVotes } = await supabase
        .from("survey_votes")
        .select("category_id, voter:voter_id(class)")
        .eq("voted_for_id", profile.id)

    // Sadece aynı sınıftan gelen oyları say
    const classVotes = surveyVotes?.filter((v: any) => v.voter?.class === profile.class) || []

    // Tüm aktif kategorileri al
    const { data: dbCategories } = await supabase
        .from("survey_categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })

    const writtenCount = writtenTexts?.length || 0
    const totalWords = writtenTexts?.reduce((acc, curr) => acc + (curr.content?.split(" ").length || 0), 0) || 0
    const classmatesCount = classmates?.length || 0
    const userBadge = getBadge(writtenCount)

    // Anket sonuçlarını grupla
    const voteCounts: Record<string, number> = {}
    classVotes.forEach((vote: any) => {
        voteCounts[vote.category_id] = (voteCounts[vote.category_id] || 0) + 1
    })

    // TÜM kategorileri göster (oy alanları sırala)
    const allCategoriesWithVotes = (dbCategories || [])
        .map(cat => ({
            category: cat,
            count: voteCounts[cat.id] || 0
        }))
        .sort((a, b) => b.count - a.count) // Oy sayısına göre sırala

    // Top 3 (oy alanlar)
    const topCategories = allCategoriesWithVotes
        .filter(item => item.count > 0)
        .slice(0, 3)

    const isOwnProfile = user.id === profile.id

    // Anıların açılacağı tarih (Mezuniyet günü: 26 Haziran 2026)
    const unlockDate = new Date(2026, 5, 26) // Ay 0-indexed (5 = Haziran)
    const now = new Date()
    const isUnlocked = now >= unlockDate
    const daysUntilUnlock = Math.max(0, Math.ceil((unlockDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-indigo-950 dark:to-purple-950 text-foreground transition-colors duration-300">
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" />
                <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000" />
            </div>

            <header className="border-b border-indigo-100/50 dark:border-indigo-900/30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl sticky top-0 z-50 shadow-sm">
                <div className="container mx-auto flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6">
                    <Link href="/dashboard"><Button variant="ghost" size="sm" className="gap-2"><ArrowLeft className="h-4 w-4" /><span className="hidden sm:inline">Geri Dön</span></Button></Link>
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
                                            <Users className="h-3.5 w-3.5" />{profile.class}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                                            #{profile.school_number}
                                        </span>
                                        {profile.level > 0 && (
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${getLevelInfo(profile.level).badgeColor}`}>
                                                <Shield className="h-3 w-3" />
                                                {getLevelInfo(profile.level).label}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {!isOwnProfile && (
                                    <Link href={`/new?recipientId=${profile.id}`}>
                                        <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-purple-500/20">
                                            <PenLine className="mr-2 h-4 w-4" />Anı Yaz
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* İstatistikler */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className="relative overflow-hidden rounded-2xl border border-emerald-200/50 dark:border-emerald-900/30 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 p-5 shadow-lg">
                            <div className="absolute -right-4 -bottom-4 text-emerald-200/50 dark:text-emerald-900/30"><FileText size={80} /></div>
                            <div className="relative z-10">
                                <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">Yazdığı Anı</p>
                                <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">{writtenCount}</p>
                            </div>
                        </div>
                        <div className="relative overflow-hidden rounded-2xl border border-blue-200/50 dark:border-blue-900/30 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 p-5 shadow-lg">
                            <div className="absolute -right-4 -bottom-4 text-blue-200/50 dark:text-blue-900/30"><BarChart3 size={80} /></div>
                            <div className="relative z-10">
                                <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">Toplam Kelime</p>
                                <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{totalWords}</p>
                            </div>
                        </div>
                        <div className="relative overflow-hidden rounded-2xl border border-purple-200/50 dark:border-purple-900/30 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/40 p-5 shadow-lg">
                            <div className="absolute -right-4 -bottom-4 text-purple-200/50 dark:text-purple-900/30"><Heart size={80} /></div>
                            <div className="relative z-10">
                                <p className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-1">Ona Yazılan</p>
                                <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">{receivedCount || 0}</p>
                            </div>
                        </div>
                        <div className="relative overflow-hidden rounded-2xl border border-amber-200/50 dark:border-amber-900/30 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 p-5 shadow-lg">
                            <div className="absolute -right-4 -bottom-4 text-amber-200/50 dark:text-amber-900/30"><Users size={80} /></div>
                            <div className="relative z-10">
                                <p className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">Sınıf Arkadaşı</p>
                                <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">{classmatesCount}</p>
                            </div>
                        </div>
                    </div>

                    {/* Sana Yazılan Anılar - Kilitli Bölüm */}
                    {isOwnProfile && (
                        <div className="relative overflow-hidden rounded-2xl border border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 dark:from-black dark:via-indigo-950 dark:to-purple-950 shadow-2xl mb-8">
                            {/* Arka Plan Deseni */}
                            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                            <div className="absolute -right-10 -bottom-10 text-white/5">
                                <Gift size={200} />
                            </div>

                            <div className="relative z-10 p-6 sm:p-8">
                                <div className="flex items-start gap-4 mb-6">
                                    <div className={`p-3 rounded-2xl ${isUnlocked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                        {isUnlocked ? <Gift className="h-6 w-6" /> : <Lock className="h-6 w-6" />}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white mb-1">Sana Yazılan Anılar</h2>
                                        <p className="text-sm text-slate-300">
                                            {isUnlocked
                                                ? "🎉 Anıların açıldı! Arkadaşlarının sana yazdıklarını oku."
                                                : `Mezuniyet gününde açılacak • ${daysUntilUnlock} gün kaldı`
                                            }
                                        </p>
                                    </div>
                                </div>

                                {/* Sayaç ve Durum */}
                                <div className="flex items-center justify-between p-4 rounded-xl bg-black/30 backdrop-blur-sm border border-white/10">
                                    <div className="flex items-center gap-3">
                                        <div className="text-4xl font-bold text-white">{receivedCount || 0}</div>
                                        <div className="text-sm text-slate-300">
                                            kişi sana<br />anı yazdı
                                        </div>
                                    </div>

                                    {isUnlocked ? (
                                        <Link href={`/memories/${profile.school_number}`}>
                                            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                                <Gift className="mr-2 h-4 w-4" />
                                                Anıları Gör
                                            </Button>
                                        </Link>
                                    ) : (
                                        <div className="flex flex-col items-end">
                                            <div className="flex items-center gap-2 text-amber-400 text-sm font-medium">
                                                <Lock className="h-4 w-4" />
                                                Kilitli
                                            </div>
                                            <p className="text-xs text-slate-400 mt-1">
                                                {unlockDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Geri Sayım */}
                                {!isUnlocked && (
                                    <div className="mt-4 text-center">
                                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/60 text-xs">
                                            <Clock className="h-3 w-3" />
                                            Sabırlı ol, mezuniyet yaklaşıyor ✨
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Anket Başarıları */}
                    {allCategoriesWithVotes.length > 0 && (
                        <div className="relative overflow-hidden rounded-2xl border border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 dark:from-black dark:via-indigo-950 dark:to-purple-950 shadow-2xl mb-8">
                            {/* Arka Plan Deseni */}
                            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                            <div className="absolute -right-10 -bottom-10 text-white/5">
                                <Trophy size={200} />
                            </div>

                            <div className="relative z-10 p-6 sm:p-8">
                                <div className="flex items-start gap-4 mb-6">
                                    <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400">
                                        <Trophy className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white mb-1">Anket Durumu</h2>
                                        <p className="text-sm text-slate-300">
                                            {isOwnProfile ? "Sınıf arkadaşlarından aldığın oylar" : "Sınıf arkadaşlarından aldığı oylar"} ({profile.class}) •
                                            Toplam {classVotes.length} oy
                                        </p>
                                    </div>
                                </div>

                                {isUnlocked ? (
                                    <>
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
                                    </>
                                ) : (
                                    <div className="rounded-xl bg-black/30 backdrop-blur-sm border border-white/10 p-8 text-center">
                                        <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Lock className="h-8 w-8" />
                                        </div>
                                        <h3 className="text-lg font-bold text-white mb-2">
                                            Sonuçlar Kilitli
                                        </h3>
                                        <p className="text-slate-300 max-w-md mx-auto mb-6">
                                            Anket sonuçları ve şampiyonlar mezuniyet gününde ({unlockDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}) açıklanacak.
                                        </p>

                                        {isOwnProfile && (
                                            <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 inline-block">
                                                <p className="text-sm text-slate-300 mb-1">Şu ana kadar senin için</p>
                                                <div className="flex items-baseline justify-center gap-2">
                                                    <span className="text-3xl font-bold text-amber-400">{classVotes.length}</span>
                                                    <span className="text-lg font-medium text-slate-200">oy</span>
                                                </div>
                                                <p className="text-xs text-slate-400 mt-1">kullanıldı!</p>
                                            </div>
                                        )}
                                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-slate-300 text-sm font-medium">
                                            <Clock className="h-4 w-4" />
                                            <span>Heyecana {daysUntilUnlock} gün kaldı!</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {/* Sınıf Arkadaşları */}
                    {classmates && classmates.length > 0 && (
                        <div className="rounded-2xl border border-white/50 dark:border-slate-700/50 bg-white/90 dark:bg-slate-900/90 shadow-xl backdrop-blur-2xl p-6 sm:p-8 mb-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400"><Users className="h-5 w-5" /></div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Sınıf Arkadaşları</h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{profile.class} - {classmates.length} kişi</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                {classmates.map((mate: any) => (
                                    <Link key={mate.id} href={`/profile/${mate.school_number}`} className="group">
                                        <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all">
                                            <div className={`h-10 w-10 rounded-lg flex items-center justify-center text-xs font-bold shadow-sm ${getColorFromName(mate.first_name)}`}>
                                                {getInitials(mate.first_name, mate.last_name)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                    {getFullName(mate.first_name, mate.last_name)}
                                                </p>
                                                <p className="text-xs text-slate-500">#{mate.school_number}</p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="text-center">
                        <Link href="/surveys">
                            <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-xl shadow-purple-500/20">
                                <Award className="mr-2 h-5 w-5" />Anketlere Git
                            </Button>
                        </Link>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}
