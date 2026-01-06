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
import { Lock, LayoutDashboard, Shield, School, Loader2, AlertCircle, ArrowRight } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
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

      const { data: userData } = await supabase.auth.getUser()

      if (userData.user) {
        // Profil ve rol kontrolü
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userData.user.id)
          .single()

        if (profile?.role === "admin") {
          // Admin ise seçim ekranını aktif et
          setIsAdmin(true)
          setIsLoading(false)
          router.refresh() // Server componentleri güncelle
          return
        }

        // Admin değilse direkt dashboard
        router.push("/dashboard")
        router.refresh()
      } else {
        router.push("/dashboard")
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Giriş yapılamadı. Bilgilerinizi kontrol edin.")
      setIsLoading(false)
    }
  }

  // Ortak stil sınıfı (Background)
  const containerClass = "flex min-h-screen w-full items-center justify-center bg-slate-50/50 p-6 md:p-10 relative overflow-hidden"
  const gradientClass = "fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/50 via-white to-white pointer-events-none"

  // --- ADMIN SEÇİM EKRANI ---
  if (isAdmin) {
    return (
      <div className={containerClass}>
        <div className={gradientClass} />

        <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
          <div className="flex flex-col items-center gap-4 mb-8 text-center">
            <div className="bg-amber-100 p-3 rounded-full ring-4 ring-amber-50">
              <Shield className="h-8 w-8 text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 font-serif">Yönetici Erişimi</h1>
              <p className="text-slate-500">Devam etmek istediğiniz paneli seçin.</p>
            </div>
          </div>

          <Card className="border-slate-200 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-6 grid gap-4">
              <Button
                onClick={() => router.push("/admin")}
                className="w-full h-16 text-base justify-between group bg-slate-900 hover:bg-slate-800 shadow-lg shadow-slate-900/20"
                variant="default"
              >
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-amber-400" />
                  <div className="flex flex-col items-start">
                    <span className="font-semibold">Yönetim Paneli</span>
                    <span className="text-[10px] text-slate-400 font-normal">Sistemi ve kullanıcıları yönet</span>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-500">Veya</span>
                </div>
              </div>

              <Button
                onClick={() => router.push("/dashboard")}
                className="w-full h-14 text-base justify-start text-slate-600 border-slate-200 hover:text-primary hover:bg-primary/5 hover:border-primary/30"
                variant="outline"
              >
                <LayoutDashboard className="mr-3 h-5 w-5" />
                Yıllık Sayfasına Git
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // --- STANDART GİRİŞ FORMU ---
  return (
    <div className={containerClass}>
      <div className={gradientClass} />

      <div className="w-full max-w-[400px] animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* Logo Alanı */}
        <div className="flex flex-col items-center gap-2 mb-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
            <School className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-serif text-slate-900 tracking-tight">EGL Yıllık</h1>
            <p className="text-sm text-slate-500 font-medium">Hoş Geldiniz</p>
          </div>
        </div>

        <Card className="border-slate-200/60 shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center pb-6 border-b border-slate-100">
            <CardTitle className="text-xl font-bold text-slate-800">Giriş Yap</CardTitle>
            <CardDescription className="text-slate-500">
              Devam etmek için hesabınıza erişin
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleLogin}>
              <div className="flex flex-col gap-5">
                <div className="grid gap-2">
                  <Label htmlFor="email">E-posta Adresi</Label>
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

                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Şifre</Label>
                    <Link href="/forgot-password" className="ml-auto text-xs text-muted-foreground hover:text-primary transition-colors">
                      Şifremi unuttum?
                    </Link>
                  </div>
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

                {error && (
                  <div className="rounded-lg bg-red-50 px-3 py-3 text-sm text-red-600 border border-red-100 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span className="leading-tight">{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-10 shadow-md hover:shadow-lg hover:shadow-primary/20 transition-all duration-300"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Giriş Yapılıyor...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Giriş Yap
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>

          <CardFooter className="bg-slate-50/50 border-t border-slate-100 p-4 justify-center">
            <div className="text-sm text-slate-500">
              Hesabınız yok mu?{" "}
              <Link href="/signup" className="font-semibold text-primary underline underline-offset-2 hover:text-primary/80 transition-colors">
                Kayıt Ol
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}