import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Activity, ChevronRight } from "lucide-react"
import Link from "next/link"

interface Log {
    id: string
    table_name: string
    operation: 'INSERT' | 'UPDATE' | 'DELETE'
    changed_at: string
    profiles?: {
        first_name: string
        last_name: string
    } | null
}

interface SystemLogsCardProps {
    logs: Log[]
}

export function SystemLogsCard({ logs }: SystemLogsCardProps) {
    return (
        <Card className="border-0 shadow-xl bg-white dark:bg-slate-900">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        Aktivite Logları
                    </CardTitle>
                    <Button variant="ghost" size="sm" asChild className="h-8 text-xs">
                        <Link href="/admin/logs" className="flex items-center gap-1">
                            Tümü <ChevronRight className="h-3 w-3" />
                        </Link>
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[350px] overflow-y-auto">
                    {logs && logs.length > 0 ? (
                        logs.map((log) => (
                            <div key={log.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${log.operation === 'INSERT'
                                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                                        : log.operation === 'UPDATE'
                                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                            : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                        }`}>
                                        <Activity className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold truncate">
                                            {log.table_name} • {log.operation}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground">
                                            {log.profiles ? `${log.profiles.first_name} ${log.profiles.last_name}` : 'Sistem'}
                                        </p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-[10px] text-muted-foreground">
                                            {new Date(log.changed_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center">
                            <Activity className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                            <p className="text-sm text-muted-foreground">Henüz log kaydı yok</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
