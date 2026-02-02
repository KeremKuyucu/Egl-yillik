"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  AlertCircle,
  Send,
  Sparkles,
  Loader2,
  X,
  Check,
  ChevronsUpDown,

} from "lucide-react"
import { createTextAction } from "@/app/actions/texts"
import { cn } from "@/lib/utils"

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

// Renk paleti (İsim baş harflerine göre renk seçmek için)
const AVATAR_COLORS = [
  "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400",
  "bg-lime-100 text-lime-600 dark:bg-lime-900/30 dark:text-lime-400",
  "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  "bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400",
  "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400",
  "bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400",
  "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
  "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
  "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  "bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-900/30 dark:text-fuchsia-400",
  "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400",
  "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
]

// İsme göre sabit renk üreten yardımcı fonksiyon
const getColorFromName = (name: string) => {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

// Baş harfleri çıkaran yardımcı fonksiyon
const getInitials = (firstName: string, lastName: string) => {
  const first = (firstName || '').trim().charAt(0)
  const last = (lastName || '').trim().charAt(0)
  return `${first}${last}`.toUpperCase()
}

// İsmi düzgün birleştiren yardımcı fonksiyon (boşluk sorununu çözer)
const getFullName = (firstName: string, lastName: string) => {
  return [firstName, lastName].filter(n => n && n.trim()).join(' ')
}

export default function NewTextForm({ classmates, others, userClass, preSelectedId }: NewTextFormProps) {
  const [recipientId, setRecipientId] = useState(preSelectedId || "")
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const selectedProfile = [...classmates, ...others].find(p => p.id === recipientId)



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!recipientId) {
      setError("Lütfen bir kişi seçin")
      setIsLoading(false)
      return
    }

    try {
      const result = await createTextAction(recipientId, content)

      if (result.error) {
        setError(result.error)
        setIsLoading(false)
        return
      }

      router.push("/home")
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Bir hata oluştu")
      setIsLoading(false)
    }
  }

  const hasClassmatesLeft = classmates.length > 0

  return (
    <div className="space-y-8">
      {/* İlerleme Durumu - Alert */}
      {hasClassmatesLeft ? (
        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-start gap-3">
          <div className="bg-amber-500/20 p-2 rounded-full shrink-0 text-amber-600 dark:text-amber-400">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-400">Görev: Sınıf Arkadaşların Bekliyor!</h4>
            <p className="text-xs text-amber-600/90 dark:text-amber-500 mt-1 leading-relaxed">
              <span className="font-medium">{userClass}</span> sınıfından yazman gereken <span className="font-bold underline">{classmates.length} kişi</span> kaldı.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-center gap-3">
          <div className="bg-emerald-500/20 p-2 rounded-full text-emerald-600 dark:text-emerald-400">
            <Sparkles className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
            Harika! Kendi sınıfını tamamladın.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Kişi Seçimi */}
        <div className="space-y-2 flex flex-col">
          <Label className="text-sm font-medium text-foreground">
            Kime Yazıyorsun?
          </Label>

          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between h-14 bg-background border-input hover:bg-muted/50 text-foreground font-normal shadow-sm transition-colors px-3"
              >
                {selectedProfile ? (
                  <span className="flex items-center gap-3">
                    {/* SEÇİLEN KİŞİNİN AVATARI */}
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${getColorFromName(selectedProfile.first_name)}`}>
                      {getInitials(selectedProfile.first_name, selectedProfile.last_name)}
                    </div>
                    <div className="flex flex-col items-start text-sm">
                      <span className="font-semibold leading-none">{getFullName(selectedProfile.first_name, selectedProfile.last_name)}</span>
                      <span className="text-[10px] text-muted-foreground font-medium">{selectedProfile.class}</span>
                    </div>
                  </span>
                ) : (
                  <span className="text-muted-foreground">Bir arkadaşını ara...</span>
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>

            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
              <Command>
                <CommandInput placeholder="İsim veya sınıf ara..." />
                <CommandList>
                  <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                    Kişi bulunamadı.
                  </CommandEmpty>

                  {hasClassmatesLeft && (
                    <CommandGroup heading={`Sınıf Arkadaşlarım (${userClass})`}>
                      {classmates.map((profile) => (
                        <CommandItem
                          key={profile.id}
                          value={`${profile.first_name} ${profile.last_name} ${profile.class}`}
                          onSelect={() => {
                            setRecipientId(profile.id)
                            setOpen(false)
                          }}
                          className="cursor-pointer py-2.5 px-3"
                        >
                          <Check
                            className={cn(
                              "mr-3 h-4 w-4 text-primary shrink-0",
                              recipientId === profile.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex items-center gap-3 w-full">
                            {/* LİSTEDEKİ AVATAR */}
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm shrink-0 ${getColorFromName(profile.first_name)}`}>
                              {getInitials(profile.first_name, profile.last_name)}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">{getFullName(profile.first_name, profile.last_name)}</span>
                              <span className="text-[10px] text-muted-foreground">{profile.class}</span>
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {hasClassmatesLeft && others.length > 0 && <CommandSeparator />}

                  {others.length > 0 && (
                    <CommandGroup heading="Diğer Sınıflar">
                      {others.map((profile) => (
                        <CommandItem
                          key={profile.id}
                          value={`${profile.first_name} ${profile.last_name} ${profile.class}`}
                          onSelect={() => {
                            setRecipientId(profile.id)
                            setOpen(false)
                          }}
                          className="cursor-pointer py-2.5 px-3"
                        >
                          <Check
                            className={cn(
                              "mr-3 h-4 w-4 text-primary shrink-0",
                              recipientId === profile.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex items-center gap-3 w-full">
                            {/* LİSTEDEKİ AVATAR */}
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm shrink-0 ${getColorFromName(profile.first_name)}`}>
                              {getInitials(profile.first_name, profile.last_name)}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">{getFullName(profile.first_name, profile.last_name)}</span>
                              <span className="text-[10px] text-muted-foreground">{profile.class}</span>
                            </div>
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
          <div className="flex justify-between items-center">
            <Label htmlFor="content" className="text-sm font-medium text-foreground">
              Mesajın
            </Label>
            <span className="text-xs text-muted-foreground">İçinden geldiği gibi...</span>
          </div>

          <Textarea
            id="content"
            placeholder="Güzel bir anıdan bahset, gelecekte hatırlamasını istediğin bir not bırak..."
            required
            value={content}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
            className="min-h-[250px] resize-y bg-background border-input focus:ring-1 focus:ring-primary/20 text-base leading-relaxed p-4 shadow-sm transition-all"
          />
          <p className="text-xs text-right text-muted-foreground">
            {content.length} karakter
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive border border-destructive/20 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Butonlar */}
        <div className="flex gap-4 pt-4">
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1 h-12 shadow-sm text-base font-medium"
            size="lg"
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
            onClick={() => router.push("/home")}
            className="h-12 px-6 border-input text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="mr-2 h-4 w-4" />
            İptal
          </Button>
        </div>
      </form>
    </div>
  )
}