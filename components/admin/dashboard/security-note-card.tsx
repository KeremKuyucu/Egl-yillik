import { Card, CardContent } from "@/components/ui/card"
import { ShieldAlert, CheckCircle2, AlertCircle } from "lucide-react"

interface SecurityNoteCardProps {
    isMaintenance: boolean
}

export function SecurityNoteCard({ isMaintenance }: SecurityNoteCardProps) {
    return (
        <Card className="border-0 shadow-xl bg-white dark:bg-slate-900 border-l-4 border-l-indigo-500">
            <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                        <ShieldAlert className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h4 className="font-bold">Güvenlik Notu</h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                    Tüm admin işlemleri loglanmaktadır. Kritik değişiklikler sistem tarafından kaydedilir.
                </p>
                <div className={`p-3 rounded-xl flex items-center gap-3 ${isMaintenance
                    ? 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30'
                    : 'bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30'
                    }`}>
                    {isMaintenance ? (
                        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                    ) : (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                    )}
                    <div>
                        <p className={`text-xs font-bold ${isMaintenance ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {isMaintenance ? 'Bakım Modu Aktif' : 'Site Çevrimiçi'}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                            {isMaintenance ? 'Kullanıcılar siteye erişemiyor' : 'Her şey normal çalışıyor'}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
