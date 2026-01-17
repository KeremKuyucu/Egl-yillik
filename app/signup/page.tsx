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
import { UserPlus, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ROLES } from "@/lib/constants"

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
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

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
      // Okul numarası kullanımda mı kontrol et
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("school_number", schoolNumber)
        .single()

      if (existingProfile) {
        throw new Error("Bu okul numarası zaten kullanımda.")
      }

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

      // Eğer e-posta doğrulaması gerekiyorsa session null döner
      if (authData.user && !authData.session) {
        setIsSuccess(true)
        return
      }

      if (authData.user && authData.session) {
        const { error: profileError } = await supabase.from("profiles").insert({
          id: authData.user.id,
          first_name: firstName,
          last_name: lastName,
          school_number: schoolNumber,
          class: classRoom,
          level: ROLES.USER,
        })

        if (profileError) throw profileError

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

  if (isSuccess) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-slate-950 dark:via-green-950/20 dark:to-emerald-950/20 p-4">
        <Card className="w-full max-w-md border-2 border-green-200 dark:border-green-800/50 shadow-xl text-center p-6 space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Harika! Son bir adım kaldı.</CardTitle>
          <CardDescription className="text-base">
            <span className="font-bold text-slate-900 dark:text-white">{email}</span> adresine bir doğrulama bağlantısı gönderdik.
            Lütfen e-postanı kontrol et ve hesabını onayla.
            <br />
            <span className="text-xs text-amber-600 dark:text-amber-400 mt-2 block font-medium italic">
              * E-posta gelmediyse spam (gereksiz) klasörünü kontrol etmeyi unutma!
            </span>
          </CardDescription>
          <div className="pt-4">
            <Link href="/login" prefetch={false}>
              <Button variant="outline" className="w-full">Giriş Sayfasına Dön</Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-slate-950 dark:via-green-950/20 dark:to-emerald-950/20 p-4">
      {/* Mobile Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-10 -left-10 w-64 h-64 sm:w-96 sm:h-96 bg-green-300 rounded-full mix-blend-multiply filter blur-2xl sm:blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-10 -right-10 w-64 h-64 sm:w-96 sm:h-96 bg-teal-300 rounded-full mix-blend-multiply filter blur-2xl sm:blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2 mb-4 text-center">
          <img src="/image.png" className="h-14 w-14 sm:h-16 sm:w-16" />
          <div>
            <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">EGL Yıllık</h1>
            <p className="text-xs text-muted-foreground">2026 Mezuniyeti</p>
          </div>
        </div>

        <Card className="border-2 border-green-200 dark:border-green-800/50 shadow-xl">
          <CardHeader className="space-y-1 text-center pb-3 border-b">
            <CardTitle className="text-base sm:text-lg font-bold">Hesap Oluştur</CardTitle>
            <CardDescription className="text-xs">
              Yıllık sistemine katıl
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4 px-4 sm:px-6">
            <form onSubmit={handleSignUp}>
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="first-name" className="text-xs">Ad</Label>
                    <Input
                      id="first-name"
                      placeholder="Adınız"
                      required
                      className="h-9 text-sm"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="last-name" className="text-xs">Soyad</Label>
                    <Input
                      id="last-name"
                      placeholder="Soyadınız"
                      required
                      className="h-9 text-sm"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="school-number" className="text-xs">Okul No</Label>
                    <Input
                      id="school-number"
                      placeholder="123"
                      required
                      maxLength={3}
                      className="h-9 text-sm"
                      value={schoolNumber}
                      onChange={(e) => setSchoolNumber(e.target.value.replace(/\D/g, ""))}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="class" className="text-xs">Sınıf</Label>
                    <Select value={classRoom} onValueChange={setClassRoom} required>
                      <SelectTrigger id="class" className="h-9 text-sm">
                        <SelectValue placeholder="Seç" />
                      </SelectTrigger>
                      <SelectContent>
                        {["12A", "12B", "12C", "12D", "12E", "12F"].map((cls) => (
                          <SelectItem key={cls} value={cls} className="text-sm">
                            {cls.replace("12", "12-")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="email" className="text-xs">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ornek@ogrenci.com"
                    required
                    className="h-9 text-sm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="password" className="text-xs">Şifre</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="******"
                    required
                    className="h-9 text-sm"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="confirm-password" className="text-xs">Şifre Tekrar</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="******"
                    required
                    className="h-9 text-sm"
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
                  className="w-full h-9 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white shadow-lg shadow-green-500/30 border-0 text-sm mt-1"
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
                  className="w-full h-9 border-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2 text-sm"
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

          <CardFooter className="bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-950/30 dark:to-emerald-950/30 border-t p-3 justify-center">
            <div className="text-xs sm:text-sm text-muted-foreground">
              Hesabınız var mı?{" "}
              <Link href="/login" prefetch={false} className="font-semibold text-green-600 hover:text-green-700 underline underline-offset-2">
                Giriş Yap
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div >
  )
}