import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, ChevronRight } from "lucide-react"
import Link from "next/link"

interface Suggestion {
    id: string
    title: string
    emoji: string
    status: 'pending' | 'approved' | 'rejected'
    profiles?: {
        first_name: string
        last_name: string
        class: string
    } | null
}

interface RecentSuggestionsCardProps {
    suggestions: Suggestion[]
}

const STATUS_STYLES = {
    pending: {
        label: 'Bekliyor',
        className: 'border-amber-300 text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 dark:text-amber-400',
    },
    approved: {
        label: 'Onaylı',
        className: 'border-green-300 text-green-600 bg-green-50 dark:bg-green-900/20 dark:border-green-700 dark:text-green-400',
    },
    rejected: {
        label: 'Reddedildi',
        className: 'border-red-300 text-red-600 bg-red-50 dark:bg-red-900/20 dark:border-red-700 dark:text-red-400',
    },
}

export function RecentSuggestionsCard({ suggestions }: RecentSuggestionsCardProps) {
    return (
        <Card className="border-0 shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                            <Star className="h-4 w-4 text-white" />
                        </div>
                        Kategori Önerileri
                    </CardTitle>
                    <Button variant="ghost" size="sm" asChild className="h-8 text-xs hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-600">
                        <Link href="/admin/suggestions" className="flex items-center gap-1">
                            Tümü <ChevronRight className="h-3 w-3" />
                        </Link>
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {suggestions && suggestions.length > 0 ? (
                        suggestions.slice(0, 4).map((s) => {
                            const statusStyle = STATUS_STYLES[s.status]
                            return (
                                <div key={s.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl flex-shrink-0">{s.emoji}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold truncate">{s.title}</p>
                                            <p className="text-[11px] text-muted-foreground">
                                                {s.profiles?.first_name} {s.profiles?.last_name} • {s.profiles?.class}
                                            </p>
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className={`text-[9px] h-5 flex-shrink-0 ${statusStyle.className}`}
                                        >
                                            {statusStyle.label}
                                        </Badge>
                                    </div>
                                </div>
                            )
                        })
                    ) : (
                        <div className="p-8 text-center">
                            <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
                                <Star className="h-6 w-6 text-slate-400 dark:text-slate-500" />
                            </div>
                            <p className="text-sm font-medium text-muted-foreground">Henüz öneri yok</p>
                            <p className="text-xs text-muted-foreground/60 mt-1">Kullanıcılar kategori önerdiğinde burada görünecek</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
