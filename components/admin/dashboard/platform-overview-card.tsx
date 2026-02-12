"use client"

import { Card, CardContent } from "@/components/ui/card"
import { FileText, Users, Vote, TrendingUp, Percent } from "lucide-react"

interface PlatformOverviewCardProps {
    stats: {
        users_count?: number
        texts_count?: number
        votes_count?: number
        active_categories_count?: number
    } | null
}

export function PlatformOverviewCard({ stats }: PlatformOverviewCardProps) {
    const usersCount = stats?.users_count ?? 0
    const textsCount = stats?.texts_count ?? 0
    const votesCount = stats?.votes_count ?? 0
    const categoriesCount = stats?.active_categories_count ?? 0

    // Rough completion metrics
    const textsPerUser = usersCount > 0 ? (textsCount / usersCount).toFixed(1) : "0"
    const votesPerUser = usersCount > 0 ? (votesCount / usersCount).toFixed(1) : "0"
    const votesPerCategory = categoriesCount > 0 ? Math.round(votesCount / categoriesCount) : 0

    const metrics = [
        {
            label: "Yazı / Kişi",
            value: textsPerUser,
            icon: FileText,
            color: "text-purple-600 dark:text-purple-400",
            bg: "bg-purple-100 dark:bg-purple-900/30",
        },
        {
            label: "Oy / Kişi",
            value: votesPerUser,
            icon: Vote,
            color: "text-amber-600 dark:text-amber-400",
            bg: "bg-amber-100 dark:bg-amber-900/30",
        },
        {
            label: "Oy / Kategori",
            value: votesPerCategory.toString(),
            icon: TrendingUp,
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-100 dark:bg-emerald-900/30",
        },
    ]

    return (
        <Card className="border-0 shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
            <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
                        <Percent className="h-5 w-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm">Platform Özeti</h4>
                        <p className="text-[11px] text-muted-foreground">Kişi başı istatistikler</p>
                    </div>
                </div>

                <div className="space-y-3">
                    {metrics.map((metric) => {
                        const Icon = metric.icon
                        return (
                            <div key={metric.label} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                <div className="flex items-center gap-3">
                                    <div className={`h-8 w-8 rounded-lg ${metric.bg} flex items-center justify-center`}>
                                        <Icon className={`h-4 w-4 ${metric.color}`} />
                                    </div>
                                    <span className="text-sm font-medium">{metric.label}</span>
                                </div>
                                <span className={`text-lg font-bold ${metric.color}`}>{metric.value}</span>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
