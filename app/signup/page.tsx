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
import { UserPlus, Loader2, AlertCircle } from "lucide-react"
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
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) throw authError

      if (authData.user) {
        const { error: profileError } = await supabase.from("profiles").insert({
          id: authData.user.id,
          first_name: firstName,
          last_name: lastName,
          school_number: schoolNumber,
          class: classRoom,
          level: ROLES.USER,
        })

        if (profileError) throw profileError
      }

      router.push("/dashboard")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Bir hata oluştu.")
    } finally {
      setIsLoading(false)
    }
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
              </div>
            </form>
          </CardContent>

          <CardFooter className="bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-950/30 dark:to-emerald-950/30 border-t p-3 justify-center">
            <div className="text-xs sm:text-sm text-muted-foreground">
              Hesabınız var mı?{" "}
              <Link href="/login" className="font-semibold text-green-600 hover:text-green-700 underline underline-offset-2">
                Giriş Yap
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div >
  )
}