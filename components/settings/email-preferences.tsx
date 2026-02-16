"use client"

import { useState, useEffect } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Bell, BellOff, Loader2 } from "lucide-react"
import { toggleEmailReminders, getEmailPreference } from "@/app/actions/email-preferences"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

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
        const newOptOutValue = !checked

        // Optimistic update
        const previousState = isOptedOut
        setIsOptedOut(newOptOutValue)

        try {
            const res = await toggleEmailReminders(newOptOutValue)
            if (res.error) {
                setIsOptedOut(previousState) // Revert on error
                toast.error(res.error)
            } else {
                toast.success(checked ? "Bildirimler açıldı" : "Bildirimler kapatıldı")
            }
        } catch (error) {
            setIsOptedOut(previousState)
            toast.error("Bir hata oluştu")
        } finally {
            setIsUpdating(false)
        }
    }

    return (
        <div className="flex items-center justify-between p-4 rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="flex items-center gap-4">
                <div className={cn(
                    "p-2.5 rounded-full transition-colors",
                    !isOptedOut
                        ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
                        : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                )}>
                    {!isOptedOut ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
                </div>
                <div className="space-y-1">
                    <Label htmlFor="email-notifications" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        E-posta Bildirimleri
                    </Label>
                    <p className="text-sm text-muted-foreground">
                        Hatırlatmalar ve güncellemeler hakkında e-posta al.
                    </p>
                </div>
            </div>
            {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
                <Switch
                    id="email-notifications"
                    checked={!isOptedOut}
                    onCheckedChange={handleToggle}
                    disabled={isUpdating}
                />
            )}
        </div>
    )
}
