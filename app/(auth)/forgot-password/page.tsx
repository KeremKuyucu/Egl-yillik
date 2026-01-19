"use client"

import { useState, type FormEvent } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { KeyRound, ArrowLeft, CheckCircle, Loader2, AlertCircle } from "lucide-react"

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const handleReset = async (e: FormEvent) => {
        e.preventDefault()
        const supabase = createClient()
        setIsLoading(true)
        setError(null)

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
            })

            if (error) throw error
            setSuccess(true)
        } catch (error: unknown) {
            setError(error instanceof Error ? error.message : "Bir hata oluştu.")
        } finally {
            setIsLoading(false)
        }
    }

    if (success) {
        return (
            <Card className="w-full border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xl ring-1 ring-emerald-200 dark:ring-emerald-800 text-center p-6 space-y-4">
                <div className="mx-auto w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-2">
                    <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-500" />
                </div>
                <CardTitle className="text-xl font-bold text-emerald-700 dark:text-emerald-400">E-posta Gönderildi!</CardTitle>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                    <span className="font-bold text-slate-900 dark:text-white block mb-2">{email}</span>
                    adresine şifre sıfırlama linki gönderdik.
                </div>
                <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded italic font-medium">
                    Eğer e-postayı birkaç dakika içinde alamazsanız, Spam klasörüne bakmayı unutmayın.
                </div>
                <div className="pt-4">
                    <Link href="/login" prefetch={false}>
                        <Button variant="outline" className="w-full border-emerald-200 hover:bg-emerald-50 text-emerald-700">
                            Giriş Sayfasına Dön
                        </Button>
                    </Link>
                </div>
            </Card>
        )
    }

    return (
        <Card className="border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800">
            <CardHeader className="space-y-1 text-center pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">Şifremi Unuttum</CardTitle>
                <CardDescription className="text-sm">
                    E-posta adresinizi girin
                </CardDescription>
            </CardHeader>

            <CardContent className="pt-6 px-4 sm:px-6">
                <form onSubmit={handleReset}>
                    <div className="flex flex-col gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">E-posta</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="ornek@ogrenci.com"
                                required
                                className="h-10 bg-white/50 dark:bg-slate-950/50"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        {error && (
                            <div className="rounded-lg bg-red-50 dark:bg-red-950/20 px-3 py-2 text-xs text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 flex items-start gap-2">
                                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-10 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/30 border-0"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Gönderiliyor...
                                </>
                            ) : (
                                "Sıfırlama Linki Gönder"
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>

            <CardFooter className="bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 p-3 justify-center">
                <Link
                    href="/login"
                    prefetch={false}
                    className="flex items-center text-sm text-muted-foreground hover:text-foreground font-medium"
                >
                    <ArrowLeft className="mr-2 h-3.5 w-3.5" />
                    Geri Dön
                </Link>
            </CardFooter>
        </Card>
    )
}