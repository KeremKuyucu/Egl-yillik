"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Users, GraduationCap, AlertCircle } from "lucide-react"

interface Profile {
  id: string
  first_name: string
  last_name: string
  class: string
}

interface NewTextFormProps {
  classmates: Profile[]
  others: Profile[]
  userClass: string
}

export default function NewTextForm({ classmates, others, userClass }: NewTextFormProps) {
  const [recipientId, setRecipientId] = useState("")
  const [content, setContent] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (!recipientId) {
      setError("Lütfen bir kişi seçin")
      setIsLoading(false)
      return
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("Oturum açmanız gerekiyor")
      }

      const { error: insertError } = await supabase.from("texts").insert({
        author_id: user.id,
        recipient_id: recipientId,
        content: content,
      })

      if (insertError) throw insertError

      router.push("/dashboard")
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Bir hata oluştu")
    } finally {
      setIsLoading(false)
    }
  }

  const hasClassmatesLeft = classmates.length > 0

  return (
    <div className="space-y-4">
      {hasClassmatesLeft && (
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-amber-900 dark:text-amber-100">
              <AlertCircle className="h-4 w-4" />
              Zorunlu Yazımlar
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-amber-800 dark:text-amber-200">
            {userClass} sınıfındaki {classmates.length} arkadaşına daha yazman gerekiyor.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Yeni Metin Oluştur</CardTitle>
          <CardDescription>Seçtiğin kişi için anlamlı bir mesaj yaz</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="recipient">Kime Yazıyorsun?</Label>
              <Select value={recipientId} onValueChange={setRecipientId} required>
                <SelectTrigger id="recipient">
                  <SelectValue placeholder="Kişi seç" />
                </SelectTrigger>
                <SelectContent>
                  {hasClassmatesLeft && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Sınıf Arkadaşlarım ({userClass}) - Zorunlu
                      </div>
                      {classmates.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          <div className="flex items-center gap-2">
                            <span>
                              {profile.first_name} {profile.last_name}
                            </span>
                            <Badge variant="default" className="text-xs">
                              {profile.class}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  )}

                  {others.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-1 mt-2">
                        <GraduationCap className="h-3 w-3" />
                        Diğer Sınıflar - İsteğe Bağlı
                      </div>
                      {others.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          <div className="flex items-center gap-2">
                            <span>
                              {profile.first_name} {profile.last_name}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {profile.class}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  )}

                  {!hasClassmatesLeft && others.length === 0 && (
                    <div className="px-2 py-6 text-center text-sm text-muted-foreground">Herkese yazmışsın! 🎉</div>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Her kişiye sadece bir kez yazabilirsin</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Mesajın</Label>
              <Textarea
                id="content"
                placeholder="Burada ne yazacağını düşün... Bu kişi için anlamlı bir şeyler yaz!"
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                className="resize-none"
              />
            </div>

            {error && <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? "Kaydediliyor..." : "Metni Kaydet"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push("/dashboard")}>
                İptal
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
