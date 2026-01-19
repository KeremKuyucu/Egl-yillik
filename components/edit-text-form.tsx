"use client"

import type React from "react"
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
import { Trash2, Save, Loader2, AlertTriangle, Undo2 } from "lucide-react"
import { updateTextAction, deleteMyTextAction } from "@/app/actions"

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
    setIsLoading(true)
    setError(null)

    try {
      const result = await updateTextAction(text.id, content)

      if (result.error) {
        setError(result.error)
      } else {
        router.push("/dashboard")
        router.refresh()
      }
    } catch (err) {
      setError("Beklenmeyen bir hata oluştu")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)

    try {
      const result = await deleteMyTextAction(text.id)

      if (result.error) {
        setError(result.error)
        setIsDeleting(false)
      } else {
        router.push("/dashboard")
        router.refresh()
      }
    } catch (err) {
      setError("Beklenmeyen bir hata oluştu")
      setIsDeleting(false)
    }
  }

  return (
    <form onSubmit={handleUpdate} className="space-y-8">

      {/* Yazı Alanı */}
      <div className="space-y-3">
        <Label htmlFor="content" className="text-sm font-medium text-foreground pl-1">
          Anı Metni
        </Label>
        <Textarea
          id="content"
          placeholder="İçinden geçenleri, unutamadığın o anları buraya yaz..."
          required
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[300px] resize-y bg-background border-input focus:ring-1 focus:ring-primary/20 text-base leading-relaxed p-4 shadow-sm transition-all"
        />
        <p className="text-xs text-right text-muted-foreground">
          {content.length} karakter
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive border border-destructive/20 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Aksiyon Butonları */}
      <div className="flex flex-col sm:flex-row gap-4 pt-2">
        <Button
          type="submit"
          disabled={isLoading}
          className="flex-1 shadow-sm h-11 text-base font-medium"
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
          className="h-11 border-input text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <Undo2 className="mr-2 h-4 w-4" />
          Vazgeç
        </Button>
      </div>

      {/* Tehlikeli Bölge (Silme) */}
      <div className="border-t border-border pt-8 mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-destructive/5 rounded-xl border border-destructive/20 gap-4">
          <div className="text-sm">
            <h4 className="font-semibold text-destructive dark:text-red-400">Bu anıyı silmek mi istiyorsun?</h4>
            <p className="text-muted-foreground text-xs mt-1">
              Bu işlem geri alınamaz ve metin kalıcı olarak yok olur.
            </p>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors whitespace-nowrap"
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
                  Bu işlem geri alınamaz. Yazdığın bu anı veritabanından kalıcı olarak silinecektir.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>İptal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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