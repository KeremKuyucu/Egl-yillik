"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Lock, Loader2, AlertCircle, LogIn } from "lucide-react"

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        const supabase = createClient()
        setIsLoading(true)
        setError(null)

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })
            if (error) throw error

            router.push("/dashboard")
            router.refresh()
        } catch (error: unknown) {
            setError(error instanceof Error ? error.message : "Giriş yapılamadı. Bilgilerinizi kontrol edin.")
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:via-blue-950/20 dark:to-indigo-950/20 p-4">
            {/* Mobile-Optimized Background */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-10 -left-10 w-64 h-64 sm:w-96 sm:h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-2xl sm:blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute -bottom-10 -right-10 w-64 h-64 sm:w-96 sm:h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-2xl sm:blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
            </div>

            <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Logo */}
                <div className="flex flex-col items-center gap-3 mb-6 text-center">
                    <div className="relative">
                        <img src="/image.png" alt="Logo" className="h-16 w-16 sm:h-20 sm:w-20" />
                        <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-0 blur animate-pulse" style={{ animation: 'pulse 2s ease-in-out infinite' }}></div>
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">EGL Yıllık</h1>
                        <p className="text-xs sm:text-sm text-muted-foreground font-medium">Hoş Geldiniz</p>
                    </div>
                </div>

                {/* Card */}
                <Card className="border-2 border-blue-200 dark:border-blue-800/50 shadow-xl">
                    <CardHeader className="space-y-1 text-center pb-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
                        <CardTitle className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Giriş Yap</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                            Hesabınıza erişin
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="pt-4 px-4 sm:px-6">
                        <form onSubmit={handleLogin}>
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

                                <div className="grid gap-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password" className="text-sm">Şifre</Label>
                                        <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-primary">
                                            Unuttum?
                                        </Link>
                                    </div>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="******"
                                        required
                                        className="h-10"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
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
                                    className="w-full h-10 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg shadow-blue-500/30 border-0"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Giriş yapılıyor...
                                        </>
                                    ) : (
                                        <>
                                            <LogIn className="mr-2 h-4 w-4" />
                                            Giriş Yap
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>

                    <CardFooter className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/30 border-t p-3 sm:p-4 justify-center">
                        <div className="text-xs sm:text-sm text-muted-foreground">
                            Hesabınız yok mu?{" "}
                            <Link href="/signup" className="font-semibold text-blue-600 hover:text-blue-700 underline underline-offset-2">
                                Kayıt Ol
                            </Link>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}