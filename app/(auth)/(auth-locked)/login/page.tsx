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
import { Loader2, AlertCircle, LogIn } from "lucide-react"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRecoveryLoading, setIsRecoveryLoading] = useState(true)

  const translateAuthError = (message: string) => {
    const lower = message.toLowerCase()
    if (lower.includes("invalid login credentials")) return "E-posta adresi veya şifre hatalı."
    if (lower.includes("email not confirmed")) return "E-posta adresiniz henüz onaylanmamış."
    if (lower.includes("too many requests")) return "Çok fazla deneme yaptınız, lütfen bekleyin."
    if (lower.includes("database error saving new user"))
      return "Kayıtlar şu an kapalıdır. Google ile yeni üyelik oluşturulamaz."
    return message || "Giriş yapılamadı."
  }

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const hashParams = window.location.hash
      ? new URLSearchParams(window.location.hash.substring(1))
      : null

    const oauthError =
      searchParams.get("error_description") ||
      searchParams.get("error") ||
      hashParams?.get("error_description") ||
      hashParams?.get("error")

    if (oauthError) {
      const message = translateAuthError(oauthError)
      setError(message)
      toast.error(message)
    }

    const handleRecovery = async () => {
      if (!hashParams) {
        setIsRecoveryLoading(false)
        return
      }

      if (hashParams.get("type") === "recovery") {
        const accessToken = hashParams.get("access_token")
        const refreshToken = hashParams.get("refresh_token")

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (!error) {
            router.replace("/update-password")
            return
          }
        }
      }

      setIsRecoveryLoading(false)
    }

    handleRecovery()
  }, [router, supabase])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      const searchParams = new URLSearchParams(window.location.search)
      const raw =
        searchParams.get("next") ||
        searchParams.get("callbackUrl") ||
        "/home"

      const safe =
        raw.startsWith("/") && !raw.startsWith("//") ? raw : "/home"

      router.push(safe)
    } catch (err: any) {
      const message = translateAuthError(err?.message || "")
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
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
    } catch (err: any) {
      const message = translateAuthError(err?.message || "")
      setError(message)
      setIsLoading(false)
    }
  }

  if (isRecoveryLoading) {
    return (
      <div className="flex w-full h-64 items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-muted-foreground">Yükleniyor...</span>
        </div>
      </div>
    )
  }

  return (
    <Card className="border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800">
      <CardHeader className="space-y-1 text-center pb-4 border-b border-slate-100 dark:border-slate-800">
        <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
          Giriş Yap
        </CardTitle>
        <CardDescription className="text-sm">
          Hesabınıza erişin
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-6 px-6">
        <form onSubmit={handleLogin}>
          <div className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                type="email"
                required
                className="h-10 bg-white/50 dark:bg-slate-950/50"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Şifre</Label>
                <Link
                  href="/forgot-password"
                  prefetch={false}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Unuttum?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                required
                className="h-10 bg-white/50 dark:bg-slate-950/50"
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
              className="w-full h-10 bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
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

            <Button type="button" variant="outline" className="w-full h-10 flex items-center justify-center gap-2" onClick={handleGoogleLogin} disabled={isLoading} > {/* Google SVG */} <svg className="w-4 h-4" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg"> <path fill="#4285F4" d="M533.5 278.4c0-18.1-1.5-35.5-4.3-52.4H272v99.3h147.1c-6.3 34-25.1 62.8-53.7 82l87 67.6c50.7-46.7 81.1-115.3 81.1-196.5z" /> <path fill="#34A853" d="M272 544.3c72.6 0 133.7-24 178.3-65.2l-87-67.6c-24.2 16.2-55.3 25.8-91.3 25.8-70.1 0-129.5-47.3-150.7-111.2l-89.2 69c44.7 88 135.7 149.2 240 149.2z" /> <path fill="#FBBC05" d="M121.3 323.3c-10.3-30.8-10.3-64.2 0-95l-89.2-69c-39.4 77-39.4 167.3 0 244.3l89.2-80.3z" /> <path fill="#EA4335" d="M272 107.5c37.8-0.6 73.9 13 101.2 38.3l75.7-75.7C405.7 24.1 344.6 0 272 0 167.7 0 76.7 61.2 32 149.2l89.2 69c21.2-63.9 80.6-111.2 150.8-110.7z" /> </svg> Google ile Giriş Yap </Button>
          </div>
        </form>
      </CardContent>

      <CardFooter className="bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 p-4 justify-center">
        <div className="text-sm text-muted-foreground">
          Hesabınız yok mu?{" "}
          <Link
            href="/signup"
            prefetch={false}
            className="font-semibold text-blue-600 underline"
          >
            Kayıt Ol
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}