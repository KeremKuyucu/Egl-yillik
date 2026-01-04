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
import { UserPlus } from "lucide-react"
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
      setError("Şifreler eşleşmiyor")
      setIsLoading(false)
      return
    }

    if (schoolNumber.length !== 3 || !/^\d{3}$/.test(schoolNumber)) {
      setError("Okul numarası 3 haneli olmalıdır")
      setIsLoading(false)
      return
    }

    if (!classRoom) {
      setError("Lütfen sınıf seçin")
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
      setError(error instanceof Error ? error.message : "Bir hata oluştu")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <UserPlus className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Hesap Oluştur</h1>
            <p className="text-sm text-muted-foreground">Yıllık yazma platformumuza katılın</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Kayıt Ol</CardTitle>
              <CardDescription>Başlamak için hesabınızı oluşturun</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="first-name">Ad</Label>
                    <Input
                      id="first-name"
                      type="text"
                      placeholder="Adınız"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="last-name">Soyad</Label>
                    <Input
                      id="last-name"
                      type="text"
                      placeholder="Soyadınız"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="school-number">Okul Numarası (3 haneli)</Label>
                    <Input
                      id="school-number"
                      type="text"
                      placeholder="123"
                      required
                      maxLength={3}
                      pattern="\d{3}"
                      value={schoolNumber}
                      onChange={(e) => setSchoolNumber(e.target.value.replace(/\D/g, ""))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="class">Sınıf</Label>
                    <Select value={classRoom} onValueChange={setClassRoom} required>
                      <SelectTrigger id="class">
                        <SelectValue placeholder="Sınıf seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12A">12-A</SelectItem>
                        <SelectItem value="12B">12-B</SelectItem>
                        <SelectItem value="12C">12-C</SelectItem>
                        <SelectItem value="12D">12-D</SelectItem>
                        <SelectItem value="12E">12-E</SelectItem>
                        <SelectItem value="12F">12-F</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
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
                  <div className="grid gap-2">
                    <Label htmlFor="confirm-password">Şifre Tekrar</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  {error && (
                    <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
                  )}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Hesap oluşturuluyor..." : "Kayıt Ol"}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  Zaten hesabınız var mı?{" "}
                  <Link href="/login" className="underline underline-offset-4 hover:text-primary">
                    Giriş Yap
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
