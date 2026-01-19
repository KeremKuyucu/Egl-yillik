import { Lock, ShieldAlert, Unlock, PartyPopper, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface LockedCardProps {
    receivedCount: number
    deadline: Date | string
    schoolNumber: string
}

export default function LockedCard({ receivedCount, deadline, schoolNumber }: LockedCardProps) {
    const deadlineDate = new Date(deadline)
    const isUnlocked = new Date() >= deadlineDate

    // Tarihi formatla
    const dateStr = deadlineDate.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    })

    if (isUnlocked) {
        return (
            <div className="relative rounded-2xl border-2 border-emerald-500/50 dark:border-emerald-500/30 overflow-hidden group shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300 hover:-translate-y-1">
                {/* Unlocked Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-teal-900 to-green-900 dark:from-emerald-950 dark:via-teal-950 dark:to-green-950 animate-in fade-in duration-700"></div>

                <div className="absolute -right-8 -bottom-8 text-white/5 group-hover:text-white/10 transition-all duration-500">
                    <Unlock size={120} className="group-hover:rotate-12 group-hover:scale-110 transition-transform duration-500" suppressHydrationWarning />
                </div>

                <div className="relative z-10 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30">
                            <PartyPopper className="h-4 w-4 text-emerald-400 animate-bounce" suppressHydrationWarning />
                            <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Kasa Açıldı</h3>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1 mb-4">
                        <span className="text-4xl font-bold font-serif text-white drop-shadow-2xl">{receivedCount}</span>
                        <span className="text-base text-emerald-100 font-medium leading-tight">anı seni bekliyor!</span>
                    </div>

                    <p className="text-sm text-emerald-100/90 mb-5 leading-relaxed font-medium">
                        Mezuniyet günü geldi! Arkadaşlarının senin için yazdığı anıları artık okuyabilirsin.
                    </p>

                    <Link href={`/profile/${schoolNumber}`} prefetch={false} className="block">
                        <Button className="w-full bg-white text-emerald-900 hover:bg-emerald-50 border-0 shadow-lg shadow-black/10 font-bold group/btn">
                            Profilime Git
                            <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                </div>
            </div>
        )
    }

    // Locked State
    return (
        <div className="relative rounded-2xl border-2 border-slate-700 dark:border-slate-800 overflow-hidden group shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 dark:from-black dark:via-indigo-950 dark:to-purple-950"></div>

            <div className="absolute -right-8 -bottom-8 text-white/5 group-hover:text-white/10 transition-all duration-500">
                <Lock size={120} className="group-hover:rotate-12 group-hover:scale-110 transition-transform duration-500" suppressHydrationWarning />
            </div>

            <div className="relative z-10 p-6">
                <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 backdrop-blur-md border border-amber-400/30">
                        <ShieldAlert className="h-4 w-4 text-amber-400 animate-pulse" suppressHydrationWarning />
                        <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider">Gizli Kasa</h3>
                    </div>
                </div>
                <div className="flex items-end gap-3 mb-2">
                    <span className="text-5xl font-bold font-serif text-white drop-shadow-2xl">{receivedCount}</span>
                    <span className="text-base text-slate-200 font-medium mb-2">kişi senin için anı yazdı.</span>
                </div>
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-black/40 backdrop-blur-sm border border-amber-500/20 mt-4 shadow-lg">
                    <Lock className="h-4 w-4 text-amber-400 animate-pulse" suppressHydrationWarning />
                    <p className="text-sm text-slate-200 leading-relaxed font-medium">
                        <span className="text-amber-400 font-semibold">{dateStr}</span> günü kilitler açılacak!
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
