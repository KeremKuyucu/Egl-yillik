"use client"

import { useState, type FormEvent } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { KeyRound, ArrowLeft, Mail, CheckCircle, Loader2, AlertCircle } from "lucide-react"

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
            // Şifre sıfırlama e-postası gönder
            // redirectTo: Kullanıcı linke tıkladığında gideceği sayfa (şifre güncelleme formu)
            // Bu URL'i kendi projenizdeki callback yapısına göre güncelleyin.
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
            })

            if (error) throw error

            setSuccess(true)
        } catch (error: unknown) {
            setError(error instanceof Error ? error.message : "Bir hata oluştu. Lütfen tekrar deneyin.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-slate-50/50 p-6 md:p-10 relative overflow-hidden">
            {/* Dekoratif Arka Plan */}
            <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/50 via-white to-white pointer-events-none" />

            <div className="w-full max-w-[400px] animate-in fade-in zoom-in-95 duration-500">

                {/* İkon / Logo */}
                <div className="flex flex-col items-center gap-4 mb-8 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                        <KeyRound className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold font-serif text-slate-900 tracking-tight">Şifre Kurtarma</h1>
                        <p className="text-sm text-slate-500 font-medium">Hesabınıza yeniden erişim sağlayın</p>
                    </div>
                </div>

                <Card className="border-slate-200/60 shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-sm">
                    {success ? (
                        <CardContent className="pt-10 pb-10 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-2">
                            <div className="bg-green-100 p-3 rounded-full mb-4 ring-4 ring-green-50">
                                <CheckCircle className="h-8 w-8 text-green-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">E-posta Gönderildi!</h3>
                            <p className="text-slate-500 text-sm mb-6 max-w-[280px]">
                                <span className="font-semibold text-slate-900">{email}</span> adresine şifre sıfırlama talimatlarını gönderdik.
                            </p>
                            <Link href="/login">
                                <Button variant="outline" className="border-slate-300 w-full">
                                    Giriş Sayfasına Dön
                                </Button>
                            </Link>
                        </CardContent>
                    ) : (
                        <>
                            <CardHeader className="space-y-1 text-center pb-6 border-b border-slate-100">
                                <CardTitle className="text-lg font-bold text-slate-800">Şifremi Unuttum</CardTitle>
                                <CardDescription className="text-slate-500">
                                    Kayıtlı e-posta adresinizi girin.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <form onSubmit={handleReset}>
                                    <div className="flex flex-col gap-5">
                                        <div className="grid gap-2">
                                            <Label htmlFor="email">E-posta Adresi</Label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    placeholder="ornek@ogrenci.com"
                                                    required
                                                    className="pl-9 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        {error && (
                                            <div className="rounded-lg bg-red-50 px-3 py-3 text-sm text-red-600 border border-red-100 flex items-start gap-2">
                                                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                                                <span className="leading-tight">{error}</span>
                                            </div>
                                        )}

                                        <Button
                                            type="submit"
                                            className="w-full shadow-md hover:shadow-lg hover:shadow-primary/20 transition-all"
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
                            <CardFooter className="bg-slate-50/50 border-t border-slate-100 p-4 justify-center">
                                <Link
                                    href="/login"
                                    className="flex items-center text-sm text-slate-500 hover:text-slate-900 transition-colors font-medium"
                                >
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Giriş sayfasına geri dön
                                </Link>
                            </CardFooter>
                        </>
                    )}
                </Card>
            </div>
        </div>
    )
}