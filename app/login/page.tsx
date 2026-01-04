"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Lock, LayoutDashboard, Shield } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false) // Admin kontrolü için yeni state
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
        // Profil kontrolü
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userData.user.id)
          .single()

        if (profile?.role === "admin") {
          // Admin ise yönlendirme yapma, seçim ekranını aktif et
          setIsAdmin(true)
          setIsLoading(false) 
          router.refresh() // Session cookie'sinin server tarafında güncellenmesi için
          return
        } 
        
        // Admin değilse direkt dashboard'a at
        router.push("/dashboard")
      } else {
        router.push("/dashboard")
      }
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Bir hata oluştu")
      setIsLoading(false)
    }
  }

  // Admin seçim ekranı render fonksiyonu
  if (isAdmin) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center bg-background p-6 md:p-10">
        <div className="w-full max-w-sm">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">Hoş Geldiniz</h1>
              <p className="text-sm text-muted-foreground">Devam etmek istediğiniz alanı seçin</p>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-xl text-center">Yönlendirme Seçimi</CardTitle>
                <CardDescription className="text-center">Admin yetkisine sahipsiniz</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <Button 
                  onClick={() => router.push("/admin")} 
                  className="w-full h-12 text-base" 
                  variant="default"
                >
                  <Shield className="mr-2 h-5 w-5" />
                  Admin Paneline Git
                </Button>
                <Button 
                  onClick={() => router.push("/dashboard")} 
                  className="w-full h-12 text-base" 
                  variant="outline"
                >
                  <LayoutDashboard className="mr-2 h-5 w-5" />
                  Dashboard'a Git
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Standart Login Formu
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Güvenli Mesajlaşma</h1>
            <p className="text-sm text-muted-foreground">Hesabınıza erişmek için giriş yapın</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Giriş Yap</CardTitle>
              <CardDescription>E-posta ve şifrenizi giriniz</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="email">E-posta</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="ornek@okul.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Şifre</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  {error && (
                    <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
                  )}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Giriş yapılıyor..." : "Giriş Yap"}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  Hesabınız yok mu?{" "}
                  <Link href="/signup" className="underline underline-offset-4 hover:text-primary">
                    Kayıt Ol
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
