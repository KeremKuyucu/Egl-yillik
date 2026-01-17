"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Lock, Loader2, AlertCircle, CheckCircle, KeyRound, Eye, EyeOff } from "lucide-react"

export default function UpdatePasswordPage() {
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isValidSession, setIsValidSession] = useState<boolean | null>(null)
    const [mounted, setMounted] = useState(false)
    const router = useRouter()

    // Client-side mount kontrolü
    useEffect(() => {
        setMounted(true)
    }, [])

    // Oturum kontrolü - şifre sıfırlama linki ile gelip gelmediğini kontrol et
    useEffect(() => {
        if (!mounted) return

        const checkSession = async () => {
            const supabase = createClient()
            const { data: { session } } = await supabase.auth.getSession()

            if (session) {
                setIsValidSession(true)
            } else {
                setIsValidSession(false)
            }
        }
        checkSession()
    }, [mounted])

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault()

        // Şifre validasyonu
        if (password.length < 6) {
            setError("Şifre en az 6 karakter olmalıdır.")
            return
        }

        if (password !== confirmPassword) {
            setError("Şifreler eşleşmiyor.")
            return
        }

        const supabase = createClient()
        setIsLoading(true)
        setError(null)

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            })

            if (error) throw error

            setSuccess(true)

            // 2 saniye sonra dashboard'a yönlendir
            setTimeout(() => {
                router.push("/dashboard")
                router.refresh()
            }, 2000)
        } catch (error: unknown) {
            setError(error instanceof Error ? error.message : "Şifre güncellenemedi. Lütfen tekrar deneyin.")
            setIsLoading(false)
        }
    }

    // Oturum kontrolü yapılıyor veya henüz mount olmadı
    if (!mounted || isValidSession === null) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-slate-950 dark:via-emerald-950/20 dark:to-teal-950/20 p-4">
                <div className="flex items-center gap-3">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                    <span className="text-muted-foreground">Oturum kontrol ediliyor...</span>
                </div>
            </div>
        )
    }

    // Geçersiz oturum - şifre sıfırlama linki olmadan geldiyse
    if (isValidSession === false) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 dark:from-slate-950 dark:via-red-950/20 dark:to-orange-950/20 p-4">
                <div className="w-full max-w-sm animate-in fade-in zoom-in-95 duration-500">
                    <Card className="border-2 border-red-200 dark:border-red-800/50 shadow-xl">
                        <CardContent className="pt-8 pb-8 flex flex-col items-center text-center">
                            <div className="bg-red-500/10 p-3 rounded-full mb-4 ring-4 ring-red-500/5">
                                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-500" />
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold mb-2">Geçersiz veya Süresi Dolmuş Link</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground mb-4 px-4">
                                Bu şifre sıfırlama linki geçersiz veya süresi dolmuş. Lütfen yeni bir şifre sıfırlama isteği gönderin.
                            </p>
                            <div className="flex flex-col gap-2 w-full px-4">
                                <Link href="/forgot-password" prefetch={false} className="w-full">
                                    <Button className="w-full h-9 text-sm bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                                        Yeni Link İste
                                    </Button>
                                </Link>
                                <Link href="/login" prefetch={false} className="w-full">
                                    <Button variant="outline" className="w-full h-9 text-sm">
                                        Giriş Sayfasına Dön
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-slate-950 dark:via-emerald-950/20 dark:to-teal-950/20 p-4">
            {/* Background */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-10 -left-10 w-64 h-64 sm:w-96 sm:h-96 bg-emerald-300 rounded-full mix-blend-multiply filter blur-2xl sm:blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute -bottom-10 -right-10 w-64 h-64 sm:w-96 sm:h-96 bg-teal-300 rounded-full mix-blend-multiply filter blur-2xl sm:blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
            </div>

            <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Logo */}
                <div className="flex flex-col items-center gap-3 mb-6 text-center">
                    <div className="h-14 w-14 sm:h-16 sm:w-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                        <KeyRound className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Şifre Güncelleme</h1>
                        <p className="text-xs text-muted-foreground">Yeni şifrenizi belirleyin</p>
                    </div>
                </div>

                {/* Card */}
                <Card className="border-2 border-emerald-200 dark:border-emerald-800/50 shadow-xl">
                    {success ? (
                        <CardContent className="pt-8 pb-8 flex flex-col items-center text-center">
                            <div className="bg-emerald-500/10 p-3 rounded-full mb-4 ring-4 ring-emerald-500/5">
                                <CheckCircle className="h-7 w-7 sm:h-8 sm:w-8 text-emerald-600 dark:text-emerald-500" />
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold mb-2">Şifre Güncellendi!</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground mb-4 px-4">
                                Şifreniz başarıyla güncellendi. Dashboard'a yönlendiriliyorsunuz...
                            </p>
                            <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                        </CardContent>
                    ) : (
                        <>
                            <CardHeader className="text-center pb-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50 rounded-t-lg">
                                <CardTitle className="text-base sm:text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Yeni Şifre Belirle</CardTitle>
                                <CardDescription className="text-xs">
                                    Güçlü bir şifre seçin
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="pt-4 px-4 sm:px-6">
                                <form onSubmit={handleUpdatePassword}>
                                    <div className="flex flex-col gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="password" className="text-sm">Yeni Şifre</Label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="password"
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="En az 6 karakter"
                                                    required
                                                    className="h-10 pl-9 pr-9"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                >
                                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="confirmPassword" className="text-sm">Şifre Tekrar</Label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="confirmPassword"
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    placeholder="Şifrenizi tekrar girin"
                                                    required
                                                    className="h-10 pl-9 pr-9"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                >
                                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Şifre gereksinimleri */}
                                        <div className="text-xs text-muted-foreground bg-slate-50 dark:bg-slate-900 rounded-lg p-3 border">
                                            <p className="font-medium mb-1">Şifre gereksinimleri:</p>
                                            <ul className="list-disc list-inside space-y-0.5">
                                                <li className={password.length >= 6 ? "text-emerald-600" : ""}>
                                                    En az 6 karakter
                                                </li>
                                                <li className={password === confirmPassword && password.length > 0 ? "text-emerald-600" : ""}>
                                                    Şifreler eşleşmeli
                                                </li>
                                            </ul>
                                        </div>

                                        {error && (
                                            <div className="rounded-lg bg-red-50 dark:bg-red-950/20 px-3 py-2 text-xs text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 flex items-start gap-2">
                                                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                                <span>{error}</span>
                                            </div>
                                        )}

                                        <Button
                                            type="submit"
                                            className="w-full h-10 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/30 border-0"
                                            disabled={isLoading || password.length < 6 || password !== confirmPassword}
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Güncelleniyor...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle className="mr-2 h-4 w-4" />
                                                    Şifreyi Güncelle
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>

                            <CardFooter className="bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/30 border-t p-3 justify-center">
                                <Link
                                    href="/dashboard"
                                    prefetch={false}
                                    className="text-xs sm:text-sm text-muted-foreground hover:text-foreground font-medium"
                                >
                                    Dashboard'a Git
                                </Link>
                            </CardFooter>
                        </>
                    )}
                </Card>
            </div>
        </div>
    )
}