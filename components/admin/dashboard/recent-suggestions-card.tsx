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

export function RecentSuggestionsCard({ suggestions }: RecentSuggestionsCardProps) {
    return (
        <Card className="border-0 shadow-xl bg-white dark:bg-slate-900">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <Star className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        Kategori Önerileri
                    </CardTitle>
                    <Button variant="ghost" size="sm" asChild className="h-8 text-xs">
                        <Link href="/admin/suggestions" className="flex items-center gap-1">
                            Tümü <ChevronRight className="h-3 w-3" />
                        </Link>
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {suggestions && suggestions.length > 0 ? (
                        suggestions.slice(0, 4).map((s) => (
                            <div key={s.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{s.emoji}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold truncate">{s.title}</p>
                                        <p className="text-[11px] text-muted-foreground">
                                            {s.profiles?.first_name} {s.profiles?.last_name} • {s.profiles?.class}
                                        </p>
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className={`text-[9px] h-5 ${s.status === 'pending'
                                            ? 'border-amber-300 text-amber-600 bg-amber-50 dark:bg-amber-900/20'
                                            : s.status === 'approved'
                                                ? 'border-green-300 text-green-600 bg-green-50 dark:bg-green-900/20'
                                                : 'border-red-300 text-red-600 bg-red-50 dark:bg-red-900/20'
                                            }`}
                                    >
                                        {s.status === 'pending' ? 'Bekliyor' : s.status === 'approved' ? 'Onaylı' : 'Reddedildi'}
                                    </Badge>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center">
                            <Star className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                            <p className="text-sm text-muted-foreground">Henüz öneri yok</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
