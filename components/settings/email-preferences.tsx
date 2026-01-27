"use client"

import { useState, useEffect } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, BellOff, BellRing, Loader2 } from "lucide-react"
import { toggleEmailReminders, getEmailPreference } from "@/app/actions/email-preferences"
import { toast } from "sonner"

export default function EmailPreferences() {
    const [isOptedOut, setIsOptedOut] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [isUpdating, setIsUpdating] = useState(false)

    useEffect(() => {
        const loadPreference = async () => {
            const { isOptedOut: preference } = await getEmailPreference()
            setIsOptedOut(preference)
            setIsLoading(false)
        }
        loadPreference()
    }, [])

    const handleToggle = async (checked: boolean) => {
        setIsUpdating(true)
        // Switch "checked" ise (true), opt-out KAPALI (yani mail İSTİYOR) 
        // Logic'i tersine çeviriyoruz çünkü UI'da "Hatırlatma Maillerini Al" olarak göstermek daha doğal.
        const newOptOutValue = !checked

        const res = await toggleEmailReminders(newOptOutValue)

        if (res.error) {
            toast.error(res.error)
        } else {
            setIsOptedOut(newOptOutValue)
            toast.success(checked ? "Hatırlatma mailleri aktifleştirildi" : "Hatırlatma mailleri kapatıldı")
        }
        setIsUpdating(false)
    }

    if (isLoading) {
        return (
            <Card className="border-2 border-slate-100 dark:border-slate-800 animate-pulse">
                <CardContent className="p-6 h-24 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border-2 border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="pb-4">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1">
                    <Mail className="h-4 w-4" />
                    <CardTitle className="text-lg">E-posta Tercihleri</CardTitle>
                </div>
                <CardDescription>
                    Yıllık hazırlık sürecindeki durumun hakkında bilgilendirme mailleri almak isteyip istemediğini belirle.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${!isOptedOut ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                            {!isOptedOut ? <BellRing className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
                        </div>
                        <div>
                            <Label htmlFor="email-reminders" className="font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                                Hatırlatma Maillerini Al
                            </Label>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {!isOptedOut ? 'Eksik yazıların ve anketlerin için hatırlatma alacaksın.' : 'Artık hatırlatma maili almayacaksın.'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {isUpdating && <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />}
                        <Switch
                            id="email-reminders"
                            checked={!isOptedOut}
                            onCheckedChange={handleToggle}
                            disabled={isUpdating}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
