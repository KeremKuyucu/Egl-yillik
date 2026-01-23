"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Mail, CheckCircle2, AlertCircle } from "lucide-react"
import { toast } from "sonner"

export default function ChangeEmail({ currentEmail }: { currentEmail: string }) {
    const [newEmail, setNewEmail] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isSuccess, setIsSuccess] = useState(false)

    const supabase = createClient()

    const handleUpdateEmail = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        if (newEmail === currentEmail) {
            setError("Yeni e-posta adresi mevcut adresinizle aynı olamaz.")
            setIsLoading(false)
            return
        }

        try {
            const { error: updateError } = await supabase.auth.updateUser({ email: newEmail })
            if (updateError) throw updateError

            setIsSuccess(true)
            toast.success("E-posta güncelleme talebi alındı.")
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    if (isSuccess) {
        return (
            <Card className="border-2 border-amber-100 dark:border-amber-900/30 shadow-xl bg-amber-50/10 backdrop-blur-sm">
                <CardContent className="pt-8 pb-8 text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                        <Mail className="h-8 w-8 text-amber-600" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-amber-800 dark:text-amber-400">Onay Bekleniyor</h3>
                        <p className="text-sm text-slate-500 max-w-sm mx-auto">
                            Lütfen yeni e-posta adresinize gönderilen onay bağlantısına tıklayın.
                        </p>
                    </div>
                    <Button
                        onClick={() => setIsSuccess(false)}
                        variant="outline"
                        className="mt-4 border-amber-200 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-700 dark:text-amber-400"
                    >
                        Anladım
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border-2 border-indigo-100 dark:border-indigo-900/20 shadow-xl overflow-hidden backdrop-blur-sm bg-white/50 dark:bg-slate-900/50">
            <CardHeader className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-b">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600">
                        <Mail className="h-5 w-5" />
                    </div>
                    <div>
                        <CardTitle className="text-lg">E-posta Değiştir</CardTitle>
                        <CardDescription>Hesabına bağlı e-posta adresini güncelle.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                <form onSubmit={handleUpdateEmail} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="current-email">Mevcut E-posta</Label>
                        <Input
                            id="current-email"
                            value={currentEmail}
                            disabled
                            className="bg-slate-100 dark:bg-slate-800 text-slate-500"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="new-email">Yeni E-posta</Label>
                        <Input
                            id="new-email"
                            type="email"
                            placeholder="ornek@domain.com"
                            required
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            className="bg-white/50 dark:bg-slate-900/50"
                        />
                    </div>

                    {error && (
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs border border-red-100 dark:border-red-900/30 animate-in fade-in slide-in-from-top-1">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg border-0 h-11"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Güncelleniyor...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                E-postayı Güncelle
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
