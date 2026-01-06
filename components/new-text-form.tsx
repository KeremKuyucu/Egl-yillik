"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Users, GraduationCap, AlertCircle, Send, Sparkles, Loader2, X } from "lucide-react"

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

      // Supabase insert işlemi
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
    <div className="space-y-6">

      {/* İlerleme / Uyarı Alanı */}
      {hasClassmatesLeft ? (
        <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-start gap-3 shadow-sm">
          <div className="bg-amber-100 p-2 rounded-full shrink-0">
            <AlertCircle className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-900">Görev: Sınıf Arkadaşların Bekliyor!</h4>
            <p className="text-xs text-amber-700/80 mt-1 leading-relaxed">
              <span className="font-semibold">{userClass}</span> sınıfından hala yazman gereken <span className="font-bold underline">{classmates.length} kişi</span> var. Mezuniyet yıllığında kimseyi boş geçmeyelim.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center gap-3 shadow-sm">
          <Sparkles className="h-5 w-5 text-emerald-600 fill-emerald-100" />
          <p className="text-sm font-medium text-emerald-800">
            Harika! Kendi sınıfındaki herkese yazdın. Şimdi diğer sınıflara geçebilirsin.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Kişi Seçimi */}
        <div className="space-y-2">
          <Label htmlFor="recipient" className="text-sm font-semibold text-slate-700">
            Kime Yazıyorsun?
          </Label>
          <Select value={recipientId} onValueChange={setRecipientId} required>
            <SelectTrigger id="recipient" className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-primary/20">
              <SelectValue placeholder="Bir arkadaşını seç..." />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {hasClassmatesLeft && (
                <>
                  <div className="px-2 py-2 text-xs font-bold text-slate-500 bg-slate-50 flex items-center gap-2 border-b border-slate-100 sticky top-0 z-10">
                    <Users className="h-3 w-3" />
                    Sınıf Arkadaşlarım ({userClass})
                    <Badge variant="secondary" className="ml-auto text-[10px] bg-amber-100 text-amber-700 hover:bg-amber-100">Zorunlu</Badge>
                  </div>
                  {classmates.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id} className="cursor-pointer py-2.5">
                      <div className="flex items-center justify-between w-full gap-2">
                        <span className="font-medium text-slate-700">
                          {profile.first_name} {profile.last_name}
                        </span>
                        <Badge variant="outline" className="text-[10px] border-slate-200 text-slate-400 font-normal">
                          {profile.class}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </>
              )}

              {others.length > 0 && (
                <>
                  <div className="px-2 py-2 text-xs font-bold text-slate-500 bg-slate-50 flex items-center gap-2 border-b border-slate-100 border-t mt-1 sticky top-0 z-10">
                    <GraduationCap className="h-3 w-3" />
                    Diğer Sınıflar
                    <Badge variant="secondary" className="ml-auto text-[10px] bg-slate-100 text-slate-500 hover:bg-slate-100">İsteğe Bağlı</Badge>
                  </div>
                  {others.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id} className="cursor-pointer py-2.5">
                      <div className="flex items-center justify-between w-full gap-2">
                        <span className="text-slate-600">
                          {profile.first_name} {profile.last_name}
                        </span>
                        <Badge variant="outline" className="text-[10px] border-slate-200 text-slate-400 font-normal">
                          {profile.class}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </>
              )}

              {!hasClassmatesLeft && others.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-slate-400">
                  <Sparkles className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                  Görünüşe göre herkese yazmışsın! 🎉
                </div>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Mesaj Alanı */}
        <div className="space-y-3">
          <Label htmlFor="content" className="text-sm font-semibold text-slate-700 flex justify-between">
            <span>Mesajın</span>
            <span className="text-xs font-normal text-slate-400">İçinden geldiği gibi...</span>
          </Label>
          <Textarea
            id="content"
            placeholder="Güzel bir anıdan bahset, gelecekte hatırlamasını istediğin bir not bırak..."
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[250px] resize-y bg-slate-50 border-slate-200 focus:bg-white focus:border-primary/50 text-base leading-relaxed p-4 shadow-inner transition-all"
          />
          <p className="text-xs text-right text-slate-400">
            {content.length} karakter
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 border border-red-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Butonlar */}
        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1 h-11 shadow-md hover:shadow-lg hover:shadow-primary/20 transition-all text-base"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Yıllığa İşleniyor...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Metni Kaydet
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard")}
            className="h-11 px-6 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          >
            <X className="mr-2 h-4 w-4" />
            İptal
          </Button>
        </div>
      </form>
    </div>
  )
}