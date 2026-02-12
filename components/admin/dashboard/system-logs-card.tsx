import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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

const OP_STYLES = {
    INSERT: {
        label: 'Ekleme',
        bg: 'bg-emerald-100 dark:bg-emerald-900/30',
        text: 'text-emerald-600 dark:text-emerald-400',
        badge: 'border-emerald-300 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-700 dark:text-emerald-400',
    },
    UPDATE: {
        label: 'Güncelleme',
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-600 dark:text-blue-400',
        badge: 'border-blue-300 text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-400',
    },
    DELETE: {
        label: 'Silme',
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-600 dark:text-red-400',
        badge: 'border-red-300 text-red-600 bg-red-50 dark:bg-red-900/20 dark:border-red-700 dark:text-red-400',
    },
}

const TABLE_LABELS: Record<string, string> = {
    profiles: 'Profiller',
    texts: 'Yazılar',
    survey_votes: 'Oylar',
    survey_categories: 'Kategoriler',
    site_settings: 'Ayarlar',
    feedback: 'Geri Bildirim',
    user_category_suggestions: 'Öneriler',
    roles: 'Roller',
    user_roles: 'Kullanıcı Rolleri',
}

export function SystemLogsCard({ logs }: SystemLogsCardProps) {
    return (
        <Card className="border-0 shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Activity className="h-4 w-4 text-white" />
                        </div>
                        Aktivite Logları
                    </CardTitle>
                    <Button variant="ghost" size="sm" asChild className="h-8 text-xs hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600">
                        <Link href="/admin/logs" className="flex items-center gap-1">
                            Tümü <ChevronRight className="h-3 w-3" />
                        </Link>
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[350px] overflow-y-auto">
                    {logs && logs.length > 0 ? (
                        logs.map((log) => {
                            const opStyle = OP_STYLES[log.operation] || OP_STYLES.UPDATE
                            const tableLabel = TABLE_LABELS[log.table_name] || log.table_name

                            return (
                                <div key={log.id} className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${opStyle.bg}`}>
                                            <Activity className={`h-3.5 w-3.5 ${opStyle.text}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-xs font-bold truncate">
                                                    {tableLabel}
                                                </p>
                                                <Badge variant="outline" className={`text-[8px] h-4 px-1.5 ${opStyle.badge}`}>
                                                    {opStyle.label}
                                                </Badge>
                                            </div>
                                            <p className="text-[11px] text-muted-foreground">
                                                {log.profiles ? `${log.profiles.first_name} ${log.profiles.last_name}` : 'Sistem'}
                                            </p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-[10px] text-muted-foreground font-medium">
                                                {new Date(log.changed_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    ) : (
                        <div className="p-8 text-center">
                            <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
                                <Activity className="h-6 w-6 text-slate-400 dark:text-slate-500" />
                            </div>
                            <p className="text-sm font-medium text-muted-foreground">Henüz log kaydı yok</p>
                            <p className="text-xs text-muted-foreground/60 mt-1">Sistem olayları burada görünecek</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
