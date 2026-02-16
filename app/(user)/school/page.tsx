import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { getFullName, getInitials } from "@/lib/utils"
import { Search, GraduationCap, Users, PenLine, Star, Calendar } from "lucide-react"
import { getCurrentProfile, getCurrentUser } from "@/lib/auth/data"
import { YearSelector } from "@/components/school/year-selector"

const avatarColors = [
    "from-red-500 to-rose-600",
    "from-orange-500 to-amber-600",
    "from-yellow-500 to-lime-600",
    "from-green-500 to-emerald-600",
    "from-teal-500 to-cyan-600",
    "from-blue-500 to-indigo-600",
    "from-indigo-500 to-purple-600",
    "from-purple-500 to-pink-600",
    "from-pink-500 to-rose-600",
    "from-fuchsia-500 to-purple-600",
]

function getAvatarColor(name: string): string {
    const charCode = (name || '').charCodeAt(0) || 0
    return avatarColors[charCode % avatarColors.length]
}

export default async function SchoolPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const user = await getCurrentUser()
    const profile = await getCurrentProfile()

    if (!profile || !user) { return null; }

    const search = await searchParams
    const q = (search.q as string) || ""

    // Yılı Query String'den al (?year=2024)
    const yearQuery = search.year as string
    let targetYear = parseInt(yearQuery)

    // Eğer query'de yıl yoksa veya geçersizse kullanıcının kendi yılına yönlendir (?year=profil_yili)
    if (!yearQuery || isNaN(targetYear)) {
        redirect(`/school?year=${profile.user_year}`)
    }

    const supabase = await createClient()

    // 1. Veritabanından mevcut sınıfları ve sistemdeki mevcut yılları çek
    const [settingsResponse, yearsResponse, siteCountsResponse] = await Promise.all([
        supabase.from('site_settings').select('value').eq('key', 'valid_classes').single(),
        supabase.rpc('get_available_years'),
        supabase.rpc('get_public_site_counts')
    ])

    const CLASSES: string[] = settingsResponse.data?.value ? settingsResponse.data.value.split(',') : []
    const uniqueYears = (yearsResponse.data as { year: number }[] || []).map(d => d.year)
    const siteCounts = siteCountsResponse.data || { users: 0, active_texts: 0, votes: 0 }

    // 2. Okul Verilerini RPC ile çek
    const { data: stats, error } = await supabase.rpc('get_school_data', {
        target_year: targetYear
    })

    if (error) console.error("Error fetching stats:", error)

    let students = stats || []

    // Arama Filtresi
    if (q) {
        const lowerQ = q.toLowerCase()
        students = students.filter((s: any) =>
            getFullName(s.first_name, s.last_name).toLowerCase().includes(lowerQ) ||
            s.class.toLowerCase().includes(lowerQ) ||
            s.school_number.includes(lowerQ)
        )
    }

    // Sınıflara göre grupla
    const groupedStudents: Record<string, any[]> = {}
    CLASSES.forEach(cls => {
        groupedStudents[cls] = students
            .filter((s: any) => s.class === cls)
            .sort((a: any, b: any) => a.school_number.localeCompare(b.school_number, 'tr', { numeric: true }))
    })

    return (
        <div className="container mx-auto px-4 sm:px-6 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8">

            {/* Global Site Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="group relative overflow-hidden rounded-2xl border border-indigo-200/50 dark:border-indigo-800/30 bg-gradient-to-br from-indigo-50/90 to-blue-50/90 dark:from-indigo-950/60 dark:to-blue-950/60 p-6 shadow-xl hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-1 backdrop-blur-xl">
                    <div className="absolute -right-6 -bottom-6 text-indigo-200/40 dark:text-indigo-900/40 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">
                        <Users size={100} strokeWidth={1} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-2 bg-indigo-500/10 rounded-lg">
                                <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                                Toplam Öğrenci
                            </p>
                        </div>
                        <p className="text-4xl font-bold text-indigo-700 dark:text-indigo-300 tabular-nums">{siteCounts.users}</p>
                    </div>
                </div>

                <div className="group relative overflow-hidden rounded-2xl border border-purple-200/50 dark:border-purple-800/30 bg-gradient-to-br from-purple-50/90 to-pink-50/90 dark:from-purple-950/60 dark:to-pink-950/60 p-6 shadow-xl hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 hover:-translate-y-1 backdrop-blur-xl">
                    <div className="absolute -right-6 -bottom-6 text-purple-200/40 dark:text-purple-900/40 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">
                        <PenLine size={100} strokeWidth={1} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-2 bg-purple-500/10 rounded-lg">
                                <PenLine className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            <p className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                                Toplam Yazı
                            </p>
                        </div>
                        <p className="text-4xl font-bold text-purple-700 dark:text-purple-300 tabular-nums">{siteCounts.active_texts}</p>
                    </div>
                </div>

                <div className="group relative overflow-hidden rounded-2xl border border-amber-200/50 dark:border-amber-800/30 bg-gradient-to-br from-amber-50/90 to-orange-50/90 dark:from-amber-950/60 dark:to-orange-950/60 p-6 shadow-xl hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-300 hover:-translate-y-1 backdrop-blur-xl">
                    <div className="absolute -right-6 -bottom-6 text-amber-200/40 dark:text-amber-900/40 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">
                        <Star size={100} strokeWidth={1} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-2 bg-amber-500/10 rounded-lg">
                                <Star className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            </div>
                            <p className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                Toplam Oy
                            </p>
                        </div>
                        <p className="text-4xl font-bold text-amber-700 dark:text-amber-300 tabular-nums">{siteCounts.votes}</p>
                    </div>
                </div>
            </div>


            {/* Header & Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-indigo-100 dark:border-indigo-900/50 pb-8">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl text-white shadow-xl shadow-indigo-500/20">
                        <GraduationCap className="h-7 w-7" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold font-serif bg-gradient-to-r from-indigo-700 to-purple-700 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                            Okul Listesi
                        </h1>
                        <p className="text-slate-500 text-sm font-medium">Eğitim Yılı: {targetYear}</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                    {/* Yıl Seçici (Query String Güncelleyici) */}
                    <YearSelector uniqueYears={uniqueYears} targetYear={targetYear} />

                    {/* Arama Barı (Query String Koruyarak) */}
                    <div className="w-full sm:w-72 relative">
                        <form className="relative">
                            <input type="hidden" name="year" value={targetYear} />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
                            <Input
                                name="q"
                                defaultValue={q}
                                placeholder="İsim veya numara..."
                                className="pl-10 h-11 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-indigo-200 dark:border-indigo-800 focus:border-indigo-500 rounded-xl shadow-sm"
                            />
                        </form>
                    </div>
                </div>
            </div>

            {/* Sınıf Listeleri */}
            <div className="space-y-16">
                {CLASSES.map(className => {
                    const classStudents = groupedStudents[className] || []
                    if (classStudents.length === 0) return null

                    return (
                        <div key={className} className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                            <div className="flex items-center gap-3 mb-6 px-2">
                                <span className="flex h-8 w-1 bg-indigo-500 rounded-full" />
                                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{className} Sınıfı</h2>
                                <span className="px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 text-xs font-medium shadow-sm">
                                    {classStudents.length} öğrenci
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {classStudents.map((student: any) => (
                                    <Link href={`/profile/${student.user_year}/${student.school_number}`} prefetch={false} key={student.id}>
                                        <div className="group relative overflow-hidden rounded-2xl border border-white/50 dark:border-slate-700/50 bg-white/60 dark:bg-slate-900/60 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 p-4 h-full flex flex-col">
                                            {/* Profil Kartı İçeriği (İsim, Numara, İstatistikler) */}
                                            <div className="flex items-center gap-4 mb-3">
                                                <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${getAvatarColor(student.first_name)} flex items-center justify-center text-lg font-bold text-white shadow-md group-hover:scale-110 transition-transform`}>
                                                    {getInitials(student.first_name, student.last_name)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                        {getFullName(student.first_name, student.last_name)}
                                                    </h3>
                                                    <p className="text-xs text-slate-500 font-medium mt-1">#{student.school_number}</p>
                                                </div>
                                            </div>

                                            <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800/50 grid grid-cols-3 gap-2 text-center divide-x divide-slate-100 dark:divide-slate-800/50">
                                                <div>
                                                    <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Yazdığı</p>
                                                    <div className="flex flex-col items-center justify-center">
                                                        <div className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300 text-xs">
                                                            <PenLine className="h-3 w-3 text-indigo-500" /> {student.total_texts_written}
                                                        </div>
                                                        <span className="text-[10px] text-slate-400 font-medium">
                                                            ({student.total_words_written || 0} kelime)
                                                        </span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Yazılan</p>
                                                    <div className="flex flex-col items-center justify-center">
                                                        <div className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300 text-xs">
                                                            <Users className="h-3 w-3 text-emerald-500" /> {student.total_texts_received}
                                                        </div>
                                                        <span className="text-[10px] text-slate-400 font-medium">
                                                            ({student.total_words_received || 0} kelime)
                                                        </span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Oy</p>
                                                    <div className="flex items-center justify-center gap-1 font-bold text-slate-700 dark:text-slate-300 text-xs">
                                                        <Star className="h-3 w-3 text-amber-500" /> {student.total_votes || 0}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}