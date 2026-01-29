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
import { UserPlus, Loader2, AlertCircle, CheckCircle2, Lock } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ROLES } from "@/lib/constants"
import { getSystemClasses } from "@/app/actions/settings"
import { checkRegistrationEnabled } from "./actions"

export default function SignUpPage() {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [schoolNumber, setSchoolNumber] = useState("")
  const [classRoom, setClassRoom] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [registrationEnabled, setRegistrationEnabled] = useState<boolean | null>(null)
  const [classes, setClasses] = useState<string[]>([])
  const router = useRouter()

  useEffect(() => {
    checkRegistrationEnabled().then((result) => {
      setRegistrationEnabled(result.enabled)
    })
    getSystemClasses().then(data => {
      setClasses(data.map(c => c.name))
    })
  }, [])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    const regCheck = await checkRegistrationEnabled()
    if (!regCheck.enabled) {
      setError("Kayıt şu anda kapalıdır.")
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("Şifreler eşleşmiyor.")
      setIsLoading(false)
      return
    }

    if (schoolNumber.length !== 3 || !/^\d{3}$/.test(schoolNumber)) {
      setError("Okul numarası 3 haneli olmalı.")
      setIsLoading(false)
      return
    }

    if (!classRoom) {
      setError("Lütfen sınıfınızı seçin.")
      setIsLoading(false)
      return
    }


    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            school_number: schoolNumber,
            class: classRoom,
          }
        }
      })

      if (authError) throw authError

      if (authData.user && !authData.session) {
        setIsSuccess(true)
        return
      }

      if (authData.user && authData.session) {
        router.push("/dashboard")
        router.refresh()
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Bir hata oluştu.")
    } finally {
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
      setError(error instanceof Error ? error.message : "Google ile kayıt olunamadı.")
      setIsLoading(false)
    }
  }

  if (registrationEnabled === null) {
    return (
      <div className="flex w-full h-64 items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Yükleniyor...</span>
        </div>
      </div>
    )
  }

  if (!registrationEnabled) {
    return (
      <Card className="w-full border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xl ring-1 ring-slate-200 dark:ring-slate-800 text-center p-6 space-y-4">
        <div className="mx-auto w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-2">
          <Lock className="h-8 w-8 text-slate-500" />
        </div>
        <CardTitle className="text-xl font-bold text-slate-800 dark:text-white">Kayıt Kapalı</CardTitle>
        <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
          Yeni kayıtlar şu anda kabul edilmiyor. Lütfen daha sonra tekrar deneyin veya zaten bir hesabınız varsa giriş yapın.
        </CardDescription>
        <div className="pt-4 space-y-3">
          <Link href="/login" prefetch={false} className="block">
            <Button className="w-full bg-slate-900 text-white hover:bg-slate-800">
              Giriş Yap
            </Button>
          </Link>
        </div>
      </Card>
    )
  }

  if (isSuccess) {
    return (
      <Card className="w-full border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xl ring-1 ring-emerald-200 dark:ring-emerald-800 text-center p-6 space-y-4">
        <div className="mx-auto w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-2">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <CardTitle className="text-xl font-bold text-emerald-700 dark:text-emerald-400">Kayıt Başarılı!</CardTitle>
        <CardDescription className="text-sm">
          <span className="font-bold text-slate-900 dark:text-white block mb-2">{email}</span>
          adresine bir doğrulama bağlantısı gönderdik. Lütfen e-postanı kontrol et.
          <br />
          <span className="text-xs text-amber-600 dark:text-amber-400 mt-3 block font-medium italic bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
            * E-posta gelmediyse spam (gereksiz) klasörünü kontrol etmeyi unutma!
          </span>
        </CardDescription>
        <div className="pt-4">
          <Link href="/login" prefetch={false}>
            <Button variant="outline" className="w-full border-emerald-200 hover:bg-emerald-50 text-emerald-700">Giriş Sayfasına Dön</Button>
          </Link>
        </div>
      </Card>
    )
  }

  return (
    <Card className="border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800">
      <CardHeader className="space-y-1 text-center pb-3 border-b border-slate-100 dark:border-slate-800">
        <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">Hesap Oluştur</CardTitle>
        <CardDescription className="text-sm">
          Aramıza katıl
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-6 px-4 sm:px-6">
        <form onSubmit={handleSignUp}>
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="first-name">Ad</Label>
                <Input
                  id="first-name"
                  placeholder="Ad"
                  required
                  className="h-9 bg-white/50 dark:bg-slate-950/50"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="last-name">Soyad</Label>
                <Input
                  id="last-name"
                  placeholder="Soyad"
                  required
                  className="h-9 bg-white/50 dark:bg-slate-950/50"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="school-number">Okul No</Label>
                <Input
                  id="school-number"
                  placeholder="123"
                  required
                  maxLength={3}
                  className="h-9 bg-white/50 dark:bg-slate-950/50"
                  value={schoolNumber}
                  onChange={(e) => setSchoolNumber(e.target.value.replace(/\D/g, ""))}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="class">Sınıf</Label>
                <Select value={classRoom} onValueChange={setClassRoom} required>
                  <SelectTrigger id="class" className="h-9 bg-white/50 dark:bg-slate-950/50">
                    <SelectValue placeholder="Seç" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls} value={cls}>
                        {cls.replace("12", "12-")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="ornek@ogrenci.com"
                required
                className="h-9 bg-white/50 dark:bg-slate-950/50"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="password">Şifre</Label>
              <Input
                id="password"
                type="password"
                placeholder="******"
                required
                className="h-9 bg-white/50 dark:bg-slate-950/50"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="confirm-password">Şifre Tekrar</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="******"
                required
                className="h-9 bg-white/50 dark:bg-slate-950/50"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              className="w-full h-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20 border-0 mt-1"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-3.5 w-3.5" />
                  Kayıt Ol
                </>
              )}
            </Button>

            <div className="relative my-1">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-white dark:bg-slate-900 px-2 text-muted-foreground">Veya</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-10 border hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              Google ile Kayıt Ol
            </Button>
          </div>
        </form>
      </CardContent>

      <CardFooter className="bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 p-3 justify-center">
        <div className="text-sm text-muted-foreground">
          Hesabınız var mı?{" "}
          <Link href="/login" prefetch={false} className="font-semibold text-blue-600 hover:text-blue-700 underline underline-offset-2">
            Giriş Yap
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}