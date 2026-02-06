import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MessageSquare, ChevronRight } from "lucide-react"
import Link from "next/link"

interface Feedback {
    id: string
    message: string
    created_at: string
    profiles?: {
        first_name: string
        last_name: string
        class: string
    } | null
}

interface RecentFeedbackCardProps {
    feedback: Feedback[]
}

export function RecentFeedbackCard({ feedback }: RecentFeedbackCardProps) {
    return (
        <Card className="border-0 shadow-xl bg-white dark:bg-slate-900">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                            <MessageSquare className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                        </div>
                        Geri Bildirimler
                    </CardTitle>
                    <Button variant="ghost" size="sm" asChild className="h-8 text-xs">
                        <Link href="/admin/feedback" className="flex items-center gap-1">
                            Tümü <ChevronRight className="h-3 w-3" />
                        </Link>
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {feedback && feedback.length > 0 ? (
                        feedback.slice(0, 4).map((f) => (
                            <div key={f.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        {f.profiles?.first_name} {f.profiles?.last_name}
                                    </span>
                                    <Badge variant="outline" className="text-[9px] h-4 px-1.5">
                                        {f.profiles?.class}
                                    </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                    {f.message}
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-2">
                                    {new Date(f.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center">
                            <MessageSquare className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                            <p className="text-sm text-muted-foreground">Henüz geri bildirim yok</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
