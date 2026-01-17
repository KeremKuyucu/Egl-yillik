import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Footer from "@/components/footer"
import { ModeToggle } from "@/components/mode-toggle"
import { getFullName, getInitials } from "@/lib/utils"
import { ArrowLeft, Search, GraduationCap, Trophy, Users, PenLine } from "lucide-react"

// User tablosu ile aynı renkler
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
    const params = await searchParams
    const q = (params.q as string) || ""
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login")

    const { data: stats, error } = await supabase.rpc('get_school_data')

    if (error) {
        console.error("Error fetching stats:", error)
    }

    let students = stats || []

    // Filter by search query
    if (q) {
        const lowerQ = q.toLowerCase()
        students = students.filter((s: any) =>
            getFullName(s.first_name, s.last_name).toLowerCase().includes(lowerQ) ||
            s.class.toLowerCase().includes(lowerQ) ||
            s.school_number.includes(lowerQ)
        )
    }

    // Group by class
    const groupedStudents = students.reduce((acc: any, student: any) => {
        const className = student.class || "Diğer"
        if (!acc[className]) acc[className] = []
        acc[className].push(student)
        return acc
    }, {})

    // Sort classes alphanumeric
    const sortedClasses = Object.keys(groupedStudents).sort((a, b) => a.localeCompare(b, 'tr', { numeric: true }))

    // Sort students within classes by First Name (default from SQL order is usually fine, but let's be explicit if needed or just rely on SQL)
    // SQL already orders by class, first_name. So we don't need to re-sort by text count.

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-indigo-950 dark:to-purple-950 text-foreground">
            <header className="border-b border-indigo-100/50 dark:border-indigo-900/30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl sticky top-0 z-50 shadow-sm">
                <div className="container mx-auto flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6">
                    <div className="flex items-center gap-2 sm:gap-4">
                        <Link href="/dashboard" prefetch={false}>
                            <Button variant="ghost" size="sm" className="gap-2">
                                <ArrowLeft className="h-4 w-4" suppressHydrationWarning />
                                <span className="hidden sm:inline">Panoya Dön</span>
                            </Button>
                        </Link>
                        <div className="flex items-center gap-2">
                            <GraduationCap className="h-5 w-5 text-indigo-600 dark:text-indigo-400" suppressHydrationWarning />
                            <h1 className="text-lg font-bold font-serif bg-gradient-to-r from-indigo-700 to-purple-700 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                                Okul Listesi
                            </h1>
                        </div>
                    </div>
                    <ModeToggle />
                </div>
            </header>

            <main className="container mx-auto px-4 sm:px-6 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Search Bar */}
                <div className="mb-12 max-w-lg mx-auto relative">
                    <form className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" suppressHydrationWarning />
                        <Input
                            name="q"
                            defaultValue={q}
                            placeholder="Öğrenci ara (İsim, sınıf, numara)..."
                            className="pl-10 h-11 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-indigo-200 dark:border-indigo-800 focus:border-indigo-500 rounded-2xl shadow-sm transition-all focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </form>
                </div>

                <div className="max-w-7xl mx-auto space-y-16">
                    {sortedClasses.map(className => (
                        <div key={className} className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                            <div className="flex items-center gap-3 mb-6 px-2">
                                <span className="flex h-8 w-1 bg-indigo-500 rounded-full" />
                                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{className} Sınıfı</h2>
                                <span className="px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 text-xs font-medium shadow-sm">
                                    {groupedStudents[className].length} öğrenci
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {groupedStudents[className].map((student: any) => (
                                    <Link href={`/profile/${student.school_number}`} prefetch={false} key={student.id}>
                                        <div className="group relative overflow-hidden rounded-2xl border border-white/50 dark:border-slate-700/50 bg-white/60 dark:bg-slate-900/60 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 p-4 h-full flex flex-col">
                                            <div className="flex items-center gap-4 mb-3">
                                                <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${getAvatarColor(student.first_name)} flex items-center justify-center text-lg font-bold text-white shadow-md group-hover:scale-110 transition-transform`}>
                                                    {getInitials(student.first_name, student.last_name)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                        {getFullName(student.first_name, student.last_name)}
                                                    </h3>
                                                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-1">
                                                        <span className="text-slate-400">#{student.school_number}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Stats */}
                                            <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800/50 grid grid-cols-2 gap-2 text-center divide-x divide-slate-100 dark:divide-slate-800/50">
                                                <div>
                                                    <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Yazdığı</p>
                                                    <div className="flex items-center justify-center gap-1 font-bold text-slate-700 dark:text-slate-300">
                                                        <PenLine className="h-3 w-3 text-indigo-500" suppressHydrationWarning />
                                                        {student.total_texts_written}
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Yazılan</p>
                                                    <div className="flex items-center justify-center gap-1 font-bold text-slate-700 dark:text-slate-300">
                                                        <Users className="h-3 w-3 text-emerald-500" suppressHydrationWarning />
                                                        {student.total_texts_received}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}

                    {sortedClasses.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
                                <Search className="h-8 w-8 text-slate-400" suppressHydrationWarning />
                            </div>
                            <h3 className="text-lg font-medium text-slate-900 dark:text-white">Sonuç bulunamadı</h3>
                            <p className="text-slate-500 max-w-xs mx-auto mt-2">Aradığınız kriterlere uygun öğrenci bulunamadı. Lütfen kontrol edip tekrar deneyin.</p>
                        </div>
                    )}
                </div>
            </main >
            <Footer />
        </div >
    )
}
