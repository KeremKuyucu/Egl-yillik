import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileText, Plus, User, Award, Users, ChevronRight } from "lucide-react"

interface QuickActionsProps {
    schoolNumber: string
    lastTextDate: Date | null
}

export default function QuickActions({ schoolNumber, lastTextDate }: QuickActionsProps) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
                <div className="flex items-center gap-4">
                    <h3 className="text-2xl font-bold font-serif text-slate-800 dark:text-white flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl text-white shadow-lg shadow-purple-500/30">
                            <FileText className="h-6 w-6" suppressHydrationWarning />
                        </div>
                        Anı Defterin
                    </h3>
                    <Link href="/my-texts" prefetch={false}>
                        <Button variant="ghost" size="sm" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/30">
                            Tümünü Gör <ChevronRight className="ml-1 h-4 w-4" suppressHydrationWarning />
                        </Button>
                    </Link>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 pl-1">
                    {lastTextDate ? (
                        <>Son yazın: <span className="font-semibold text-slate-700 dark:text-slate-300">{lastTextDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}</span></>
                    ) : (
                        'Yazdığın tüm anılar burada. ✨'
                    )}
                </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Link href={`/profile/${schoolNumber}`} prefetch={false}>
                    <Button variant="outline" className="w-full sm:w-auto border-2 border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">
                        <User className="mr-2 h-4 w-4" suppressHydrationWarning />
                        <span className="font-semibold">Profilim</span>
                    </Button>
                </Link>
                <Link href="/surveys" prefetch={false}>
                    <Button variant="outline" className="w-full sm:w-auto border-2 border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">
                        <Award className="mr-2 h-4 w-4" suppressHydrationWarning />
                        <span className="font-semibold">Anketler</span>
                    </Button>
                </Link>
                <Link href="/school" prefetch={false}>
                    <Button variant="outline" className="w-full sm:w-auto border-2 border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">
                        <Users className="mr-2 h-4 w-4" suppressHydrationWarning />
                        <span className="font-semibold">Okul Listesi</span>
                    </Button>
                </Link>
                <Link href="/new" prefetch={false}>
                    <Button className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-xl shadow-indigo-500/30 transition-all hover:scale-105 hover:shadow-2xl border-0">
                        <Plus className="mr-2 h-5 w-5" suppressHydrationWarning />
                        <span className="font-bold">Yeni Anı Yaz</span>
                    </Button>
                </Link>
            </div>
        </div>
    )
}
