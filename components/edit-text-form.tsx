"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Trash2, Save, Loader2, X, AlertTriangle } from "lucide-react"

// Interface'i gevşettik çünkü parent'tan gelen veri karmaşık olabilir.
// Bize sadece id ve content lazım.
interface EditTextFormProps {
  text: {
    id: string
    content: string
    [key: string]: any
  }
}

export default function EditTextForm({ text }: EditTextFormProps) {
  const [content, setContent] = useState(text.content)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from("texts")
        .update({
          content,
          updated_at: new Date().toISOString() // Güncellenme tarihini yenile
        })
        .eq("id", text.id)

      if (updateError) throw updateError

      router.push("/dashboard")
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Bir hata oluştu")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    const supabase = createClient()
    setIsDeleting(true)
    setError(null)

    try {
      const { error: deleteError } = await supabase.from("texts").delete().eq("id", text.id)

      if (deleteError) throw deleteError

      router.push("/dashboard")
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Bir hata oluştu")
      setIsDeleting(false)
    }
  }

  return (
    <form onSubmit={handleUpdate} className="space-y-8">

      {/* Yazı Alanı */}
      <div className="space-y-3">
        <Label htmlFor="content" className="text-sm font-semibold text-slate-700 pl-1">
          Anı Metni
        </Label>
        <Textarea
          id="content"
          placeholder="İçinden geçenleri, unutamadığın o anları buraya yaz..."
          required
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[300px] resize-y bg-slate-50 border-slate-200 focus:bg-white focus:border-primary/50 text-base leading-relaxed p-4 shadow-inner transition-all duration-200"
        />
        <p className="text-xs text-right text-slate-400">
          {content.length} karakter
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 border border-red-100 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Aksiyon Butonları */}
      <div className="flex flex-col sm:flex-row gap-4 pt-2">
        <Button
          type="submit"
          disabled={isLoading}
          className="flex-1 shadow-md hover:shadow-lg hover:shadow-primary/20 transition-all h-11 text-base"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Kaydediliyor...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Değişiklikleri Kaydet
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard")}
          className="h-11 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
        >
          <X className="mr-2 h-4 w-4" />
          Vazgeç
        </Button>
      </div>

      {/* Tehlikeli Bölge (Silme) */}
      <div className="border-t border-slate-100 pt-8 mt-8">
        <div className="flex items-center justify-between p-4 bg-red-50/50 rounded-xl border border-red-100/50">
          <div className="text-sm">
            <h4 className="font-semibold text-red-900">Bu anıyı silmek mi istiyorsun?</h4>
            <p className="text-red-700/80 text-xs mt-1">Bu işlem geri alınamaz.</p>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="bg-white border border-red-200 text-red-600 hover:bg-red-600 hover:text-white shadow-sm transition-all"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Sil
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Emin misin?</AlertDialogTitle>
                <AlertDialogDescription>
                  Bu işlem geri alınamaz. Yazdığın bu anı kalıcı olarak silinecektir ve arkadaşın bunu bir daha göremeyecektir.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>İptal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  Evet, Sil
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </form>
  )
}