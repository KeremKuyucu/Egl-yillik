import { Clock } from "lucide-react"

interface CountdownCardProps {
    deadlineDate?: Date
}

export default function CountdownCard({ deadlineDate = new Date(2026, 1, 9, 23, 59, 59) }: CountdownCardProps) {
    const now = new Date()
    const diffTime = deadlineDate.getTime() - now.getTime()
    const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
    const formattedDate = deadlineDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
    const isUrgent = daysLeft <= 7 && daysLeft > 0
    const isPassed = daysLeft === 0

    return (
        <div className={`relative overflow-hidden rounded-3xl border-2 shadow-2xl transition-all duration-300 group bg-white dark:bg-transparent ${isPassed
            ? 'border-red-100 bg-red-50 dark:bg-gradient-to-br dark:from-red-950 dark:via-red-900 dark:to-red-950 dark:border-red-800/50'
            : isUrgent
                ? 'border-amber-100 bg-amber-50 dark:bg-gradient-to-br dark:from-amber-950 dark:via-orange-900 dark:to-amber-950 dark:border-amber-600/50'
                : 'border-indigo-100 dark:bg-gradient-to-br dark:from-[#0f172a] dark:via-[#1e1b4b] dark:to-[#312e81] dark:border-indigo-500/30'
            }`}>

            {/* Background Glow Effects (Dark Mode) */}
            {!isPassed && !isUrgent && (
                <>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-[100px] -mr-16 -mt-16 pointer-events-none opacity-0 dark:opacity-100 transition-opacity"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px] -ml-16 -mb-16 pointer-events-none opacity-0 dark:opacity-100 transition-opacity"></div>
                </>
            )}

            <div className="relative p-8 z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
                {/* Sol Taraf: Bilgi */}
                <div className="flex-1 text-center sm:text-left text-slate-800 dark:text-white transition-colors">
                    <div className="flex items-center justify-center sm:justify-start gap-3 mb-3">
                        <div className={`p-3 rounded-xl backdrop-blur-md shadow-lg ${isPassed
                            ? 'bg-red-500/20 text-red-200'
                            : 'bg-indigo-500/20 text-indigo-200 ring-1 ring-indigo-400/30'}`}>
                            <Clock className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-bold tracking-wide">
                            Son Teslim Tarihi
                        </h3>
                    </div>
                    <p className="text-base text-slate-600 dark:text-slate-300/90 font-medium">
                        {formattedDate} tarihine kadar anılarını tamamla.
                    </p>
                    <p className={`text-sm mt-3 font-bold flex items-center justify-center sm:justify-start gap-2 ${isPassed ? 'text-red-500 dark:text-red-400' : 'text-indigo-600 dark:text-indigo-300'}`}>
                        {isPassed ? 'Süre doldu!' : '⏳ Zaman daralıyor!'}
                    </p>
                </div>

                {/* Sağ Taraf: Sayaç */}
                <div className="flex-shrink-0">
                    <div className={`rounded-2xl p-6 min-w-[140px] text-center border backdrop-blur-md shadow-xl transition-all group-hover:scale-105 ${isPassed
                        ? 'bg-red-50 border-red-100 dark:bg-red-950/50 dark:border-red-500/30'
                        : 'bg-indigo-50 border-indigo-100 dark:bg-white/5 dark:border-white/10 dark:ring-1 dark:ring-white/5'}`}>
                        <div className={`text-6xl font-black font-mono tracking-tighter drop-shadow-lg ${isPassed
                            ? 'text-red-500'
                            : 'text-indigo-600 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-b dark:from-white dark:to-white/70'}`}>
                            {daysLeft}
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-2">
                            Gün Kaldı
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Skeleton
export function CountdownCardSkeleton() {
    return (
        <div className="relative overflow-hidden rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-xl bg-slate-100 dark:bg-slate-900 animate-pulse">
            <div className="p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex-1">
                    <div className="h-6 w-40 bg-slate-200 dark:bg-slate-800 rounded mb-3"></div>
                    <div className="h-4 w-64 bg-slate-200 dark:bg-slate-800 rounded mb-3"></div>
                    <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
                </div>
                <div className="h-28 w-36 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
            </div>
        </div>
    )
}
