import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sparkles, UserPlus, CheckCircle } from "lucide-react"

interface Classmate {
    id: string
    first_name: string
    last_name: string
    school_number: string
}

interface SuggestionCardProps {
    suggestion: Classmate | null
}

export default function SuggestionCard({ suggestion }: SuggestionCardProps) {

    if (!suggestion) {
        // Tüm sınıf arkadaşlarına yazıldı
        return (
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border-2 border-emerald-200 dark:border-emerald-900 shadow-xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-transparent rounded-full -mr-16 -mt-16"></div>

                <div className="relative p-6 flex flex-col items-center justify-center text-center z-10">
                    <div className="bg-emerald-100 dark:bg-emerald-900/50 p-4 rounded-2xl mb-4 text-emerald-600 dark:text-emerald-400 shadow-lg">
                        <CheckCircle className="h-7 w-7" suppressHydrationWarning />
                    </div>
                    <p className="text-base font-bold text-emerald-800 dark:text-emerald-200">Tebrikler! 🎉</p>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-2 font-medium">Sınıfı tamamladın!</p>
                </div>
            </div>
        )
    }

    return (
        <div className="relative rounded-2xl border-2 border-amber-300/60 dark:border-amber-900/40 overflow-hidden shadow-xl group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400/20 to-transparent rounded-full -mr-16 -mt-16"></div>

            <div className="relative p-6 z-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 bg-amber-100 dark:bg-amber-900/50 rounded-xl text-amber-600 dark:text-amber-400 shadow-md">
                        <Sparkles className="h-5 w-5 animate-pulse" suppressHydrationWarning />
                    </div>
                    <h3 className="text-base font-bold text-amber-900 dark:text-amber-100">
                        Sıradaki: {suggestion.first_name}
                    </h3>
                </div>
                <p className="text-sm text-amber-700 dark:text-amber-300 font-medium mb-5 pl-1">
                    Ona güzel bir anı bırakmaya ne dersin?
                </p>
                <Link href={`/new?recipientId=${suggestion.id}`} prefetch={false}>
                    <Button
                        size="sm"
                        className="w-full h-10 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg shadow-amber-500/30 border-0 transition-all hover:scale-[1.02]"
                    >
                        <UserPlus className="mr-2 h-4 w-4" suppressHydrationWarning />
                        Yazmaya Başla
                    </Button>
                </Link>
            </div>
        </div>
    )
}

// Loading skeleton
export function SuggestionCardSkeleton() {
    return (
        <div className="relative rounded-2xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl bg-slate-100 dark:bg-slate-900 animate-pulse">
            <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
                    <div className="h-5 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
                </div>
                <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded mb-5"></div>
                <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
            </div>
        </div>
    )
}
