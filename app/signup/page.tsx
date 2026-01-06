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
import { UserPlus, School, Loader2, AlertCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
      setError("Şifreler birbiriyle eşleşmiyor.")
      setIsLoading(false)
      return
    }

    if (schoolNumber.length !== 3 || !/^\d{3}$/.test(schoolNumber)) {
      setError("Okul numarası 3 haneli olmalıdır.")
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
          role: "user",
        })

        if (profileError) throw profileError
      }

      router.push("/dashboard")
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

      <div className="w-full max-w-[450px] animate-in fade-in zoom-in-95 duration-500">

        {/* Logo / Marka Alanı */}
        <div className="flex flex-col items-center gap-2 mb-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
            <School className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-serif text-slate-900 tracking-tight">EGL Yıllık</h1>
            <p className="text-sm text-slate-500 font-medium">2026 Mezuniyeti</p>
          </div>
        </div>

        <Card className="border-slate-200/60 shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center pb-6 border-b border-slate-100">
            <CardTitle className="text-xl font-bold text-slate-800">Hesap Oluştur</CardTitle>
            <CardDescription className="text-slate-500">
              Yıllık sistemine katılmak için bilgilerinizi girin.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleSignUp}>
              <div className="flex flex-col gap-5">

                {/* İsim Soyisim - Yan Yana */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="first-name">Ad</Label>
                    <Input
                      id="first-name"
                      placeholder="Adınız"
                      required
                      className="bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="last-name">Soyad</Label>
                    <Input
                      id="last-name"
                      placeholder="Soyadınız"
                      required
                      className="bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>

                {/* Okul No ve Sınıf - Yan Yana */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="school-number">Okul No</Label>
                    <Input
                      id="school-number"
                      placeholder="123"
                      required
                      maxLength={3}
                      pattern="\d{3}"
                      className="bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                      value={schoolNumber}
                      onChange={(e) => setSchoolNumber(e.target.value.replace(/\D/g, ""))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="class">Sınıf</Label>
                    <Select value={classRoom} onValueChange={setClassRoom} required>
                      <SelectTrigger id="class" className="bg-slate-50 border-slate-200 focus:bg-white">
                        <SelectValue placeholder="Seç" />
                      </SelectTrigger>
                      <SelectContent>
                        {["12A", "12B", "12C", "12D", "12E", "12F"].map((cls) => (
                          <SelectItem key={cls} value={cls}>
                            {cls.replace("12", "12-")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Email */}
                <div className="grid gap-2">
                  <Label htmlFor="email">Email Adresi</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ornek@ogrenci.com"
                    required
                    className="bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {/* Şifreler */}
                <div className="grid gap-2">
                  <Label htmlFor="password">Şifre</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="******"
                    required
                    className="bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirm-password">Şifre Tekrar</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="******"
                    required
                    className="bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                {error && (
                  <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 border border-red-100 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full mt-2 shadow-md hover:shadow-lg hover:shadow-primary/20 transition-all duration-300"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Kayıt Ol ve Başla
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>

          <CardFooter className="bg-slate-50/50 border-t border-slate-100 p-4 justify-center">
            <div className="text-sm text-slate-500">
              Zaten hesabınız var mı?{" "}
              <Link href="/login" className="font-semibold text-primary underline underline-offset-2 hover:text-primary/80 transition-colors">
                Giriş Yap
              </Link>
            </div>
          </CardFooter>
        </Card>

        <p className="text-center text-xs text-slate-400 mt-6 px-6">
          Kayıt olarak okul kurallarını ve yıllık katılım şartlarını kabul etmiş olursunuz.
        </p>
      </div>
    </div>
  )
}