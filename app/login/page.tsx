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
import { Lock, Loader2, AlertCircle, LogIn } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRecoveryLoading, setIsRecoveryLoading] = useState(true)
  const router = useRouter()

  // Şifre sıfırlama token'ını tespit et ve yönlendir
  useEffect(() => {
    const handleRecoveryToken = async () => {
      // URL hash'ini kontrol et (# sonrası)
      const hash = window.location.hash
      if (hash && hash.includes('type=recovery')) {
        const supabase = createClient()

        // Hash'ten parametreleri çıkar
        const params = new URLSearchParams(hash.substring(1))
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')

        if (accessToken && refreshToken) {
          // Oturumu ayarla
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (!error) {
            // Şifre güncelleme sayfasına yönlendir
            router.replace('/update-password')
            return
          }
        }
      }
      setIsRecoveryLoading(false)
    }

    handleRecoveryToken()
  }, [router])

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
    } catch (error: any) {
      console.error("Giriş sırasında bir hata oluştu:", error)

      let message = "Giriş yapılamadı. Lütfen bilgilerinizi kontrol edin."
      const errorMessage = error.message?.toLowerCase() || ""

      if (errorMessage.includes("invalid login credentials")) {
        message = "E-posta adresi veya şifre hatalı. Lütfen bilgilerinizi kontrol edip tekrar deneyin."
      } else if (errorMessage.includes("email not confirmed")) {
        message = "Hesabınız henüz onaylanmamış. Lütfen e-postanıza gönderilen doğrulama linkine tıklayın ve ardından tekrar giriş yapın."
      } else if (errorMessage.includes("too many requests")) {
        message = "Çok fazla giriş denemesi yaptınız. Lütfen kısa bir süre bekleyip tekrar deneyin."
      } else if (error.message) {
        // Beklenmeyen bir hata mesajı varsa kullanıcıya göster
        message = `Hata: ${error.message}`
      }

      setError(message)
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Google ile giriş yapılamadı.")
      setIsLoading(false)
    }
  }

  // Recovery token işlenirken loading göster
  if (isRecoveryLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:via-blue-950/20 dark:to-indigo-950/20 p-4">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <span className="text-muted-foreground">Yükleniyor...</span>
        </div>
      </div>
    )
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
            <div className="" style={{ animation: 'pulse 2s ease-in-out infinite' }}></div>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">EGL Yıllık</h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">Hoş Geldiniz</p>
          </div>
        </div>

        {/* Card */}
        <Card className="border-2 border-blue-200 dark:border-blue-800/50 shadow-xl">
          <CardHeader className="space-y-1 text-center pb-4 border-b">
            <CardTitle className="text-lg sm:text-xl font-bold">Giriş Yap</CardTitle>
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
                    <Link href="/forgot-password" prefetch={false} className="text-xs text-muted-foreground hover:text-primary">
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

                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200 dark:border-slate-800" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-slate-900 px-2 text-muted-foreground">Veya</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-10 border-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google ile Giriş Yap
                </Button>
              </div>
            </form>
          </CardContent>

          <CardFooter className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/30 border-t p-3 sm:p-4 justify-center">
            <div className="text-xs sm:text-sm text-muted-foreground">
              Hesabınız yok mu?{" "}
              <Link href="/signup" prefetch={false} className="font-semibold text-blue-600 hover:text-blue-700 underline underline-offset-2">
                Kayıt Ol
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}