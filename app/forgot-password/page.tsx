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

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-slate-950 dark:via-amber-950/20 dark:to-orange-950/20 p-4">
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-10 -left-10 w-64 h-64 sm:w-96 sm:h-96 bg-amber-300 rounded-full mix-blend-multiply filter blur-2xl sm:blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute -bottom-10 -right-10 w-64 h-64 sm:w-96 sm:h-96 bg-orange-300 rounded-full mix-blend-multiply filter blur-2xl sm:blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
            </div>

            <div className="w-full max-w-sm animate-in fade-in zoom-in-95 duration-500">
                <div className="flex flex-col items-center gap-3 mb-6 text-center">
                    <div className="h-14 w-14 sm:h-16 sm:w-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                        <KeyRound className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">Şifre Kurtarma</h1>
                        <p className="text-xs text-muted-foreground">Hesabınıza yeniden erişin</p>
                    </div>
                </div>

                <Card className="border-2 border-amber-200 dark:border-amber-800/50 shadow-xl">
                    {success ? (
                        <CardContent className="pt-8 pb-8 flex flex-col items-center text-center">
                            <div className="bg-emerald-500/10 p-3 rounded-full mb-4 ring-4 ring-emerald-500/5">
                                <CheckCircle className="h-7 w-7 sm:h-8 sm:w-8 text-emerald-600 dark:text-emerald-500" />
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold mb-2">E-posta Gönderildi!</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground mb-2 px-4">
                                <span className="font-semibold text-foreground">{email}</span> adresine şifre sıfırlama linki gönderdik.
                            </p>
                            <p className="text-xs text-muted-foreground mb-4 px-4">
                                Eğer e-postayı birkaç dakika içinde alamazsanız, Spam klasörüne bakmayı unutmayın.
                            </p>
                            <Link href="/login" prefetch={false} className="w-full px-4">
                                <Button variant="outline" className="w-full h-9 text-sm">
                                    Giriş Sayfasına Dön
                                </Button>
                            </Link>
                        </CardContent>
                    ) : (
                        <>
                            <CardHeader className="text-center pb-3 border-b">
                                <CardTitle className="text-base sm:text-lg font-bold">Şifremi Unuttum</CardTitle>
                                <CardDescription className="text-xs">
                                    E-posta adresinizi girin
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="pt-4 px-4 sm:px-6">
                                <form onSubmit={handleReset}>
                                    <div className="flex flex-col gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="email" className="text-sm">E-posta</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="ornek@ogrenci.com"
                                                required
                                                className="h-10"
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

                            <CardFooter className="bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/30 border-t p-3 justify-center">
                                <Link
                                    href="/login"
                                    prefetch={false}
                                    className="flex items-center text-xs sm:text-sm text-muted-foreground hover:text-foreground font-medium"
                                >
                                    <ArrowLeft className="mr-2 h-3.5 w-3.5" />
                                    Geri Dön
                                </Link>
                            </CardFooter>
                        </>
                    )}
                </Card>
            </div>
        </div>
    )
}