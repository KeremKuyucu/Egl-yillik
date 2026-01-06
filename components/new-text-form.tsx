"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  Users,
  GraduationCap,
  AlertCircle,
  Send,
  Sparkles,
  Loader2,
  X,
  Check,
  ChevronsUpDown,
  Search
} from "lucide-react"

// Combobox için gerekli Shadcn bileşenleri
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

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
  preSelectedId?: string
}

export default function NewTextForm({ classmates, others, userClass, preSelectedId }: NewTextFormProps) {
  const [recipientId, setRecipientId] = useState(preSelectedId || "")
  const [open, setOpen] = useState(false) // Combobox açık/kapalı durumu
  const [content, setContent] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Seçili kişinin adını bulmak için yardımcı
  const selectedProfile = [...classmates, ...others].find(p => p.id === recipientId)

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

        {/* Kişi Seçimi (Combobox / Autocomplete) */}
        <div className="space-y-2 flex flex-col">
          <Label className="text-sm font-semibold text-slate-700">
            Kime Yazıyorsun?
          </Label>

          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between h-11 bg-slate-50 border-slate-200 hover:bg-white hover:border-primary/30 text-slate-900 font-normal shadow-sm"
              >
                {selectedProfile ? (
                  <span className="flex items-center gap-2">
                    <span className="font-medium">{selectedProfile.first_name} {selectedProfile.last_name}</span>
                    <Badge variant="secondary" className="text-[10px] h-4 px-1 bg-slate-100 text-slate-500 font-normal">
                      {selectedProfile.class}
                    </Badge>
                  </span>
                ) : (
                  <span className="text-slate-500">Bir arkadaşını ara...</span>
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>

            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
              <Command>
                <CommandInput placeholder="İsim veya sınıf ara..." />
                <CommandList>
                  <CommandEmpty className="py-6 text-center text-sm text-slate-500">
                    Kişi bulunamadı.
                  </CommandEmpty>

                  {/* Sınıf Arkadaşları Grubu */}
                  {hasClassmatesLeft && (
                    <CommandGroup heading={`Sınıf Arkadaşlarım (${userClass}) - Zorunlu`}>
                      {classmates.map((profile) => (
                        <CommandItem
                          key={profile.id}
                          value={`${profile.first_name} ${profile.last_name} ${profile.class}`} // Arama için anahtar kelimeler
                          onSelect={() => {
                            setRecipientId(profile.id)
                            setOpen(false)
                          }}
                          className="cursor-pointer py-2.5"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4 text-primary",
                              recipientId === profile.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex items-center justify-between w-full">
                            <span className="font-medium">{profile.first_name} {profile.last_name}</span>
                            <Badge variant="secondary" className="text-[10px] bg-amber-50 text-amber-700 border border-amber-100">
                              {profile.class}
                            </Badge>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {hasClassmatesLeft && others.length > 0 && <CommandSeparator />}

                  {/* Diğer Sınıflar Grubu */}
                  {others.length > 0 && (
                    <CommandGroup heading="Diğer Sınıflar - İsteğe Bağlı">
                      {others.map((profile) => (
                        <CommandItem
                          key={profile.id}
                          value={`${profile.first_name} ${profile.last_name} ${profile.class}`}
                          onSelect={() => {
                            setRecipientId(profile.id)
                            setOpen(false)
                          }}
                          className="cursor-pointer py-2.5"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4 text-primary",
                              recipientId === profile.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex items-center justify-between w-full">
                            <span>{profile.first_name} {profile.last_name}</span>
                            <Badge variant="outline" className="text-[10px] text-slate-400">
                              {profile.class}
                            </Badge>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
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