import { PenLine, MessageCircle, Vote, TrendingUp } from "lucide-react"

interface StatsBarProps {
    textsCount: number
    totalWords: number
    votedCount: number
    totalCategories: number
    progressPercentage: number
}

export default function StatsBar({
    textsCount,
    totalWords,
    votedCount,
    totalCategories,
    progressPercentage
}: StatsBarProps) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-indigo-200/50 dark:border-slate-700/50 p-5 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform">
                        <PenLine className="h-5 w-5" suppressHydrationWarning />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{textsCount}</p>
                        <p className="text-xs text-slate-500 font-medium">Yazılan</p>
                    </div>
                </div>
            </div>

            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-emerald-200/50 dark:border-slate-700/50 p-5 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl text-white shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                        <MessageCircle className="h-5 w-5" suppressHydrationWarning />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalWords}</p>
                        <p className="text-xs text-slate-500 font-medium">Kelime</p>
                    </div>
                </div>
            </div>

            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-purple-200/50 dark:border-slate-700/50 p-5 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl text-white shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
                        <Vote className="h-5 w-5" suppressHydrationWarning />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{votedCount}/{totalCategories}</p>
                        <p className="text-xs text-slate-500 font-medium">Anket</p>
                    </div>
                </div>
            </div>

            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-amber-200/50 dark:border-slate-700/50 p-5 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl text-white shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform">
                        <TrendingUp className="h-5 w-5" suppressHydrationWarning />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">%{progressPercentage}</p>
                        <p className="text-xs text-slate-500 font-medium">İlerleme</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Loading skeleton
export function StatsBarSkeleton() {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-slate-100 dark:bg-slate-900 rounded-2xl p-5 animate-pulse">
                    <div className="flex items-center gap-3">
                        <div className="h-11 w-11 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
                        <div>
                            <div className="h-7 w-12 bg-slate-200 dark:bg-slate-800 rounded mb-1"></div>
                            <div className="h-3 w-10 bg-slate-200 dark:bg-slate-800 rounded"></div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
