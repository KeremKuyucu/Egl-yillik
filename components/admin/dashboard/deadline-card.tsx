import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Wrench } from "lucide-react"
import Link from "next/link"

interface DeadlineCardProps {
    deadline: Date | null
    daysUntilDeadline: number | null
}

export function DeadlineCard({ deadline, daysUntilDeadline }: DeadlineCardProps) {
    return (
        <Card className="border-0 shadow-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white overflow-hidden relative">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-pink-500/20 rounded-full blur-2xl" />

            <CardContent className="p-6 relative z-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Calendar className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-white/60 text-xs uppercase tracking-wider font-bold">Son Tarih</p>
                        <p className="text-xl font-bold">
                            {deadline
                                ? deadline.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
                                : 'Belirlenmedi'
                            }
                        </p>
                    </div>
                </div>

                {daysUntilDeadline !== null && (
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-white/80">Kalan Süre</span>
                            <span className="text-2xl font-bold">
                                {daysUntilDeadline > 0 ? `${daysUntilDeadline} gün` : 'Süre doldu!'}
                            </span>
                        </div>
                        <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-white rounded-full transition-all duration-500"
                                style={{
                                    width: `${Math.max(0, Math.min(100, ((30 - daysUntilDeadline) / 30) * 100))}%`
                                }}
                            />
                        </div>
                    </div>
                )}

                <Button asChild className="w-full mt-4 bg-white text-indigo-600 hover:bg-white/90 font-bold shadow-xl">
                    <Link href="/admin/settings" className="flex items-center justify-center gap-2">
                        <Wrench className="h-4 w-4" />
                        Tarihi Düzenle
                    </Link>
                </Button>
            </CardContent>
        </Card>
    )
}
