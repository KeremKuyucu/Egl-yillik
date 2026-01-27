"use client"

import { useState, useEffect } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Clock, Calendar, Loader2, Save, History, BellRing } from "lucide-react"
import { updateSiteSetting, getReminderSettings } from "@/app/actions/settings"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

export function AutoReminderSettings() {
    const [enabled, setEnabled] = useState(false)
    const [interval, setInterval] = useState(3)
    const [lastRun, setLastRun] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        const fetchSettings = async () => {
            const res = await getReminderSettings()
            if (res.success && res.settings) {
                setEnabled(res.settings.enabled)
                setInterval(res.settings.interval)
                setLastRun(res.settings.lastRun)
            }
            setIsLoading(false)
        }
        fetchSettings()
    }, [])

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const res1 = await updateSiteSetting("reminder_auto_enabled", enabled.toString())
            const res2 = await updateSiteSetting("reminder_auto_interval", interval.toString())

            if (res1.error || res2.error) {
                toast.error(res1.error || res2.error)
            } else {
                toast.success("Ayarlar başarıyla güncellendi")
            }
        } catch (e: any) {
            toast.error("Ayarlar kaydedilirken bir hata oluştu")
        }
        setIsSaving(false)
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
        )
    }

    return (
        <Card className="border-2 border-indigo-50 dark:border-indigo-900/20 shadow-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 border-b border-indigo-100 dark:border-indigo-900/20">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-600 rounded-lg text-white">
                        <BellRing className="h-5 w-5" />
                    </div>
                    <div>
                        <CardTitle className="text-lg">Otomatik Hatırlatıcı (Cron)</CardTitle>
                        <CardDescription>Eksikleri olan kullanıcılara periyodik e-postalar gönderir.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                    <div className="space-y-1">
                        <Label htmlFor="auto-enabled" className="text-base font-bold">Otomatik Gönderim</Label>
                        <p className="text-xs text-slate-500">Açıldığında, belirlenen aralıklarla mail atılır.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge variant={enabled ? "default" : "secondary"} className={enabled ? "bg-emerald-500 hover:bg-emerald-600" : ""}>
                            {enabled ? "Aktif" : "Kapalı"}
                        </Badge>
                        <Switch
                            id="auto-enabled"
                            checked={enabled}
                            onCheckedChange={setEnabled}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="interval" className="flex items-center gap-2 text-sm font-semibold">
                            <Clock className="h-4 w-4 text-indigo-500" />
                            Gönderim Aralığı (Gün)
                        </Label>
                        <div className="flex items-center gap-3">
                            <Input
                                id="interval"
                                type="number"
                                min="1"
                                max="30"
                                value={interval}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInterval(parseInt(e.target.value))}
                                className="w-24 font-bold"
                                disabled={!enabled}
                            />
                            <span className="text-sm text-slate-500">günde bir gönderilir.</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                            <History className="h-4 w-4" />
                            Son Gönderim
                        </Label>
                        <div className="flex items-center h-10 px-3 rounded-md bg-slate-50 dark:bg-slate-900 text-sm font-medium border border-slate-100 dark:border-slate-800">
                            {lastRun ? new Date(lastRun).toLocaleString("tr-TR") : "Henüz hiç çalışmadı"}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20"
                    >
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Ayarları Kaydet
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
