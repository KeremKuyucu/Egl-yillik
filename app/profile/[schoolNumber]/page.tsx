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
    ArrowLeft, FileText, Award, Users, Sparkles, Star, Zap, Heart, PenLine, Trophy, BarChart3, Gift, Shield
} from "lucide-react"

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

    // Tek bir RPC çağrısı ile tüm profil verilerini ve istatistikleri al
    const { data: stats, error: statsError } = await supabase.rpc('get_profile_page_data', {
        target_school_number: schoolNumber
    })

    // Profil bulunamazsa 404
    if (statsError || !stats || !stats.profile) {
        console.error("Profil yükleme hatası:", statsError)
        notFound()
    }

    const { profile, writtenCount = 0, receivedCount = 0, totalVotes = 0 } = stats
    const userBadge = getBadge(writtenCount)

    const isOwnProfile = user.id === profile.id

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-indigo-950 dark:to-purple-950 text-foreground transition-colors duration-300">
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" />
                <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000" />
            </div>

            <header className="border-b border-indigo-100/50 dark:border-indigo-900/30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl sticky top-0 z-50 shadow-sm">
                <div className="container mx-auto flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6">
                    <Link href="/dashboard" prefetch={false}><Button variant="ghost" size="sm" className="gap-2"><ArrowLeft className="h-4 w-4" /><span className="hidden sm:inline">Geri Dön</span></Button></Link>
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
                                    <Link href={`/new?recipientId=${profile.id}`} prefetch={false}>
                                        <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-purple-500/20">
                                            <PenLine className="mr-2 h-4 w-4" />Anı Yaz
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* İstatistikler - Sadece 3 Tane */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                        <div className="relative overflow-hidden rounded-2xl border border-emerald-200/50 dark:border-emerald-900/30 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 p-5 shadow-lg">
                            <div className="absolute -right-4 -bottom-4 text-emerald-200/50 dark:text-emerald-900/30"><FileText size={80} /></div>
                            <div className="relative z-10">
                                <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">Yazdığı Anı</p>
                                <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">{writtenCount}</p>
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
                            <div className="absolute -right-4 -bottom-4 text-amber-200/50 dark:text-amber-900/30"><Trophy size={80} /></div>
                            <div className="relative z-10">
                                <p className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">Toplam Oy</p>
                                <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">{totalVotes}</p>
                            </div>
                        </div>
                    </div>

                    {/* Anılar ve Sonuçlar */}
                    {isOwnProfile && (
                        <div className="rounded-2xl border border-indigo-200/50 dark:border-indigo-700/50 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/50 dark:to-purple-950/50 backdrop-blur-sm p-8 text-center">
                            <div className="inline-flex p-4 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 text-indigo-600 dark:text-indigo-400 mb-4">
                                <Gift className="h-8 w-8" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                                Sana Yazılan Anılar
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
                                Arkadaşlarının sana yazdığı anıları ve anket sonuçlarını görüntüle.
                            </p>

                            <Link href={`/memories/${profile.school_number}`} prefetch={false}>
                                <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-purple-500/20">
                                    <Gift className="mr-2 h-4 w-4" />
                                    Anıları ve Sonuçları Gör
                                </Button>
                            </Link>
                        </div>
                    )}

                    <div className="text-center mt-8">
                        <Link href="/surveys" prefetch={false}>
                            <Button variant="outline" className="border-slate-200 dark:border-slate-700">
                                <Award className="mr-2 h-4 w-4" />Anketlere Git
                            </Button>
                        </Link>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}
