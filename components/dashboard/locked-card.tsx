import { Lock, ShieldAlert } from "lucide-react"

interface LockedCardProps {
    receivedCount: number
}

export default function LockedCard({ receivedCount }: LockedCardProps) {
    return (
        <div className="relative rounded-2xl border-2 border-slate-700 dark:border-slate-800 overflow-hidden group shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 dark:from-black dark:via-indigo-950 dark:to-purple-950"></div>

            <div className="absolute -right-8 -bottom-8 text-white/5 group-hover:text-white/10 transition-all duration-500">
                <Lock size={120} className="group-hover:rotate-12 group-hover:scale-110 transition-transform duration-500" />
            </div>

            <div className="relative z-10 p-6">
                <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 backdrop-blur-md border border-amber-400/30">
                        <ShieldAlert className="h-4 w-4 text-amber-400 animate-pulse" />
                        <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider">Gizli Kasa</h3>
                    </div>
                </div>
                <div className="flex items-end gap-3 mb-2">
                    <span className="text-5xl font-bold font-serif text-white drop-shadow-2xl">{receivedCount}</span>
                    <span className="text-base text-slate-200 font-medium mb-2">kişi sana yazdı</span>
                </div>
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-black/40 backdrop-blur-sm border border-amber-500/20 mt-4 shadow-lg">
                    <Lock className="h-4 w-4 text-amber-400 animate-pulse" />
                    <p className="text-sm text-slate-200 leading-relaxed font-medium">
                        Mezuniyet günü kilitler açılacak!
                    </p>
                </div>
            </div>
        </div>
    )
}

// Skeleton
export function LockedCardSkeleton() {
    return (
        <div className="relative rounded-2xl border-2 border-slate-700 overflow-hidden shadow-xl bg-slate-900 animate-pulse">
            <div className="p-6">
                <div className="h-6 w-24 bg-slate-800 rounded-full mb-4"></div>
                <div className="h-12 w-32 bg-slate-800 rounded mb-4"></div>
                <div className="h-12 w-full bg-slate-800 rounded-xl"></div>
            </div>
        </div>
    )
}
