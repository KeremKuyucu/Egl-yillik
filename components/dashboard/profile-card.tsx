import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Clock, Heart, Star, Zap, Sparkles, PenLine, Vote } from "lucide-react"

interface UserBadge {
    label: string
    color: string
    icon: React.ReactNode
}

interface ProfileCardProps {
    userProfile: {
        first_name: string
        last_name: string
        class: string
    }
    greeting: string
    greetingIcon?: string
    userBadge: UserBadge
    totalWords: number
    requiredWritten: number
    requiredTotal: number
    progressPercentage: number
    isRequiredComplete: boolean
    votedCount: number
    totalCategories: number
    surveyPercentage: number
    isSurveyComplete: boolean
}

export default function ProfileCard({
    userProfile,
    greeting,
    greetingIcon,
    userBadge,
    totalWords,
    requiredWritten,
    requiredTotal,
    progressPercentage,
    isRequiredComplete,
    votedCount,
    totalCategories,
    surveyPercentage,
    isSurveyComplete
}: ProfileCardProps) {
    return (
        <div className="relative overflow-hidden rounded-3xl border-2 border-indigo-100 dark:border-indigo-500/30 shadow-2xl group transition-all duration-300 hover:shadow-indigo-500/20 bg-white dark:bg-transparent">
            {/* Background Layers */}
            <div className="absolute inset-0 bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30 dark:from-[#0f172a] dark:via-[#1e1b4b] dark:to-[#312e81] transition-colors duration-500"></div>

            {/* Glow Effects (Dark Mode Only) */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/20 rounded-full blur-[100px] -mr-20 -mt-20 pointer-events-none opacity-0 dark:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px] -ml-16 -mb-16 pointer-events-none opacity-0 dark:opacity-100 transition-opacity duration-500"></div>

            <div className="relative p-8 pb-6 z-10">
                <div className="flex items-center justify-between mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 dark:bg-indigo-500/20 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-200 text-xs font-medium backdrop-blur-md shadow-sm transition-colors">
                        {greetingIcon ? <span className="text-base leading-none">{greetingIcon}</span> : <Clock className="w-3.5 h-3.5" />}
                        <span>{greeting}</span>
                    </div>
                </div>

                <div className="mb-8">
                    <div className="flex flex-wrap items-center gap-4 mb-3">
                        <h1 className="text-5xl font-black text-slate-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-white dark:via-indigo-100 dark:to-indigo-200 tracking-tight font-serif drop-shadow-sm transition-colors">
                            {userProfile?.first_name}
                        </h1>
                        <Badge className={`${userBadge.color} flex items-center px-4 py-2 text-sm shadow-xl hover:scale-105 transition-transform`}>
                            {userBadge.icon}
                            {userBadge.label}
                        </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-lg text-slate-600 dark:text-indigo-200/80 font-medium leading-relaxed transition-colors">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-white/5 border border-indigo-100 dark:border-white/10 text-indigo-700 dark:text-white font-bold shadow-sm transition-colors">
                            {userProfile?.class || "12-?"}
                        </span>
                        <span>sınıfında anılarınla iz bırakıyorsun.</span>
                    </div>

                    <div className="mt-6 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 font-medium transition-colors">
                        <span>Şu ana kadar</span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold font-mono transition-colors">
                            {totalWords}
                        </span>
                        <span>kelimelik hatıra biriktirdin.</span>
                    </div>
                </div>
            </div>

            {/* Progress Section */}
            <div className="relative bg-slate-50/80 dark:bg-[#0b1021]/60 backdrop-blur-md border-t border-indigo-100 dark:border-indigo-500/20 p-8 z-10 flex flex-col gap-6 transition-colors">
                {/* 1. Yazı Tamamlama Oranı */}
                <div>
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 transition-colors">
                            <PenLine className="h-4 w-4 text-indigo-400" />
                            Yazı Görevi
                        </span>
                        <div className="text-right">
                            <span className="text-xl font-bold text-indigo-400">{requiredWritten}</span>
                            <span className="text-xs text-slate-500 font-medium">/{requiredTotal}</span>
                        </div>
                    </div>
                    <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <div
                            className={`h-full transition-all duration-1000 ease-out rounded-full relative overflow-hidden ${isRequiredComplete
                                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 shadow-[0_0_15px_rgba(99,102,241,0.5)]'
                                : 'bg-gradient-to-r from-indigo-500 to-purple-600'
                                }`}
                            style={{ width: `${progressPercentage}%` }}
                        >
                        </div>
                    </div>
                </div>

                {/* 2. Anket Tamamlama Oranı */}
                <Link href="/surveys" prefetch={false} className="group block hover:opacity-80 transition-opacity">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            <Vote className="h-4 w-4 text-emerald-500" />
                            Anket Oyları <span className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-xs text-emerald-400 font-normal">(Görüntüle)</span>
                        </span>
                        <div className="text-right">
                            <span className="text-xl font-bold text-emerald-400">{votedCount}</span>
                            <span className="text-xs text-slate-500 font-medium">/{totalCategories}</span>
                        </div>
                    </div>
                    <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 cursor-pointer">
                        <div
                            className={`h-full transition-all duration-1000 ease-out rounded-full relative overflow-hidden ${isSurveyComplete
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                                : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                                }`}
                            style={{ width: `${surveyPercentage}%` }}
                        >
                        </div>
                    </div>
                </Link>

                {/* Ortak Durum Mesajı */}
                <div className="text-sm text-slate-400 mt-2 text-center font-medium border-t border-white/5 pt-4">
                    {isRequiredComplete && isSurveyComplete
                        ? "🎉 Harikasın! Tüm görevleri tamamladın!"
                        : "Mezuniyet yıllığını oluşturmak için görevleri tamamla."}
                </div>
            </div>
        </div>
    )
}

// Skeleton
export function ProfileCardSkeleton() {
    return (
        <div className="relative overflow-hidden rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-xl bg-slate-100 dark:bg-slate-900 animate-pulse">
            <div className="p-8 pb-6">
                <div className="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded-full mb-8"></div>
                <div className="h-12 w-48 bg-slate-200 dark:bg-slate-800 rounded mb-3"></div>
                <div className="h-6 w-64 bg-slate-200 dark:bg-slate-800 rounded mb-6"></div>
                <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded"></div>
            </div>
            <div className="border-t border-slate-200 dark:border-slate-800 p-8">
                <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full mb-6"></div>
                <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full"></div>
            </div>
        </div>
    )
}
